import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../../lib/supabase';
import type { Database } from '../../../../types/supabase';

export type ShiftBlock = Database['public']['Tables']['shift_blocks']['Row'];
export type ShiftBlockInsert = Database['public']['Tables']['shift_blocks']['Insert'];
export type Shift = Database['public']['Tables']['shifts']['Row'];


export function useShiftBlocks(date: string | null) {
  return useQuery({
    queryKey: ['shift_blocks', date],
    queryFn: async () => {
      if (date == null) {
        // If no date provided, fetch all shift blocks
        const { data, error } = await supabase
          .from('shift_blocks')
          .select('*')
          .order('date', { ascending: true })
          .order('start_time', { ascending: true });
        if (error) throw error;
        return data || [];
      }
      
      // Fetch shift blocks for specific date
      const { data, error } = await supabase
        .from('shift_blocks')
        .select('*')
        .eq('date', date)
        .order('start_time', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    staleTime: Infinity, // Data never becomes stale - only invalidated on page refresh
    gcTime: 1000 * 60 * 60 * 24, // Keep in cache for 24 hours
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
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
        // Filter out any zero-duration blocks before inserting
        const validBlocks = newBlocks.filter(block => {
          if (block.start_time === block.end_time) {
            console.error(`🚨 ERROR: Attempting to insert zero-duration block: ${block.start_time} -> ${block.end_time}`);
            return false;
          }
          return true;
        });
        
        console.log(`🔍 Filtered ${newBlocks.length - validBlocks.length} zero-duration blocks`);
        console.log('🔍 Valid blocks to insert:', validBlocks.map(b => ({ start: b.start_time, end: b.end_time })));
        
        const { data, error: insertError } = await supabase
          .from('shift_blocks')
          .insert(validBlocks)
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
    onSuccess: async (data, variables) => {
      // First, refetch the shift blocks to ensure they're updated
      await queryClient.refetchQueries({ queryKey: ['shift_blocks', variables.date] });
      await queryClient.refetchQueries({ queryKey: ['shift_blocks'] });
      
      // Then invalidate event ownership queries so they use the updated shift blocks
      queryClient.invalidateQueries({ queryKey: ['eventOwnership'] });
    },
  });
}



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
      });
      
      await Promise.all(copyPromises);
    },
    onSuccess: async (_, variables) => {
      // First, refetch all shift_blocks queries for the week dates
      for (const date of variables.weekDates) {
        const dateString = date.toISOString().split('T')[0];
        await queryClient.refetchQueries({ queryKey: ['shift_blocks', dateString] });
      }
      
      // Refetch shifts queries
      await queryClient.refetchQueries({ queryKey: ['shifts'] });
      
      // Then invalidate event ownership queries so they use the updated shift blocks
      queryClient.invalidateQueries({ queryKey: ['eventOwnership'] });
    },
  });
}

// Hook to check if all rooms are assigned in shift blocks for a given date
export function useAllRoomsAssigned(date: string | null) {
  return useQuery({
    queryKey: ['allRoomsAssigned', date],
    queryFn: async (): Promise<boolean> => {
      if (!date) return false;

      // Get all rooms
      const { data: rooms, error: roomsError } = await supabase
        .from('rooms')
        .select('name')
        .order('name');
      
      if (roomsError) throw roomsError;
      const allRoomNames = rooms.map(room => room.name).filter((name): name is string => Boolean(name));
      
      if (allRoomNames.length === 0) return false;

      // Get shift blocks for the date
      const { data: shiftBlocks, error: blocksError } = await supabase
        .from('shift_blocks')
        .select('*')
        .eq('date', date)
        .order('start_time', { ascending: true });
      
      if (blocksError) throw blocksError;
      if (!shiftBlocks || shiftBlocks.length === 0) return false;

      // Collect all assigned rooms from all shift blocks
      const assignedRooms = new Set<string>();
      
      shiftBlocks.forEach(block => {
        if (block.assignments && Array.isArray(block.assignments)) {
          block.assignments.forEach((assignment: any) => {
            if (assignment.rooms && Array.isArray(assignment.rooms)) {
              assignment.rooms.forEach((room: string) => {
                assignedRooms.add(room);
              });
            }
          });
        }
      });

      // Check if all rooms are assigned
      return allRoomNames.every(roomName => assignedRooms.has(roomName));
    },
    enabled: !!date,
    staleTime: 30 * 1000, // 30 seconds
  });
}
