import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export const useRooms = () => {
  const { data: rooms, isLoading, error } = useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rooms')
        .select('name')
        .order('name');

      if (error) throw error;
      
      // Return array of room names
      return data.map(room => room.name).filter(Boolean);
    },
    staleTime: 1000 * 60 * 60, // 1 hour - rooms don't change often
  });

  return {
    rooms: rooms || [],
    isLoading,
    error,
  };
}; 