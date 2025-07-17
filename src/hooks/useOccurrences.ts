import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';

type Event = Database['public']['Tables']['events']['Row'];

export const useOccurrences = (eventName: string | null) => {
  return useQuery({
    queryKey: ['occurrences', eventName],
    queryFn: async (): Promise<Event[]> => {
      if (!eventName) {
        return [];
      }

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('event_name', eventName)
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error fetching occurrences:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!eventName,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}; 