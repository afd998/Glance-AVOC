import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { parseEventResources } from '../utils/eventUtils';
import { Database } from '../types/supabase';

type Event = Database['public']['Tables']['events']['Row'];

const PANOPTO_CHECK_INTERVAL = 30 * 60 * 1000; // 30 minutes in milliseconds

export const useOverduePanoptoChecks = (events: Event[]) => {
  const queryClient = useQueryClient();

  // Check if an event has recording resources
  const hasRecordingResource = (event: Event) => {
    if (!event.resources) return false;
    
    const resourceFlags = parseEventResources(event);
    return resourceFlags.resources.some((resource: any) => 
      resource.itemName?.toLowerCase().includes('panopto') ||
      resource.itemName?.toLowerCase().includes('recording')
    );
  };

  // Check if an event is currently happening or recently ended (within last 2 hours)
  const isEventCurrentlyActive = (event: Event) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Check if event is today
    if (event.date !== today) return false;
    
    // Check if start_time and end_time exist
    if (!event.start_time || !event.end_time) return false;
    
    // Check if current time is between start and end time, or within 2 hours after end
    const currentTime = now.toTimeString().split(' ')[0]; // HH:MM:SS format
    const eventEnd = new Date(`${event.date}T${event.end_time}`);
    const twoHoursAfterEnd = new Date(eventEnd.getTime() + (2 * 60 * 60 * 1000)); // 2 hours in milliseconds
    
    return currentTime >= event.start_time && now <= twoHoursAfterEnd;
  };

  // Get all panopto checks for all events using React Query
  const { data: allPanoptoChecks, isLoading } = useQuery({
    queryKey: ['allPanoptoChecks', events.map(e => e.id)],
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
        const dueTime = new Date(scheduledTime.getTime() + (5 * 60 * 1000));

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


        // Check if this check is overdue (but not missed - missed checks can't be completed)
        if (checkData?.status === 'missed') {
          // Database says it's missed - don't flash because user can't do anything about it
          // Don't mark as overdue for missed checks
        } else if (now >= dueTime) {
          // Check is past due time - now check if it's completed
          if (!checkData?.completed_time && checkData?.status !== 'completed') {
            // No completion recorded and not marked as completed - overdue (and can still be completed)
            overdueEventIds.add(event.id);
            break;
          }
          // If it has completed_time or status is 'completed', it's not overdue
        }
        // If now < dueTime, check is not overdue yet
      }
    }

    return overdueEventIds;
  }, [events, allPanoptoChecks]);

  // Function to invalidate panopto checks queries
  const invalidatePanoptoChecks = (eventId?: number) => {
    if (eventId) {
      queryClient.invalidateQueries({ queryKey: ['panoptoChecks', eventId] });
    }
    queryClient.invalidateQueries({ queryKey: ['allPanoptoChecks'] });
  };

  return {
    hasOverdueChecks: (eventId: number) => {
      const hasOverdue = overdueEvents.has(eventId);
      console.log(`🔍 hasOverdueChecks for event ${eventId}: ${hasOverdue}`);
      return hasOverdue;
    },
    overdueEvents,
    isLoading,
    invalidatePanoptoChecks
  };
};
