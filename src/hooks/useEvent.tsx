import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';

type Event = Database['public']['Tables']['events']['Row'];

// Fetch a single event by ID
const fetchEvent = async (eventId: number): Promise<Event | null> => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();
      
    if (error) {
      console.error('Error fetching event:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in fetchEvent:', error);
    throw error;
  }
};

export function useEvent(eventId: number | null) {
  return useQuery({
    queryKey: ['event', eventId],
    queryFn: () => fetchEvent(eventId!),
    enabled: !!eventId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
    refetchOnMount: false, 
  });
}


