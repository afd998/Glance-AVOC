import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';

export type Shift = Database['public']['Tables']['shifts']['Row'];
export type ShiftInsert = Database['public']['Tables']['shifts']['Insert'];

// Updated to use date instead of week_start
export function useShifts(dates: string | string[] | null) {
  return useQuery({
    queryKey: ['shifts', dates],
    queryFn: async () => {
      if (!dates) return [];
      
      // Handle both single date and array of dates
      const dateArray = Array.isArray(dates) ? dates : [dates];
      console.log('Fetching shifts for dates:', dateArray);
      
      // Fetch shifts for all dates
      const allShifts: any[] = [];
      for (const date of dateArray) {
        if (!date) continue;
        const { data, error } = await supabase
          .from('shifts')
          .select('*')
          .eq('date', date);
        if (error) throw error;
        if (data) {
          allShifts.push(...data);
        }
      }
      
      return allShifts;
    },
    enabled: !!dates && (Array.isArray(dates) ? dates.length > 0 : !!dates),
  });
}

export function useCreateShift() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (shift: ShiftInsert) => {
      // Validate required fields
      if (!shift.profile_id || !shift.date) {
        throw new Error('profile_id and date are required');
      }
      
      console.log('Creating/updating shift:', shift);
      
      // First, delete any existing shifts for this profile_id and date to prevent duplicates
      const { error: deleteError } = await supabase
        .from('shifts')
        .delete()
        .eq('profile_id', shift.profile_id)
        .eq('date', shift.date);
      
      if (deleteError) {
        console.error('Error deleting existing shifts:', deleteError);
        throw deleteError;
      }
      
      // Only insert if we have start_time and end_time (not clearing the shift)
      if (shift.start_time && shift.end_time) {
        console.log('Creating new shift');
        const { data, error } = await supabase
          .from('shifts')
          .insert([shift])
          .select();
        if (error) throw error;
        console.log('Shift operation result:', data);
        return data;
      } else {
        console.log('Shift cleared (no start/end time provided)');
        return [];
      }
    },
    onSuccess: (data, variables) => {
      console.log('Shift mutation success, invalidating queries for date:', variables.date);
      // Invalidate the specific query
      queryClient.invalidateQueries({ queryKey: ['shifts', variables.date] });
      // Also invalidate all shifts queries to be safe
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      // Invalidate any array-based queries that might include this date
      queryClient.invalidateQueries({ 
        queryKey: ['shifts'], 
        predicate: (query) => {
          const queryKey = query.queryKey;
          return queryKey[0] === 'shifts' && Array.isArray(queryKey[1]);
        }
      });
    },
  });
}

export function useUpdateShift() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<Shift>) => {
      const { data, error } = await supabase
        .from('shifts')
        .update(updates)
        .eq('id', id)
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      if (variables.date) {
        queryClient.invalidateQueries({ queryKey: ['shifts', variables.date] });
        // Also invalidate array-based queries
        queryClient.invalidateQueries({ 
          queryKey: ['shifts'], 
          predicate: (query) => {
            const queryKey = query.queryKey;
            return queryKey[0] === 'shifts' && Array.isArray(queryKey[1]);
          }
        });
      }
    },
  });
}

export function useDeleteShift() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('shifts')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
  });
}

export function useCopyShifts() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ sourceDate, targetDate }: { sourceDate: string, targetDate: string }) => {
      // Get all shifts for the source date
      const { data: sourceShifts, error: fetchError } = await supabase
        .from('shifts')
        .select('*')
        .eq('date', sourceDate);
      
      if (fetchError) throw fetchError;
      
      if (!sourceShifts || sourceShifts.length === 0) {
        return [];
      }
      
      // Replace target day's shifts to avoid duplicates
      const { error: deleteTargetError } = await supabase
        .from('shifts')
        .delete()
        .eq('date', targetDate);
      if (deleteTargetError) throw deleteTargetError;

      // Create new shifts for the target date
      const newShifts = sourceShifts.map(shift => {
        // Destructure to remove id and created_at, then create new object
        const { id, created_at, ...shiftWithoutId } = shift;
        return {
          ...shiftWithoutId,
          date: targetDate,
        };
      });
      
      const { data, error } = await supabase
        .from('shifts')
        .insert(newShifts)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shifts', variables.sourceDate] });
      queryClient.invalidateQueries({ queryKey: ['shifts', variables.targetDate] });
      // Also invalidate array-based queries
      queryClient.invalidateQueries({ 
        queryKey: ['shifts'], 
        predicate: (query) => {
          const queryKey = query.queryKey;
          return queryKey[0] === 'shifts' && Array.isArray(queryKey[1]);
        }
      });
    },
  });
}

export function useDeleteShiftsForDate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (date: string) => {
      const { error } = await supabase
        .from('shifts')
        .delete()
        .eq('date', date);
      if (error) throw error;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shifts', variables] });
      // Also invalidate array-based queries
      queryClient.invalidateQueries({ 
        queryKey: ['shifts'], 
        predicate: (query) => {
          const queryKey = query.queryKey;
          return queryKey[0] === 'shifts' && Array.isArray(queryKey[1]);
        }
      });
    },
  });
}

// Cleanup function removed; duplication is prevented at the source

// Mutation for copying schedule from previous week
export function useCopyScheduleFromPreviousWeek() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ weekDates, previousWeekStartDate }: { 
      weekDates: Date[], 
      previousWeekStartDate: Date 
    }) => {
      // First, delete all existing shifts and shift blocks for the target week
      const deletePromises = weekDates.map(async (targetDate) => {
        const targetDateString = targetDate.toISOString().split('T')[0];
        
        // Delete all shifts for this date
        const { error: shiftsDeleteError } = await supabase
          .from('shifts')
          .delete()
          .eq('date', targetDateString);
        
        if (shiftsDeleteError) throw shiftsDeleteError;
        
        // Delete all shift blocks for this date
        const { error: blocksDeleteError } = await supabase
          .from('shift_blocks')
          .delete()
          .eq('date', targetDateString);
        
        if (blocksDeleteError) throw blocksDeleteError;
      });
      
      await Promise.all(deletePromises);
      
      // Then copy from previous week
      const copyPromises = weekDates.map(async (targetDate, index) => {
        const targetDateString = targetDate.toISOString().split('T')[0];
        const sourceDate = new Date(previousWeekStartDate);
        sourceDate.setDate(sourceDate.getDate() + index);
        const sourceDateString = sourceDate.toISOString().split('T')[0];
        
        // Copy shifts
        const { data: sourceShifts, error: shiftsError } = await supabase
          .from('shifts')
          .select('*')
          .eq('date', sourceDateString);
        
        if (shiftsError) throw shiftsError;
        
        if (sourceShifts && sourceShifts.length > 0) {
          const shiftsToInsert = sourceShifts.map(shift => {
            const { id, created_at, ...shiftWithoutId } = shift;
            return {
              ...shiftWithoutId,
              date: targetDateString
            };
          });
          
          const { error: insertShiftsError } = await supabase
            .from('shifts')
            .insert(shiftsToInsert);
          
          if (insertShiftsError) throw insertShiftsError;
        }
        
        // Copy shift blocks
        const { data: sourceBlocks, error: blocksError } = await supabase
          .from('shift_blocks')
          .select('*')
          .eq('date', sourceDateString);
        
        if (blocksError) throw blocksError;
        
        if (sourceBlocks && sourceBlocks.length > 0) {
          const blocksToInsert = sourceBlocks.map(block => {
            const { id, created_at, ...blockWithoutId } = block;
            return {
              ...blockWithoutId,
              date: targetDateString
            };
          });
          
          const { error: insertBlocksError } = await supabase
            .from('shift_blocks')
            .insert(blocksToInsert);
          
          if (insertBlocksError) throw insertBlocksError;
        }
      });
      
      await Promise.all(copyPromises);
    },
    onSuccess: (_, variables) => {
      // Invalidate all shift_blocks queries for the week dates
      variables.weekDates.forEach(date => {
        const dateString = date.toISOString().split('T')[0];
        queryClient.invalidateQueries({ queryKey: ['shift_blocks', dateString] });
      });
      
      // Invalidate shifts queries
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      
      // Invalidate event ownership queries
      queryClient.invalidateQueries({ queryKey: ['eventOwnership'] });
    },
  });
}