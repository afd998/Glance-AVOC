import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useEvents } from '../features/Schedule/hooks/useEvents';
import { useEvent } from '../core/event/hooks/useEvent';
import { useProfile } from '../core/User/useProfile';
import { useShiftBlocks } from '../features/SessionAssignments/hooks/useShiftBlocks';
import { isUserEventOwner } from '../utils/eventUtils';
import { Database } from '../types/supabase';

import { supabase } from '../lib/supabase';
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';

const PANOPTO_CHECK_INTERVAL = 30 * 60 * 1000; // 30 minutes in milliseconds

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
  