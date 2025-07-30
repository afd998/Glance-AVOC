import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';

type Event = Database['public']['Tables']['events']['Row'];
type ShiftBlock = Database['public']['Tables']['shift_blocks']['Row'];

/**
 * Hook to calculate hand-off time for an event
 * 
 * Hand-off time is calculated by:
 * 1. Finding the shift block that contains the event's end time (but not start time)
 * 2. These are events that "hand off" into the shift block
 * 3. The hand-off time is the shift block's start time
 * 
 * @param event - The event to calculate hand-off time for
 * @returns The hand-off time string in HH:MM format, or null if no hand-off is needed
 */
export function useHandOffTime(event: Event | null | undefined) {
  return useQuery<string | null>({
    queryKey: ['handOffTime', event?.id, event?.date],
    queryFn: async () => {
      if (!event || !event.date || !event.start_time || !event.end_time) {
        return null;
      }

      try {
        // Calculate day of week (0 = Sunday, 1 = Monday, etc.)
        const eventDate = new Date(event.date);
        const dayOfWeek = eventDate.getDay();

        // Calculate week start (Sunday of the week containing the event)
        const weekStart = new Date(eventDate);
        const daysFromSunday = eventDate.getDay();
        weekStart.setDate(eventDate.getDate() - daysFromSunday);
        const weekStartString = weekStart.toISOString().split('T')[0];

        // Get shift blocks for this day and week
        const { data: shiftBlocks, error } = await supabase
          .from('shift_blocks')
          .select('*')
          .eq('day_of_week', dayOfWeek)
          .eq('week_start', weekStartString)
          .order('start_time', { ascending: true });

        if (error) {
          console.error('Error fetching shift blocks for hand-off calculation:', error);
          return null;
        }

        if (!shiftBlocks || shiftBlocks.length === 0) {
          return null;
        }

        // Find the shift block that contains the event's end time (but not start time)
        const handoffShiftBlock = shiftBlocks.find(block => {
          if (!block.start_time || !block.end_time) return false;
          
          // Parse times for comparison
          const eventStart = event.start_time;
          const eventEnd = event.end_time;
          const blockStart = block.start_time;
          const blockEnd = block.end_time;
          
          // Ensure all times are valid before comparison
          if (!eventStart || !eventEnd || !blockStart || !blockEnd) return false;
          
          // Check if event ENDS in this shift block but DOESN'T start in it
          const eventEndsInBlock = eventEnd >= blockStart && eventEnd < blockEnd;
          const eventStartsInBlock = eventStart >= blockStart && eventStart < blockEnd;
          
          return eventEndsInBlock && !eventStartsInBlock;
        });

        if (!handoffShiftBlock) {
          return null;
        }

        // The hand-off time is the shift block's start time
        if (!handoffShiftBlock.start_time) {
          return null;
        }
        const handOffTime = handoffShiftBlock.start_time.split(':').slice(0, 2).join(':');
        return handOffTime;

        return null;
      } catch (error) {
        console.error('Error calculating hand-off time:', error);
        return null;
      }
    },
    enabled: !!event && !!event.date && !!event.start_time && !!event.end_time,
  });
} 