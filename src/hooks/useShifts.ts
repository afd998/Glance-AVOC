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
      
      console.log('Fetched shifts:', allShifts);
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
      
      // First check if a shift already exists for this profile_id and date
      const { data: existingShift, error: fetchError } = await supabase
        .from('shifts')
        .select('*')
        .eq('profile_id', shift.profile_id)
        .eq('date', shift.date)
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found"
        throw fetchError;
      }
      
      let result;
      if (existingShift) {
        console.log('Updating existing shift:', existingShift);
        // Update existing shift
        const { data, error } = await supabase
          .from('shifts')
          .update({
            start_time: shift.start_time,
            end_time: shift.end_time,
          })
          .eq('id', existingShift.id)
          .select();
        if (error) throw error;
        result = data;
      } else {
        console.log('Creating new shift');
        // Insert new shift
        const { data, error } = await supabase
          .from('shifts')
          .insert([shift])
          .select();
        if (error) throw error;
        result = data;
      }
      
      console.log('Shift operation result:', result);
      return result;
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
      
      // Create new shifts for the target date
      const newShifts = sourceShifts.map(shift => ({
        ...shift,
        id: undefined, // Remove id to create new records
        date: targetDate,
      }));
      
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