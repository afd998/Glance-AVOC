import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import type { Database } from '../../../types/supabase';

export type Shift = Database['public']['Tables']['shifts']['Row'];

// Helper function to compare if two days have the same shift schedule
export function hasSameShiftSchedule(shifts: Shift[], date1: string, date2: string): boolean {
  if (!shifts) return false;
  
  const shifts1 = shifts.filter(s => s.date === date1);
  const shifts2 = shifts.filter(s => s.date === date2);
  
  if (shifts1.length !== shifts2.length) return false;
  
  // Create a normalized schedule string for comparison
  const normalizeSchedule = (shifts: Shift[]) => {
    return shifts
      .map(s => `${s.profile_id}:${s.start_time}-${s.end_time}`)
      .sort()
      .join('|');
  };
  
  return normalizeSchedule(shifts1) === normalizeSchedule(shifts2);
}

// Hook to copy shift blocks to days with the same schedule
export function useCopyShiftBlocksToDaysWithSameSchedule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (sourceDate: string): Promise<{ copiedDays: number }> => {
      // Get shift blocks for the source date
      const { data: sourceBlocks, error: sourceError } = await supabase
        .from('shift_blocks')
        .select('*')
        .eq('date', sourceDate)
        .order('start_time', { ascending: true });
      
      if (sourceError) throw sourceError;
      if (!sourceBlocks || sourceBlocks.length === 0) {
        throw new Error('No shift blocks found for the source date');
      }

      // Get all shifts for the source date to determine the schedule
      const { data: sourceShifts, error: shiftsError } = await supabase
        .from('shifts')
        .select('*')
        .eq('date', sourceDate);
      
      if (shiftsError) throw shiftsError;
      if (!sourceShifts || sourceShifts.length === 0) {
        throw new Error('No shifts found for the source date');
      }

      // Get all other dates in the same week
      const sourceDateObj = new Date(sourceDate);
      const weekStart = new Date(sourceDateObj);
      weekStart.setDate(sourceDateObj.getDate() - sourceDateObj.getDay() + 1); // Monday
      weekStart.setHours(0, 0, 0, 0);
      
      const weekDates = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        return date.toISOString().split('T')[0];
      }).filter(date => date !== sourceDate);

      // Get all shifts for the week to use with the helper function
      const { data: allWeekShifts, error: allShiftsError } = await supabase
        .from('shifts')
        .select('*')
        .in('date', [sourceDate, ...weekDates]);
      
      if (allShiftsError) throw allShiftsError;

      const daysWithSameSchedule: string[] = [];

      // Check each day in the week for matching schedule using the helper function
      for (const date of weekDates) {
        if (hasSameShiftSchedule(allWeekShifts || [], sourceDate, date)) {
          daysWithSameSchedule.push(date);
        }
      }

      if (daysWithSameSchedule.length === 0) {
        throw new Error('No days found with the same schedule');
      }

      // Copy shift blocks to each matching day
      let copiedCount = 0;
      for (const targetDate of daysWithSameSchedule) {
        // Delete existing shift blocks for the target date
        await supabase
          .from('shift_blocks')
          .delete()
          .eq('date', targetDate);

        // Copy shift blocks with new date
        const newBlocks = sourceBlocks.map(block => ({
          date: targetDate,
          start_time: block.start_time,
          end_time: block.end_time,
          assignments: block.assignments
        }));

        const { error: insertError } = await supabase
          .from('shift_blocks')
          .insert(newBlocks);

        if (insertError) {
          console.error(`Failed to copy shift blocks to ${targetDate}:`, insertError);
          continue;
        }

        copiedCount++;
      }

      return { copiedDays: copiedCount };
    },
    onSuccess: async (data, sourceDate) => {
    
       await queryClient.invalidateQueries({ queryKey: ['shift_blocks'] });
       await queryClient.invalidateQueries({ queryKey: ['allRoomsAssigned'] });   
      queryClient.invalidateQueries({ queryKey: ['eventOwnership'] });
    },
    onError: (error) => {
      console.error('❌ Failed to copy shift blocks:', error);
    },
  });
}
