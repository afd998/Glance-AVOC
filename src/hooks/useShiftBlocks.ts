import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';

export type ShiftBlock = Database['public']['Tables']['shift_blocks']['Row'];
export type ShiftBlockInsert = Database['public']['Tables']['shift_blocks']['Insert'];
export type Shift = Database['public']['Tables']['shifts']['Row'];

// Updated to use date instead of day_of_week and week_start
export function useShiftBlocks(date: string | null) {
  return useQuery({
    queryKey: ['shift_blocks', date],
    queryFn: async () => {
      if (date == null) return [];
      console.log('Fetching shift blocks for date:', date);
      const { data, error } = await supabase
        .from('shift_blocks')
        .select('*')
        .eq('date', date);
      if (error) throw error;
      console.log('Fetched shift blocks:', data);
      return data || [];
    },
    enabled: date != null,
  });
}

export function useAllShiftBlocks() {
  return useQuery({
    queryKey: ['allShiftBlocks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shift_blocks')
        .select('*')
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreateShiftBlock() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (shiftBlock: ShiftBlockInsert) => {
      const { data, error } = await supabase
        .from('shift_blocks')
        .insert([shiftBlock])
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      if (variables.date) {
        queryClient.invalidateQueries({ queryKey: ['shift_blocks', variables.date] });
      }
      queryClient.invalidateQueries({ queryKey: ['allShiftBlocks'] });
      // Also invalidate the shiftBlocksForOwner query used by useOwnerDisplay
      queryClient.invalidateQueries({ queryKey: ['shiftBlocksForOwner'] });
    },
  });
}

export function useUpdateShiftBlock() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<ShiftBlock>) => {
      const { data, error } = await supabase
        .from('shift_blocks')
        .update(updates)
        .eq('id', id)
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      if (variables.date) {
        queryClient.invalidateQueries({ queryKey: ['shift_blocks', variables.date] });
      }
      queryClient.invalidateQueries({ queryKey: ['allShiftBlocks'] });
      // Also invalidate the shiftBlocksForOwner query used by useOwnerDisplay
      queryClient.invalidateQueries({ queryKey: ['shiftBlocksForOwner'] });
    },
  });
}

export function useDeleteShiftBlock() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('shift_blocks')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift_blocks'] });
      queryClient.invalidateQueries({ queryKey: ['allShiftBlocks'] });
      // Also invalidate the shiftBlocksForOwner query used by useOwnerDisplay
      queryClient.invalidateQueries({ queryKey: ['shiftBlocksForOwner'] });
    },
  });
}

// Updated to use date instead of week_start
export function calculateNewShiftBlocks(shifts: Shift[], date: string): ShiftBlockInsert[] {
  const blocks: ShiftBlockInsert[] = [];
  
  // Group shifts by time slots
  const timeSlots = new Map<string, Shift[]>();
  
  shifts.forEach(shift => {
    if (!shift.start_time || !shift.end_time) return;
    
    const key = `${shift.start_time}-${shift.end_time}`;
    if (!timeSlots.has(key)) {
      timeSlots.set(key, []);
    }
    timeSlots.get(key)!.push(shift);
  });
  
  // Create blocks for each time slot
  timeSlots.forEach((shiftsInSlot, timeSlot) => {
    const [startTime, endTime] = timeSlot.split('-');
    
    // Create assignments with the structure expected by ShiftBlock component
    const assignments = shiftsInSlot.map(shift => ({
      user: shift.profile_id, // Use profile_id as the user field
      rooms: [], // Start with empty rooms array
    }));
    
    blocks.push({
      date,
      start_time: startTime,
      end_time: endTime,
      assignments,
    });
  });
  
  return blocks;
}

export function useUpdateShiftBlocks() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ date, newBlocks }: { date: string, newBlocks: ShiftBlockInsert[] }) => {
      console.log('🔄 Updating shift blocks for date:', date);
      console.log('  📅 Date:', date);
      console.log('  📦 New blocks:', newBlocks.length);
      
      // Delete existing blocks for this date
      const { error: deleteError } = await supabase
        .from('shift_blocks')
        .delete()
        .eq('date', date);
      
      if (deleteError) {
        console.error('❌ Error deleting existing blocks:', deleteError);
        throw deleteError;
      }
      
      console.log('🗑️ Deleted existing shift blocks for date', date);
      
      // Insert new blocks
      if (newBlocks.length > 0) {
        const { data, error: insertError } = await supabase
          .from('shift_blocks')
          .insert(newBlocks)
          .select();
        
        if (insertError) {
          console.error('❌ Error inserting new blocks:', insertError);
          throw insertError;
        }
        
        console.log('✅ Successfully inserted', data?.length, 'new blocks');
        return data;
      }
      
      return [];
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shift_blocks', variables.date] });
      queryClient.invalidateQueries({ queryKey: ['allShiftBlocks'] });
      // Also invalidate the shiftBlocksForOwner query used by useOwnerDisplay
      queryClient.invalidateQueries({ queryKey: ['shiftBlocksForOwner'] });
    },
  });
}

export function useCreateShiftBlockFromExisting() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (shiftBlock: ShiftBlockInsert) => {
      if (!shiftBlock.start_time || !shiftBlock.end_time || !shiftBlock.date) {
        throw new Error('Missing required fields: start_time, end_time, or date');
      }
      
      const { data, error } = await supabase
        .from('shift_blocks')
        .insert([{
          date: shiftBlock.date,
          start_time: shiftBlock.start_time,
          end_time: shiftBlock.end_time,
          assignments: shiftBlock.assignments,
        }])
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      if (variables.date) {
        queryClient.invalidateQueries({ queryKey: ['shift_blocks', variables.date] });
      }
      queryClient.invalidateQueries({ queryKey: ['allShiftBlocks'] });
      // Also invalidate the shiftBlocksForOwner query used by useOwnerDisplay
      queryClient.invalidateQueries({ queryKey: ['shiftBlocksForOwner'] });
    },
  });
}

export function useUpdateShiftBlockFromExisting() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (shiftBlock: ShiftBlockInsert & { id: number }) => {
      if (!shiftBlock.start_time || !shiftBlock.end_time || !shiftBlock.date) {
        throw new Error('Missing required fields: start_time, end_time, or date');
      }
      
      const { data, error } = await supabase
        .from('shift_blocks')
        .update({
          date: shiftBlock.date,
          start_time: shiftBlock.start_time,
          end_time: shiftBlock.end_time,
          assignments: shiftBlock.assignments,
        })
        .eq('id', shiftBlock.id)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      if (variables.date) {
        queryClient.invalidateQueries({ queryKey: ['shift_blocks', variables.date] });
      }
      queryClient.invalidateQueries({ queryKey: ['allShiftBlocks'] });
      // Also invalidate the shiftBlocksForOwner query used by useOwnerDisplay
      queryClient.invalidateQueries({ queryKey: ['shiftBlocksForOwner'] });
    },
  });
}

export function useCopyShiftBlocks() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ sourceDate, targetDate }: { sourceDate: string, targetDate: string }) => {
      // Get all shift blocks for the source date
      const { data: sourceBlocks, error: fetchError } = await supabase
        .from('shift_blocks')
        .select('*')
        .eq('date', sourceDate);
      
      if (fetchError) throw fetchError;
      
      if (!sourceBlocks || sourceBlocks.length === 0) {
        return [];
      }
      
      // Get all shifts for the source date to copy them too
      const { data: sourceShifts, error: shiftsError } = await supabase
        .from('shifts')
        .select('*')
        .eq('date', sourceDate);
      
      if (shiftsError) throw shiftsError;
      
      // Copy shifts to target date
      if (sourceShifts && sourceShifts.length > 0) {
        const newShifts = sourceShifts.map(shift => ({
          ...shift,
          id: undefined,
          date: targetDate,
        }));
        
        const { error: insertShiftsError } = await supabase
          .from('shifts')
          .insert(newShifts);
        
        if (insertShiftsError) throw insertShiftsError;
      }
      
      // Copy blocks to target date
      const newBlocks = sourceBlocks.map(block => ({
        ...block,
        id: undefined,
        date: targetDate,
      }));
      
      const { data, error } = await supabase
        .from('shift_blocks')
        .insert(newBlocks)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shift_blocks', variables.sourceDate] });
      queryClient.invalidateQueries({ queryKey: ['shift_blocks', variables.targetDate] });
      queryClient.invalidateQueries({ queryKey: ['allShiftBlocks'] });
      // Also invalidate the shiftBlocksForOwner query used by useOwnerDisplay
      queryClient.invalidateQueries({ queryKey: ['shiftBlocksForOwner'] });
    },
  });
} 