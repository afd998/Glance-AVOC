import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { parseEventResources } from '../utils/eventUtils';
import { Database } from '../types/supabase';

type Event = Database['public']['Tables']['events']['Row'];

const PANOPTO_CHECK_INTERVAL = 30 * 60 * 1000; // 30 minutes in milliseconds

export const useOverduePanoptoChecks = (events: Event[]) => {
  const [overdueEvents, setOverdueEvents] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Check if an event has recording resources
  const hasRecordingResource = (event: Event) => {
    if (!event.resources) return false;
    
    const resourceFlags = parseEventResources(event);
    return resourceFlags.resources.some((resource: any) => 
      resource.itemName?.toLowerCase().includes('panopto') ||
      resource.itemName?.toLowerCase().includes('recording')
    );
  };

  // Check if an event is currently happening
  const isEventCurrentlyActive = (event: Event) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Check if event is today
    if (event.date !== today) return false;
    
    // Check if start_time and end_time exist
    if (!event.start_time || !event.end_time) return false;
    
    // Check if current time is between start and end time
    const currentTime = now.toTimeString().split(' ')[0]; // HH:MM:SS format
    return currentTime >= event.start_time && currentTime <= event.end_time;
  };

  // Check for overdue panopto checks
  const checkForOverdueChecks = async () => {
    if (!events || events.length === 0) {
      setIsLoading(false);
      return;
    }

    const now = new Date();
    const overdueEventIds = new Set<number>();

    for (const event of events) {
      // Skip if not a recording event or not currently active
      if (!hasRecordingResource(event) || !isEventCurrentlyActive(event)) {
        continue;
      }

      try {
        // Load panopto checks for this event
        const { data: checksData, error } = await supabase
          .from('panopto_checks')
          .select('check_time, completed_time, status')
          .eq('event_id', event.id)
          .order('check_time');

        if (error) {
          console.error('Error loading panopto checks for overdue check:', error);
          continue;
        }

        // Calculate expected checks for this event
        if (!event.start_time || !event.end_time || !event.date) continue;
        
        const eventStart = new Date(`${event.date}T${event.start_time}`);
        const eventEnd = new Date(`${event.date}T${event.end_time}`);
        const eventDuration = eventEnd.getTime() - eventStart.getTime();
        const totalChecks = Math.floor(eventDuration / PANOPTO_CHECK_INTERVAL);

        if (totalChecks === 0) continue;

        // Check each expected check for overdue status
        for (let i = 0; i < totalChecks; i++) {
          const checkNumber = i + 1;
          const scheduledTime = new Date(eventStart.getTime() + (i * PANOPTO_CHECK_INTERVAL));
          const dueTime = new Date(scheduledTime.getTime() + (5 * 60 * 1000)); // 5 minutes to complete

          // Find corresponding check in database
          const checkData = checksData?.find(c => {
            const checkTime = new Date(`${event.date}T${c.check_time}`);
            return Math.abs(checkTime.getTime() - scheduledTime.getTime()) < 60000; // Within 1 minute
          });

          // Check if this check is overdue
          if (checkData?.status === 'missed') {
            // Database says it's missed - definitely overdue
            overdueEventIds.add(event.id);
            break;
          } else if (!checkData?.completed_time && now >= dueTime) {
            // No completion recorded and past due time - overdue
            overdueEventIds.add(event.id);
            break;
          }
        }
      } catch (error) {
        console.error('Error checking overdue status for event:', event.id, error);
      }
    }

    setOverdueEvents(overdueEventIds);
    setIsLoading(false);
  };

  // Check immediately and then every 30 seconds
  useEffect(() => {
    checkForOverdueChecks();
    const interval = setInterval(checkForOverdueChecks, 30000);
    return () => clearInterval(interval);
  }, [events]);

  // Memoized function to check if a specific event has overdue checks
  const hasOverdueChecks = useMemo(() => {
    return (eventId: number) => overdueEvents.has(eventId);
  }, [overdueEvents]);

  return {
    hasOverdueChecks,
    overdueEvents,
    isLoading
  };
};
