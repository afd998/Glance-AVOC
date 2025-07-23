import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';

export type Shift = Database['public']['Tables']['shifts']['Row'];
export type ShiftInsert = Database['public']['Tables']['shifts']['Insert'];

// Fetch all shifts for a given week_start
export function useShifts(weekStart: string | null) {
  return useQuery<Shift[]>({
    queryKey: ['shifts', weekStart],
    queryFn: async () => {
      if (!weekStart) return [];
      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .eq('week_start', weekStart);
      if (error) throw error;
      return data || [];
    },
    enabled: !!weekStart,
  });
}

// Upsert (insert or update) a shift
export function useUpsertShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (shift: ShiftInsert) => {
      // Upsert by profile_id, day_of_week, week_start
      const { data, error } = await supabase
        .from('shifts')
        .upsert([shift], { onConflict: 'profile_id,day_of_week,week_start' })
        .select();
      if (error) throw error;
      return data?.[0];
    },
    onSuccess: (data, variables) => {
      // Invalidate the shifts query for this week
      if (variables.week_start) {
        queryClient.invalidateQueries({ queryKey: ['shifts', variables.week_start] });
      }
    },
  });
} 