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
      
      // Get array of room names, ensuring they are strings
      const roomNames = data.map(room => room.name).filter(Boolean) as string[];
      
      // Priority rooms that should appear at the top
      const priorityRooms = ['GH L070', 'GH L110', 'GH L120', 'GH L130', 'GH 1110', 'GH 1120', 'GH 1130'];
      
      // Sort rooms with priority rooms first, then alphabetically
      const sortedRooms = roomNames.sort((a: string, b: string) => {
        const aIndex = priorityRooms.indexOf(a);
        const bIndex = priorityRooms.indexOf(b);
        
        // If both are priority rooms, sort by priority order
        if (aIndex !== -1 && bIndex !== -1) {
          return aIndex - bIndex;
        }
        
        // If only 'a' is priority, it comes first
        if (aIndex !== -1) return -1;
        
        // If only 'b' is priority, it comes first
        if (bIndex !== -1) return 1;
        
        // Neither is priority, sort alphabetically
        return a.localeCompare(b);
      });
      
      return sortedRooms;
    },
    staleTime: 1000 * 60 * 60, // 1 hour - rooms don't change often
  });

  return {
    rooms: rooms || [],
    isLoading,
    error,
  };
}; 