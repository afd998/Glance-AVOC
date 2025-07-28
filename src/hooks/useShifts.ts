import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';

export type Shift = Database['public']['Tables']['shifts']['Row'];
export type ShiftInsert = Database['public']['Tables']['shifts']['Insert'];

// Fetch shifts for a specific week
export function useShifts(week_start: string | null) {
  return useQuery<Shift[]>({
    queryKey: ['shifts', week_start],
    queryFn: async () => {
      if (!week_start) return [];
      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .eq('week_start', week_start);
      if (error) throw error;
      return data || [];
    },
    enabled: !!week_start,
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

// Copy shifts from previous week
export function useCopyShiftsFromPreviousWeek() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      sourceWeekStart,
      targetWeekStart,
    }: {
      sourceWeekStart: string;
      targetWeekStart: string;
    }) => {
      // 1. Fetch shifts from source week
      const { data: sourceShifts, error: fetchError } = await supabase
        .from('shifts')
        .select('*')
        .eq('week_start', sourceWeekStart);
      
      if (fetchError) throw fetchError;
      
      if (!sourceShifts || sourceShifts.length === 0) {
        throw new Error(`No shift information found for week ${sourceWeekStart}`);
      }

      // 2. Map shifts to target week
      const shiftsToInsert = sourceShifts.map(shift => ({
        profile_id: shift.profile_id,
        day_of_week: shift.day_of_week,
        week_start: targetWeekStart,
        start_time: shift.start_time,
        end_time: shift.end_time,
      }));

      // 3. Delete existing shifts for target week first
      const { error: deleteError } = await supabase
        .from('shifts')
        .delete()
        .eq('week_start', targetWeekStart);
        
      if (deleteError) throw deleteError;

      // 4. Insert copied shifts
      const { error: insertError } = await supabase
        .from('shifts')
        .insert(shiftsToInsert);
        
      if (insertError) throw insertError;

      return { copiedShifts: shiftsToInsert.length };
    },
    onSuccess: (_data, variables) => {
      // Invalidate shifts queries for target week
      queryClient.invalidateQueries({ queryKey: ['shifts', variables.targetWeekStart] });
    },
  });
} 