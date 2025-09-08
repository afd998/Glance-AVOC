import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export const usePanoptoChecksData = (eventId: number) => {
  return useQuery({
    queryKey: ['panoptoChecks', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('panopto_checks')
        .select(`
          check_time, 
          completed_time, 
          completed_by_user_id,
          status,
          profiles!panopto_checks_completed_by_user_id_fkey(id, name)
        `)
        .eq('event_id', eventId)
        .order('check_time');

      if (error) throw error;
      return data || [];
    },
    enabled: !!eventId,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  });
};
