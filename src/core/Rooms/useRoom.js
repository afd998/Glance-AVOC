import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

export const useRoom = (roomName) => {
  const { data: room } = useQuery({
    queryKey: ['room', roomName],
    queryFn: async () => {
      if (!roomName) return null;
      
      const { data, error } = await supabase
        .from('rooms')
        .select('spelling')
        .eq('name', roomName)
        .single();

      if (error) {
        console.warn('Could not fetch room spelling:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!roomName,
    staleTime: 1000 * 60 * 60, // 1 hour - room spelling doesn't change often
  });

  return room?.spelling || null;
};


