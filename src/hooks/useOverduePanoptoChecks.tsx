import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';

type Event = Database['public']['Tables']['events']['Row'];

const PANOPTO_CHECK_INTERVAL = 30 * 60 * 1000; // 30 minutes in milliseconds

export const useOverduePanoptoChecks = (events: Event[]) => {
  const queryClient = useQueryClient();

  // Memoize the event IDs to prevent infinite re-renders
  const eventIds = useMemo(() => {
    return events.map(e => e.id);
  }, [events.map(e => e.id).join(',')]);

  // Check if an event has recording resources
  const hasRecordingResource = (event: Event) => {
    if (!event.resources || !Array.isArray(event.resources)) return false;
    
    // Direct check for recording resources without full parsing
    return event.resources.some((resource: any) => 
      resource.itemName?.toLowerCase().includes('panopto') ||
      resource.itemName?.toLowerCase().includes('recording')
    );
  };

  // Check if an event is currently happening or recently ended (within last 2 hours)
  const isEventCurrentlyActive = (event: Event) => {
    const now = new Date();
    // Use local date instead of UTC to avoid timezone issues
    const today = now.getFullYear() + '-' + 
                  String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                  String(now.getDate()).padStart(2, '0');
    
    // Check if event is today OR if we're within 2 hours of the event end time
    // This handles cases where the event might be on a different date but still relevant
    if (!event.date) return false;
    const eventDate = new Date(event.date);
    // Create event start and end times in local timezone
    const eventStart = new Date(`${event.date}T${event.start_time}`);
    const eventEnd = new Date(`${event.date}T${event.end_time}`);
    const twoHoursAfterEnd = new Date(eventEnd.getTime() + (2 * 60 * 60 * 1000));
    
    // Event is active if:
    // 1. It's today, OR
    // 2. We're within 2 hours after the event ended (regardless of date)
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
    const isActive = now >= eventStart && now <= twoHoursAfterEnd;
    
    return isActive;
  };

  // Get all panopto checks for all events using React Query
  const { data: allPanoptoChecks, isLoading } = useQuery({
    queryKey: ['allPanoptoChecks', eventIds],
    queryFn: async () => {
      const eventIds = events
        .filter(event => hasRecordingResource(event) && isEventCurrentlyActive(event))
        .map(event => event.id);
      
      if (eventIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('panopto_checks')
        .select('event_id, check_time, completed_time, status')
        .in('event_id', eventIds)
        .order('check_time');

      if (error) throw error;
      return data || [];
    },
    enabled: events.length > 0,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 25000, // Consider data stale after 25 seconds
  });

  // Calculate overdue events using React Query data
  const overdueEvents = useMemo(() => {
    const overdueEventIds = new Set<number>();
    const now = new Date();

    for (const event of events) {
      if (!hasRecordingResource(event) || !isEventCurrentlyActive(event)) {
        continue;
      }

      const eventChecks = allPanoptoChecks?.filter(c => c.event_id === event.id) || [];
      
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

        // Only check checks that should have happened by now
        if (now < scheduledTime) {
          // This check hasn't started yet, so it can't be overdue
          continue;
        }

        // Find corresponding check in database
        const checkData = eventChecks.find(c => {
          const checkTime = new Date(`${event.date}T${c.check_time}`);
          return Math.abs(checkTime.getTime() - scheduledTime.getTime()) < 60000;
        });

        // Check if this check is due, overdue, or missed
        if (checkData?.status === 'missed') {
          // Database says it's missed - don't flash because user can't do anything about it
          // Don't mark as overdue for missed checks
        } else if (now >= scheduledTime) {
          // Check is due or past due - now check if it's completed
          if (!checkData?.completed_time && checkData?.status !== 'completed') {
            // Calculate time since scheduled to determine if it's still actionable
            const timeSinceScheduled = now.getTime() - scheduledTime.getTime();
            const thirtyMinutes = 30 * 60 * 1000; // 30 minutes in milliseconds
            
            // Only flash if it's within 30 minutes (not missed yet)
            if (timeSinceScheduled < thirtyMinutes) {
              // No completion recorded and not marked as completed - due/overdue (and can still be completed)
              overdueEventIds.add(event.id);
              break;
            }
          }
          // If it has completed_time or status is 'completed', it's not overdue
        }
        // If now < scheduledTime, check is not due yet
      }
    }

    return overdueEventIds;
  }, [
    events.map(e => `${e.id}-${e.start_time}-${e.end_time}-${e.date}`).join('|'),
    allPanoptoChecks ? JSON.stringify(allPanoptoChecks) : 'null'
  ]);

  // Function to invalidate panopto checks queries
  const invalidatePanoptoChecks = (eventId?: number) => {
    if (eventId) {
      queryClient.invalidateQueries({ queryKey: ['panoptoChecks', eventId] });
    }
    queryClient.invalidateQueries({ queryKey: ['allPanoptoChecks'] });
  };

  return {
    hasOverdueChecks: (eventId: number) => {
      // Don't return true if we're still loading data
      if (isLoading) {
        return false;
      }
      return overdueEvents.has(eventId);
    },
    overdueEvents,
    isLoading,
    invalidatePanoptoChecks
  };
};
