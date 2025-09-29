import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useEvents } from './useEvents';
import { useEvent } from '../features/Event/hooks/useEvent';
import { useProfile } from './useProfile';
import { useShiftBlocks } from '../features/SessionAssignments/hooks/useShiftBlocks';
import { isUserEventOwner } from '../utils/eventUtils';
import { Database } from '../types/supabase';

import { supabase } from '../lib/supabase';
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';

const PANOPTO_CHECK_INTERVAL = 30 * 60 * 1000; // 30 minutes in milliseconds

// Hook to get panopto checks data for a specific event with realtime updates
export const usePanoptoChecksData = (eventId: number) => {
  const queryClient = useQueryClient();
  const queryClientRef = useRef(queryClient);

  // Keep the ref updated
  queryClientRef.current = queryClient;

  const query = useQuery({
    queryKey: ['panoptoChecks', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('panopto_checks')
        .select(`
          check_time, 
          completed_time, 
          completed_by_user_id,
          status,
          profiles!panopto_checks_completed_by_user_id_fkey(id, name)
        `)
        .eq('event_id', eventId)
        .order('check_time');

      if (error) throw error;
      return data || [];
    },
    enabled: !!eventId,
    staleTime: 120000, // Consider data stale after 2 minutes
  });

  // Set up realtime subscription for this specific event
  useEffect(() => {
    if (!eventId) return;

    let channel: any = null;

    const setupBroadcast = async () => {

      // Set auth for broadcast (required for authorization)
      await supabase.realtime.setAuth();
      
      // Use Broadcast approach - listen to topic for this specific event
      channel = supabase
        .channel(`topic:${eventId}`)
        .on('broadcast', { event: 'INSERT' }, (payload) => {
          queryClientRef.current.invalidateQueries({ 
            queryKey: ['panoptoChecks', eventId] 
          });
        })
        .on('broadcast', { event: 'UPDATE' }, (payload) => {
          queryClientRef.current.invalidateQueries({ 
            queryKey: ['panoptoChecks', eventId] 
          });
        })
        .on('broadcast', { event: 'DELETE' }, (payload) => {
          queryClientRef.current.invalidateQueries({ 
            queryKey: ['panoptoChecks', eventId] 
          });
        })
        .subscribe((status) => {
          console.log(`🔴 Broadcast subscription status:`, status);
        });
    };

    setupBroadcast();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [eventId]);

  return query;
};

// Hook to handle Panopto check notifications and timer
export const usePanoptoNotifications = (date: Date) => {
  const { user } = useAuth();
  const dateString = date.toISOString().split('T')[0];
  const { data: allShiftBlocks = [] } = useShiftBlocks(dateString);
  
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
  
  const { data: events } = useEvents(localDate);
  
  const memoizedAllShiftBlocks = useMemo(() => allShiftBlocks, [allShiftBlocks]);
  
  // Create stable keys so effects don't restart on equal data with new references
  const eventIdsKey = useMemo(() => {
    if (!events || events.length === 0) return '';
    try {
      return events.map((e: any) => e.id).join(',');
    } catch {
      return String(events.length);
    }
  }, [events]);
  
  const shiftBlocksKey = useMemo(() => {
    if (!memoizedAllShiftBlocks || memoizedAllShiftBlocks.length === 0) return '';
    try {
      return memoizedAllShiftBlocks
        .map((b: any) => `${b.id ?? 'x'}-${b.updated_at ?? ''}`)
        .join(',');
    } catch {
      return String(memoizedAllShiftBlocks.length);
    }
  }, [memoizedAllShiftBlocks]);
  
  // Memoize the isUserEventOwner function to prevent infinite loops
  const memoizedIsUserEventOwner = useCallback((event: any, userId: string, shiftBlocks: any[]) => {
    return isUserEventOwner(event, userId, shiftBlocks);
  }, []);

  // Check if an event has recording resources
  const hasRecordingResource = useCallback((event: any) => {
    if (!event.resources) {
      console.log(`🔍 No resources found for ${event.event_name}`);
      return false;
    }
    
    // Direct check for recording resources without full parsing
    const hasRecording = event.resources.some((resource: any) => 
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

  // Check if a check was sent/completed in database
  const isCheckSent = useCallback(async (eventId: number, checkNumber: number): Promise<boolean> => {
    try {
      // Get event details from the existing events data
      const event = events?.find(e => e.id === eventId);

      if (!event) return false;

      // Calculate the check time based on check number
      let checkTime: string | null = null;
      if (event.start_time) {
        const eventStart = new Date(`${event.date}T${event.start_time}`);
        const checkTimeDate = new Date(eventStart.getTime() + (checkNumber - 1) * PANOPTO_CHECK_INTERVAL);
        checkTime = checkTimeDate.toTimeString().split(' ')[0]; // HH:MM:SS format
      }

      if (!checkTime) return false;

      // Check if the check exists and is completed in the panopto_checks table
      const { data: checkData, error: checkError } = await supabase
        .from('panopto_checks')
        .select('completed_time')
        .eq('event_id', eventId)
        .eq('check_time', checkTime)
        .single();

      if (checkError || !checkData) return false;

      return checkData.completed_time !== null;
    } catch (error) {
      console.error('Error checking if check was sent:', error);
      return false;
    }
  }, [events]);

  const markCheckAsSent = useCallback(async (eventId: number, checkNumber: number) => {
    // Update the panopto_checks table to mark as sent
    try {
      const event = events?.find(e => e.id === eventId);
      if (!event) return;

      let checkTime: string | null = null;
      if (event.start_time) {
        const eventStart = new Date(`${event.date}T${event.start_time}`);
        const checkTimeDate = new Date(eventStart.getTime() + (checkNumber - 1) * PANOPTO_CHECK_INTERVAL);
        checkTime = checkTimeDate.toTimeString().split(' ')[0];
      }

      if (!checkTime) return;

      await supabase
        .from('panopto_checks')
        .update({
          completed_time: null,
          completed_by_user_id: null,
          status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('event_id', eventId)
        .eq('check_time', checkTime);
    } catch (error) {
      console.error('Error marking check as sent:', error);
    }
  }, [events]);

  // Send both in-app and system notifications for a check
  const sendPanoptoCheck = useCallback(async (event: any, checkNumber: number) => {
    if (!user) return;

    const checkId = `${event.id}-check-${checkNumber}`;
    console.log(`🎯 Starting to send Panopto check:`, { checkId, eventName: event.event_name });
    
    try {
      // Create system notification only (no in-app notifications for Panopto checks)
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

      for (const event of events) {
        // Skip if not a recording event
        if (!hasRecordingResource(event)) {
          continue;
        }

        // Skip if user is not assigned
        const isAssigned = memoizedIsUserEventOwner(event, user.id, memoizedAllShiftBlocks);
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
   }, [user?.id, eventIdsKey, shiftBlocksKey, hasRecordingResource, memoizedIsUserEventOwner, isEventCurrentlyActive, isCheckSent, sendPanoptoCheck, memoizedAllShiftBlocks]);
};

// Hook to complete a specific Panopto check for an event
export const useCompletePanoptoCheckForEvent = (eventId: number | null) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Use the useEvent hook to get event data
  const { data: eventData, isLoading: eventLoading, error: eventError } = useEvent(eventId);
  
  // Get current user's profile data for optimistic updates
  const { profile: currentUserProfile } = useProfile();

  const mutation = useMutation({
    mutationFn: async ({ checkNumber }: { checkNumber: number }) => {
      if (!eventData) {
        throw new Error('Event data not available');
      }

      // Calculate the check time based on check number
      let checkTime: string | null = null;
      if (eventData.start_time) {
        const eventStart = new Date(`${eventData.date}T${eventData.start_time}`);
        const checkTimeDate = new Date(eventStart.getTime() + (checkNumber - 1) * PANOPTO_CHECK_INTERVAL);
        checkTime = checkTimeDate.toTimeString().split(' ')[0]; // HH:MM:SS format
      }

      if (!checkTime) {
        throw new Error('Could not calculate check time');
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
        .eq('event_id', eventId!)
        .eq('check_time', checkTime)
        .is('completed_time', null); // Only update if not already completed

      if (updateError) {
        throw new Error(`Error updating check completion: ${updateError.message}`);
      }

      return { eventId: eventId!, checkNumber, checkTime };
    },
    onMutate: async ({ checkNumber }) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['panoptoChecks', eventId] });

      // Snapshot the previous value
      const previousChecks = queryClient.getQueryData(['panoptoChecks', eventId]);

      // Optimistically update the cache
      queryClient.setQueryData(['panoptoChecks', eventId], (old: any) => {
        if (!old) return old;
        
        return old.map((check: any) => {
          // Calculate the check time for this check number
          if (eventData?.start_time) {
            const eventStart = new Date(`${eventData.date}T${eventData.start_time}`);
            const checkTimeDate = new Date(eventStart.getTime() + (checkNumber - 1) * PANOPTO_CHECK_INTERVAL);
            const expectedCheckTime = checkTimeDate.toTimeString().split(' ')[0];
            
            // If this is the check being completed, update it optimistically
            if (check.check_time === expectedCheckTime) {
              return {
                ...check,
                completed_time: new Date().toTimeString().split(' ')[0],
                completed_by_user_id: user?.id || null,
                status: 'completed',
                updated_at: new Date().toISOString(),
                // Include profile data to prevent ID flashing
                profiles: currentUserProfile ? {
                  id: currentUserProfile.id,
                  name: currentUserProfile.name
                } : null
              };
            }
          }
          return check;
        });
      });

      // Return a context object with the snapshotted value
      return { previousChecks };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousChecks) {
        queryClient.setQueryData(['panoptoChecks', eventId], context.previousChecks);
      }
    },
    onSettled: () => {
      // Always refetch after error or success to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ['panoptoChecks', eventId] });
      queryClient.invalidateQueries({ queryKey: ['allPanoptoChecks'] });
    }
  });

  return {
    ...mutation,
    eventData,
    eventLoading,
    eventError,
    // Helper function to complete a check
    completeCheck: (checkNumber: number) => {
      if (!eventId) {
        console.error('No event ID provided');
        return;
      }
      mutation.mutate({ checkNumber });
    }
  };
};


// Hook to check if all checks are complete for a specific event
export const useEventChecksComplete = (eventId: number, startTime?: string, endTime?: string, date?: string) => {
  // Use the existing usePanoptoChecksData hook instead of direct Supabase calls
  const { data: checksData, isLoading, error } = usePanoptoChecksData(eventId);

  const isComplete = useMemo(() => {
    if (!eventId || !startTime || !endTime || !date || !checksData) {
      return false;
    }

    try {
      // Calculate expected number of checks
      const eventStart = new Date(`${date}T${startTime}`);
      const eventEnd = new Date(`${date}T${endTime}`);
      const eventDuration = eventEnd.getTime() - eventStart.getTime();
      const totalChecks = Math.floor(eventDuration / PANOPTO_CHECK_INTERVAL);

      if (totalChecks === 0) {
        return true;
      }

      // Count completed checks
      const completedCount = checksData.filter(check => check.completed_time !== null).length;
      return completedCount >= totalChecks;

    } catch (err) {
      console.error('Error checking completion status:', err);
      return false;
    }
  }, [eventId, startTime, endTime, date, checksData]);

  return { isComplete, isLoading, error };
};

type Event = Database['public']['Tables']['events']['Row'];

export const useEventOverduePanoptoChecks = (event: Event) => {
  // Current time that updates every 5 minutes to trigger overdue recalculations
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 300000); // Update every 5 minutes
    
    return () => clearInterval(interval);
  }, []);
  // Check if an event has recording resources
  const hasRecordingResource = useMemo(() => {
    if (!event.resources || !Array.isArray(event.resources)) return false;
    
    return event.resources.some((resource: any) => 
      resource.itemName?.toLowerCase().includes('panopto') ||
      resource.itemName?.toLowerCase().includes('recording')
    );
  }, [event.resources]);

  // Check if an event is currently active (happening now or within 2 hours after end)
  const isEventCurrentlyActive = useMemo(() => {
    const now = new Date();
    const today = now.getFullYear() + '-' + 
                  String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                  String(now.getDate()).padStart(2, '0');
    
    if (!event.date) return false;
    
    // Create event start and end times in local timezone
    const eventStart = new Date(`${event.date}T${event.start_time}`);
    const eventEnd = new Date(`${event.date}T${event.end_time}`);
    const twoHoursAfterEnd = new Date(eventEnd.getTime() + (2 * 60 * 60 * 1000));
    
    // Event is active if it's today OR we're within 2 hours after the event ended
    const isToday = event.date === today;
    const isWithinTwoHoursAfterEnd = now <= twoHoursAfterEnd;
    
    if (!isToday && !isWithinTwoHoursAfterEnd) {
      return false;
    }
    
    // Check if start_time and end_time exist
    if (!event.start_time || !event.end_time) {
      return false;
    }
    
    // Check if current time is between start and end time, or within 2 hours after end
    return now >= eventStart && now <= twoHoursAfterEnd;
  }, [event.date, event.start_time, event.end_time]);

  // Get panopto checks for this specific event using the existing hook
  const { data: panoptoChecks, isLoading } = usePanoptoChecksData(event.id);

  // Check if this event has overdue checks
  const hasOverdueChecks = useMemo(() => {
    // Only check for overdue if event has recording resources and is currently active
    if (!hasRecordingResource || !isEventCurrentlyActive) return false;
    if (!panoptoChecks || panoptoChecks.length === 0) return false;
    
    const now = currentTime;
    
    // Calculate expected checks for this event
    if (!event.start_time || !event.end_time || !event.date) return false;
    
    const eventStart = new Date(`${event.date}T${event.start_time}`);
    const eventEnd = new Date(`${event.date}T${event.end_time}`);
    const eventDuration = eventEnd.getTime() - eventStart.getTime();
    const totalChecks = Math.floor(eventDuration / PANOPTO_CHECK_INTERVAL);

    if (totalChecks === 0) return false;

    // Check each expected check for overdue status
    for (let i = 0; i < totalChecks; i++) {
      const checkNumber = i + 1;
      const scheduledTime = new Date(eventStart.getTime() + (i * PANOPTO_CHECK_INTERVAL));

      // Only check checks that should have happened by now
      if (now < scheduledTime) {
        continue;
      }

      // Find corresponding check in database
      const checkData = panoptoChecks.find(c => {
        const checkTime = new Date(`${event.date}T${c.check_time}`);
        return Math.abs(checkTime.getTime() - scheduledTime.getTime()) < 60000;
      });

      // Check if this check is due, overdue, or missed
      if (checkData?.status === 'missed') {
        // Database says it's missed - don't flash because user can't do anything about it
        continue;
      } else if (now >= scheduledTime) {
        // Check is due or past due - now check if it's completed
        if (!checkData?.completed_time && checkData?.status !== 'completed') {
          // Calculate time since scheduled to determine if it's still actionable
          const timeSinceScheduled = now.getTime() - scheduledTime.getTime();
          const thirtyMinutes = 30 * 60 * 1000; // 30 minutes in milliseconds
          
          // Only flash if it's within 30 minutes (not missed yet)
          if (timeSinceScheduled < thirtyMinutes) {
            return true; // This event has overdue checks
          }
        }
      }
    }

    return false;
  }, [hasRecordingResource, isEventCurrentlyActive, panoptoChecks, event.date, event.start_time, event.end_time, currentTime]);

  return {
    hasOverdueChecks,
    isLoading,
    panoptoChecks: panoptoChecks || []
  };
};
