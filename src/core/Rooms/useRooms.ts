import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

export const useRooms = () => {
  const { data: rooms, isLoading, error } = useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rooms')
        .select('*').order('id')

      if (error) throw error;
      
      return data;
    },
    staleTime: 1000 * 60 * 60, // 1 hour - rooms don't change often
  });

  return {
    rooms: rooms || [],
    isLoading,
    error,
  };
}; 


export function useLCRooms() {
  const {rooms, isLoading: roomsLoading} = useRooms();
 
  // Filter rooms for those with type = "LIGHT COURT"
  const lightCourtRooms = rooms?.filter(room => room.type === "LIGHT COURT") || [];
  return { data: lightCourtRooms, isLoading: false };
}
