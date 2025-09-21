import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';

type Event = Database['public']['Tables']['events']['Row'];

interface OccurrencesResult {
  occurrences: Event[];
  isFirstSession: boolean;
}

export const useOccurrences = (currentEvent: Event | null) => {
  return useQuery({
    queryKey: ['occurrences', currentEvent?.event_name, currentEvent?.id],
    queryFn: async (): Promise<OccurrencesResult> => {
      if (!currentEvent?.event_name) {
        return { occurrences: [], isFirstSession: false };
      }

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('event_name', currentEvent.event_name)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error fetching occurrences:', error);
        throw error;
      }

      const occurrences = data || [];
      
      // Compute isFirstSession flag
      const isFirstSession = computeIsFirstSession(currentEvent, occurrences);

      return { occurrences, isFirstSession };
    },
    enabled: !!currentEvent?.event_name,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Helper function to compute if current event is the first session
function computeIsFirstSession(currentEvent: Event, occurrences: Event[]): boolean {
  if (!occurrences || occurrences.length === 0 || currentEvent.event_type !== 'Lecture') {
    return false;
  }
  
  // Sort occurrences by start time and check if this event is the first one
  const sortedOccurrences = [...occurrences].sort((a, b) => {
    const timeA = a.start_time ? new Date(a.start_time).getTime() : 0;
    const timeB = b.start_time ? new Date(b.start_time).getTime() : 0;
    return timeA - timeB;
  });
  
  return sortedOccurrences[0]?.id === currentEvent.id;
} 