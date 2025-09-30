import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { useEvent } from '../../../../core/event/hooks/useEvent';
import { usePanoptoChecksData } from '../../../../hooks/usePanoptoChecks';
import { isUserEventOwner } from '../../../../utils/eventUtils';
import { Database } from '../../../../types/supabase';

import { supabase } from '../../../../lib/supabase';
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';

const PANOPTO_CHECK_INTERVAL = 30 * 60 * 1000; // 30 minutes in milliseconds

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
