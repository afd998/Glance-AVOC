import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useEvents } from './useEvents';
import { useAllShiftBlocks } from './useShiftBlocks';
import { isUserEventOwner } from '../utils/eventUtils';
import { parseEventResources } from '../utils/eventUtils';
import { createPanoptoCheckNotification } from '../utils/notificationUtils';
import { supabase } from '../lib/supabase';
import { useQueryClient } from '@tanstack/react-query';

const PANOPTO_CHECK_INTERVAL = 30 * 60 * 1000; // 30 minutes in milliseconds

interface PanoptoCheck {
  id: string;
  eventId: number;
  eventName: string;
  checkNumber: number;
  createdAt: string;
  completed: boolean;
  roomName: string;
  instructorName?: string;
}

export const usePanoptoChecks = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Use local date for current day events
  const [localDate, setLocalDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate());
  });

  // Update date every minute
  useEffect(() => {
    const updateDate = () => {
      const today = new Date();
      const newDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      setLocalDate(newDate);
    };

    updateDate();
    const interval = setInterval(updateDate, 60000);
    return () => clearInterval(interval);
  }, []);
  
  const { events } = useEvents(localDate);
  const { data: allShiftBlocks = [] } = useAllShiftBlocks();
  
  const memoizedAllShiftBlocks = useMemo(() => allShiftBlocks, [allShiftBlocks]);
  const [activeChecks, setActiveChecks] = useState<PanoptoCheck[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentChecks, setSentChecks] = useState<Set<string>>(new Set()); // Temporary tracking

  // Check if an event has recording resources
  const hasRecordingResource = useCallback((event: any) => {
    if (!event.resources) {
      console.log(`🔍 No resources found for ${event.event_name}`);
      return false;
    }
    
    const resourceFlags = parseEventResources(event);
    const hasRecording = resourceFlags.resources.some((resource: any) => 
      resource.itemName?.toLowerCase().includes('panopto') ||
      resource.itemName?.toLowerCase().includes('recording')
    );
    
 
    
    return hasRecording;
  }, []);

  // Check if an event is currently happening
  const isEventCurrentlyActive = useCallback((event: any) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Check if event is today
    if (event.date !== today) {
      console.log(`🔍 Event ${event.event_name} is not today:`, { eventDate: event.date, today });
      return false;
    }
    
    // Check if current time is between start and end time
    const currentTime = now.toTimeString().split(' ')[0]; // HH:MM:SS format
    const isActive = currentTime >= event.start_time && currentTime <= event.end_time;
    
    console.log(`🔍 Event ${event.event_name} active status:`, {
      currentTime,
      startTime: event.start_time,
      endTime: event.end_time,
      isActive
    });
    
    return isActive;
  }, []);

  // Update event's panopto_checks JSONB column
  const updateEventChecks = useCallback(async (eventId: number, checkNumber: number, completed: boolean) => {
    try {
      // First get the current event to understand how many checks should exist
      const { data: event, error } = await supabase
        .from('events')
        .select('panopto_checks, start_time, end_time, date')
        .eq('id', eventId)
        .single();

      if (error || !event) {
        console.error('Error fetching event for check update:', error);
        return false;
      }

      // Calculate total number of checks this event should have
      let totalChecks = 0;
      if (event.start_time && event.end_time) {
        const eventStart = new Date(`${event.date}T${event.start_time}`);
        const eventEnd = new Date(`${event.date}T${event.end_time}`);
        const eventDuration = eventEnd.getTime() - eventStart.getTime();
        totalChecks = Math.floor(eventDuration / PANOPTO_CHECK_INTERVAL);
      }

      // Initialize or get existing checks array
      let checks = (event?.panopto_checks as boolean[] | null) || [];
      
      // If no array exists or it's shorter than needed, initialize properly
      if (checks.length === 0 || checks.length < totalChecks) {
        // Create new array with correct length, preserving existing values
        const newChecks = new Array(totalChecks).fill(false);
        // Copy over existing values
        for (let i = 0; i < checks.length; i++) {
          newChecks[i] = checks[i];
        }
        checks = newChecks;
      }

      const checkIndex = checkNumber - 1; // Convert to 0-based index
      
      // Ensure the index is valid
      if (checkIndex < 0 || checkIndex >= checks.length) {
        console.error(`Invalid check number ${checkNumber} for event with ${checks.length} checks`);
        return false;
      }

      // Update the specific check
      checks[checkIndex] = completed;

      // Update the event
      const { error: updateError } = await supabase
        .from('events')
        .update({ panopto_checks: checks } as any)
        .eq('id', eventId);

      if (updateError) {
        console.error('Error updating event checks:', updateError);
        return false;
      }

      console.log(`Updated check ${checkNumber} to ${completed} for event ${eventId}:`, checks);
      return true;
    } catch (error) {
      console.error('Error in updateEventChecks:', error);
      return false;
    }
  }, []);

  // Check if a check was sent/completed in database
  const isCheckSent = useCallback(async (eventId: number, checkNumber: number): Promise<boolean> => {
    try {
      const { data: event, error } = await supabase
        .from('events')
        .select('panopto_checks')
        .eq('id', eventId)
        .single();

      if (error || !event) return false;

      const checks = (event.panopto_checks as boolean[] | null) || [];
      const checkIndex = checkNumber - 1;

      return checks[checkIndex] === true;
    } catch (error) {
      console.error('Error checking if check was sent:', error);
      return false;
    }
  }, []);

  const markCheckAsSent = useCallback(async (eventId: number, checkNumber: number) => {
    await updateEventChecks(eventId, checkNumber, true);
    // Also update local tracking for immediate UI feedback
    const checkId = `${eventId}-check-${checkNumber}`;
    setSentChecks(prev => new Set(Array.from(prev).concat([checkId])));
  }, [updateEventChecks]);



  // Send both in-app and system notifications for a check
  const sendPanoptoCheck = useCallback(async (event: any, checkNumber: number) => {
    if (!user) return;

    const checkId = `${event.id}-check-${checkNumber}`;
    console.log(`🎯 Starting to send Panopto check:`, { checkId, eventName: event.event_name });
    
    try {
      // Create in-app notification
      console.log(`📝 Creating in-app notification for ${event.event_name}`);
      await createPanoptoCheckNotification(
        user.id,
        event.id,
        event.event_name,
        checkNumber,
        event.room_name,
        event.instructor_name
      );
      console.log(`✅ In-app notification created for ${event.event_name}`);

      // Create system notification
      if ('Notification' in window && Notification.permission === 'granted') {
        console.log(`🔔 Creating system notification for ${event.event_name}`);
        const notification = new Notification(`Panopto Check #${checkNumber}`, {
          body: `Time to check Panopto for ${event.event_name} in ${event.room_name}`,
          icon: '/wildcat2.png',
          badge: '/wildcat2.png',
          tag: checkId,
          requireInteraction: false,
          silent: false
        });

        // Auto-close after 15 seconds
        setTimeout(() => {
          notification.close();
        }, 15000);

        // Handle notification click
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
        console.log(`✅ System notification created for ${event.event_name}`);
      } else {
        console.log(`⚠️ System notification not created - permission: ${Notification.permission}`);
      }

      // Mark check as sent in database
      console.log(`💾 Marking check as sent in database for ${event.event_name}`);
      await markCheckAsSent(event.id, checkNumber);
      console.log(`✅ Check marked as sent in database for ${event.event_name}`);

      // Add to active checks for UI display
      const newCheck: PanoptoCheck = {
        id: checkId,
        eventId: event.id,
        eventName: event.event_name,
        checkNumber,
        createdAt: new Date().toISOString(),
        completed: false,
        roomName: event.room_name,
        instructorName: event.instructor_name
      };

      setActiveChecks(prev => {
        const existing = prev.find(check => check.id === checkId);
        if (existing) return prev;
        return [...prev, newCheck];
      });
      console.log(`✅ Added to active checks UI for ${event.event_name}`);

      console.log('🎉 Successfully sent Panopto check:', { eventName: event.event_name, checkNumber });
    } catch (error) {
      console.error('❌ Error sending Panopto check:', error);
    }
  }, [user, markCheckAsSent]);

  // Main timer that checks for due Panopto checks
  useEffect(() => {
    if (!user || !events) return;

    const checkForDuePanoptoChecks = async () => {
      const now = new Date();
      console.log('🔍 Checking for due Panopto checks...', { 
        user: user.id, 
        eventsCount: events.length,
        currentTime: now.toISOString()
      });

      for (const event of events) {
        // Skip if not a recording event
        if (!hasRecordingResource(event)) {
          
          continue;
        }

        // Skip if user is not assigned
        const isAssigned = isUserEventOwner(event, user.id, memoizedAllShiftBlocks);
        if (!isAssigned) {
          console.log(`⏭️ Skipping ${event.event_name} - user not assigned:`, {
            userId: user.id,
            eventName: event.event_name,
            shiftBlocksCount: memoizedAllShiftBlocks.length
          });
          continue;
        }

        // Skip if event is not currently active
        if (!isEventCurrentlyActive(event)) {
          console.log(`⏭️ Skipping ${event.event_name} - not currently active`);
          continue;
        }

        console.log(`✅ Found active recording event: ${event.event_name}`);

        // Calculate which check number should be due
        const eventStart = new Date(`${event.date}T${event.start_time}`);
        const timeSinceStart = now.getTime() - eventStart.getTime();
        const checkNumber = Math.floor(timeSinceStart / PANOPTO_CHECK_INTERVAL) + 1;

        // Skip if no checks are due yet
        if (checkNumber < 1) {
          console.log(`⏭️ Skipping ${event.event_name} - no checks due yet (check #${checkNumber})`);
          continue;
        }

        // Calculate when this check should have been sent
        const checkDueTime = eventStart.getTime() + (checkNumber - 1) * PANOPTO_CHECK_INTERVAL;
        const timeUntilCheck = checkDueTime - now.getTime();

        console.log(`📊 Check analysis for ${event.event_name}:`, {
          checkNumber,
          timeSinceStart: Math.floor(timeSinceStart / 60000), // minutes
          timeUntilCheck: Math.floor(timeUntilCheck / 60000), // minutes
          isDue: timeUntilCheck <= 0 && timeUntilCheck > -60000
        });

        // Check is due if it's within the last minute and hasn't been sent
        if (timeUntilCheck <= 0 && timeUntilCheck > -60000) { // Within last minute
          const alreadySent = await isCheckSent(event.id, checkNumber);
          
          console.log(`🔍 Check #${checkNumber} for ${event.event_name}:`, {
            alreadySent,
            willSend: !alreadySent
          });
          
          if (!alreadySent) {
            console.log(`🚀 Sending Panopto check #${checkNumber} for ${event.event_name}`);
            await sendPanoptoCheck(event, checkNumber);
          }
        }
      }
    };

    // Check immediately and then every minute
    checkForDuePanoptoChecks();
    const interval = setInterval(checkForDuePanoptoChecks, 60000);

    return () => clearInterval(interval);
  }, [user, events, memoizedAllShiftBlocks, hasRecordingResource, isEventCurrentlyActive, isUserEventOwner, isCheckSent, sendPanoptoCheck]);

  // Complete a Panopto check
  const completePanoptoCheck = useCallback(async (checkId: string) => {
    const check = activeChecks.find(c => c.id === checkId);
    if (!check || !user) return;

    try {
      // Update database - mark check as completed
      const success = await updateEventChecks(check.eventId, check.checkNumber, true);
      
      if (!success) {
        console.error('Failed to update check in database');
        return;
      }

      // Create completion notification
      await createPanoptoCheckNotification(
        user.id,
        check.eventId,
        `${check.eventName} - Check Completed`,
        check.checkNumber,
        check.roomName,
        check.instructorName
      );

      // Update local state
      setActiveChecks(prev => 
        prev.map(c => 
          c.id === checkId 
            ? { ...c, completed: true }
            : c
        ).filter(c => !c.completed) // Remove completed checks from active list
      );

      console.log('Completed Panopto check:', checkId);
    } catch (error) {
      console.error('Error completing Panopto check:', error);
    }
  }, [user, activeChecks, updateEventChecks]);

  // Test function
  const testPanoptoCheck = useCallback(async () => {
    if (!user || !events || events.length === 0) {
      console.log('❌ No events available for testing');
      return;
    }
    
    // Find the first event with recording resources that the user is assigned to
    const testEvent = events.find(event => {
      const hasRecording = hasRecordingResource(event);
      const isAssigned = isUserEventOwner(event, user.id, memoizedAllShiftBlocks);
      return hasRecording && isAssigned;
    });
    
    if (!testEvent) {
      console.log('❌ No suitable events found for testing (need recording resources + user assignment)');
      return;
    }
    
    console.log('🧪 Sending test Panopto check for real event:', testEvent.event_name);
    await sendPanoptoCheck(testEvent, 1);
  }, [user, events, hasRecordingResource, isUserEventOwner, memoizedAllShiftBlocks, sendPanoptoCheck]);

  // Clear all checks (for UI)
  const clearPanoptoChecks = useCallback(() => {
    setActiveChecks([]);
    setSentChecks(new Set()); // Clear tracking
  }, []);

  // Check if all Panopto checks are complete for an event
  const areAllChecksComplete = useCallback(async (eventId: number): Promise<boolean> => {
    try {
      const { data: event, error } = await supabase
        .from('events')
        .select('panopto_checks, start_time, end_time, date')
        .eq('id', eventId)
        .single();

      if (error || !event) {
        console.error('Error fetching event for completion check:', error);
        return false;
      }

      // Calculate total number of checks this event should have
      let totalChecks = 0;
      if (event.start_time && event.end_time) {
        const eventStart = new Date(`${event.date}T${event.start_time}`);
        const eventEnd = new Date(`${event.date}T${event.end_time}`);
        const eventDuration = eventEnd.getTime() - eventStart.getTime();
        totalChecks = Math.floor(eventDuration / PANOPTO_CHECK_INTERVAL);
      }

      if (totalChecks === 0) return true; // No checks needed

      // Get checks array
      const checks = (event?.panopto_checks as boolean[] | null) || [];
      
      // If checks array is shorter than expected, pad with false
      const paddedChecks = [...checks];
      while (paddedChecks.length < totalChecks) {
        paddedChecks.push(false);
      }

      // Check if all checks are complete
      return paddedChecks.slice(0, totalChecks).every(check => check === true);
    } catch (error) {
      console.error('Error checking if all checks are complete:', error);
      return false;
    }
  }, []);

  // Complete a specific Panopto check for an event (with new table structure)
  const completePanoptoCheckForEvent = useCallback(async (eventId: number, checkNumber: number, eventDate: string) => {
    try {
      // Get event details to calculate the check time
      const { data: eventData, error: fetchError } = await supabase
        .from('events')
        .select('start_time, end_time, date')
        .eq('id', eventId)
        .single();

      if (fetchError || !eventData) {
        console.error('Error fetching event for completion:', fetchError);
        return false;
      }

      // Calculate the check time based on check number
      let checkTime: string | null = null;
      if (eventData.start_time) {
        const eventStart = new Date(`${eventData.date}T${eventData.start_time}`);
        const checkTimeDate = new Date(eventStart.getTime() + (checkNumber - 1) * PANOPTO_CHECK_INTERVAL);
        checkTime = checkTimeDate.toTimeString().split(' ')[0]; // HH:MM:SS format
      }

      if (!checkTime) {
        console.error('Could not calculate check time');
        return false;
      }

      // Update the panopto_checks table
      const { error: updateError } = await supabase
        .from('panopto_checks')
        .update({
          completed_time: new Date().toTimeString().split(' ')[0], // Current time
          completed_by_user_id: user?.id || null,
          status: 'completed', // Mark as completed
          updated_at: new Date().toISOString()
        })
        .eq('event_id', eventId)
        .eq('check_time', checkTime)
        .is('completed_time', null); // Only update if not already completed

      if (updateError) {
        console.error('Error updating check completion:', updateError);
        return false;
      }

      console.log(`Successfully completed check ${checkNumber} for event ${eventId} at ${checkTime}`);
      return true;
    } catch (error) {
      console.error('Error completing check:', error);
      return false;
    }
  }, [user]);

  // Hook to check if all checks are complete for a specific event
  const useEventChecksComplete = (eventId: number, startTime?: string, endTime?: string, date?: string) => {
    const [isComplete, setIsComplete] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
      const checkCompletionStatus = async () => {
        if (!eventId || !startTime || !endTime || !date) {
          setIsComplete(false);
          setIsLoading(false);
          return;
        }

        try {
          setIsLoading(true);
          
          // Calculate expected number of checks
          const PANOPTO_CHECK_INTERVAL = 30 * 60 * 1000; // 30 minutes in milliseconds
          const eventStart = new Date(`${date}T${startTime}`);
          const eventEnd = new Date(`${date}T${endTime}`);
          const eventDuration = eventEnd.getTime() - eventStart.getTime();
          const totalChecks = Math.floor(eventDuration / PANOPTO_CHECK_INTERVAL);

          if (totalChecks === 0) {
            setIsComplete(true);
            setIsLoading(false);
            return;
          }

          // Fetch data from the panopto_checks table
          const { data: checksData, error: fetchError } = await supabase
            .from('panopto_checks')
            .select('completed_time')
            .eq('event_id', eventId);

          if (fetchError) {
            console.error('Error fetching panopto checks:', fetchError);
            setError(fetchError as Error);
            setIsLoading(false);
            return;
          }

          // Count completed checks
          const completedCount = checksData?.filter(check => check.completed_time !== null).length || 0;
          const allComplete = completedCount >= totalChecks;

          setIsComplete(allComplete);
          setIsLoading(false);
          setError(null);

        } catch (err) {
          console.error('Error checking completion status:', err);
          setError(err as Error);
          setIsLoading(false);
        }
      };

      checkCompletionStatus();
    }, [eventId, startTime, endTime, date]);

    return { isComplete, isLoading, error };
  };

  return {
    panoptoChecks: activeChecks, // For backward compatibility
    activeChecks,
    completedChecks: [], // Not tracking completed checks in memory
    isLoading,
    error,
    completePanoptoCheck,
    clearPanoptoChecks,
    testPanoptoCheck,
    areAllChecksComplete,
    completePanoptoCheckForEvent,
    useEventChecksComplete
  };
};