import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';

export type ShiftBlock = Database['public']['Tables']['shift_blocks']['Row'];
export type ShiftBlockInsert = Database['public']['Tables']['shift_blocks']['Insert'];
export type Shift = Database['public']['Tables']['shifts']['Row'];

export function useShiftBlocks(day_of_week: number, week_start: string | null) {
  return useQuery<ShiftBlock[]>({
    queryKey: ['shift_blocks', day_of_week, week_start],
    queryFn: async () => {
      if (week_start == null) return [];
      const { data, error } = await supabase
        .from('shift_blocks')
        .select('*')
        .eq('day_of_week', day_of_week)
        .eq('week_start', week_start);
      if (error) throw error;
      return data || [];
    },
    enabled: week_start != null,
  });
}

// Helper to normalize time string to 'HH:MM'
function normalizeTimeString(t: string | null | undefined): string | null {
  if (!t) return null;
  const [h, m] = t.split(':');
  if (h === undefined || m === undefined) return null;
  const hour = h.padStart(2, '0');
  const minute = m.padStart(2, '0');
  return `${hour}:${minute}`;
}

// Utility: Calculate minimal shift blocks for a day from shifts
export function calculateNewShiftBlocks(shifts: Shift[], day_of_week: number, week_start: string): ShiftBlockInsert[] {
  // 1. Collect all unique, normalized time points (start and end times)
  const timePoints = new Set<string>();
  shifts.forEach(s => {
    const start = normalizeTimeString(s.start_time);
    const end = normalizeTimeString(s.end_time);
    if (start) timePoints.add(start);
    if (end) timePoints.add(end);
  });
  const sortedTimes = Array.from(timePoints).filter(Boolean).sort();
  // 2. For each interval, determine which profiles are assigned
  const blocks: ShiftBlockInsert[] = [];
  for (let i = 0; i < sortedTimes.length - 1; i++) {
    const start = sortedTimes[i];
    const end = sortedTimes[i + 1];
    if (!start || !end || start === end) continue; // Skip zero-length or invalid intervals
    // Find all profiles assigned during this interval
    const assignedProfiles = shifts
      .filter(s => {
        const sStart = normalizeTimeString(s.start_time);
        const sEnd = normalizeTimeString(s.end_time);
        return sStart && sEnd && sStart <= start && sEnd >= end;
      })
      .map(s => s.profile_id)
      .filter(Boolean);
    const assignments = assignedProfiles.map(user => ({ user, rooms: [] }));
    if (assignments.length > 0) {
      blocks.push({
        day_of_week,
        week_start,
        start_time: start,
        end_time: end,
        assignments,
      });
    }
  }
  return blocks;
}

// Mutation: Delete all shift_blocks for a day and insert new ones
export function useUpdateShiftBlocks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ day_of_week, week_start, newBlocks }: { day_of_week: number, week_start: string, newBlocks: ShiftBlockInsert[] }) => {
      // 1. Delete all shift_blocks for this day/week
      const { error: delError } = await supabase
        .from('shift_blocks')
        .delete()
        .eq('day_of_week', day_of_week)
        .eq('week_start', week_start);
      if (delError) throw delError;
      // 2. Insert new shift_blocks
      if (newBlocks.length > 0) {
        const { error: insError } = await supabase
          .from('shift_blocks')
          .insert(newBlocks);
        if (insError) throw insError;
      }
      return true;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shift_blocks', variables.day_of_week, variables.week_start] });
      queryClient.invalidateQueries({ queryKey: ['allShiftBlocks', variables.week_start] });
    },
  });
} 