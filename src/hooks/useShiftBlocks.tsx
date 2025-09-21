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
        .eq('date', date)
        .order('start_time', { ascending: true });
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
    staleTime: Infinity, // Data never becomes stale - only invalidated on page refresh
    gcTime: Infinity, // Keep in cache indefinitely
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
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
      // Invalidate event ownership queries so useCalculateOwners updates
      queryClient.invalidateQueries({ queryKey: ['eventOwnership'] });
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
      // Invalidate event ownership queries so useCalculateOwners updates
      queryClient.invalidateQueries({ queryKey: ['eventOwnership'] });
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
      // For delete, we need to invalidate all shift blocks queries since we don't have the date
      queryClient.invalidateQueries({ queryKey: ['shift_blocks'] });
      queryClient.invalidateQueries({ queryKey: ['allShiftBlocks'] });
      // Also invalidate the shiftBlocksForOwner query used by useOwnerDisplay
      queryClient.invalidateQueries({ queryKey: ['shiftBlocksForOwner'] });
      // Invalidate event ownership queries so useCalculateOwners updates
      queryClient.invalidateQueries({ queryKey: ['eventOwnership'] });
    },
  });
}

// Updated to use date instead of week_start
export function calculateNewShiftBlocks(shifts: Shift[], date: string): ShiftBlockInsert[] {
  if (shifts.length === 0) return [];
  
  // Filter out invalid shifts and sort by start time
  const validShifts = shifts
    .filter(shift => shift.start_time && shift.end_time && shift.start_time !== shift.end_time)
    .sort((a, b) => a.start_time!.localeCompare(b.start_time!));
  
  if (validShifts.length === 0) return [];
  
  console.log('🔍 Input shifts:', validShifts.map(s => ({
    profile_id: s.profile_id,
    start_time: s.start_time,
    end_time: s.end_time
  })));
  
  // Simple approach: create one block per unique time period where shifts overlap
  const timePoints = new Set<string>();
  validShifts.forEach(shift => {
    // Normalize time format to HH:MM:SS to avoid duplicates
    const normalizeTime = (time: string) => {
      if (time.includes(':')) {
        const parts = time.split(':');
        if (parts.length === 2) {
          return `${parts[0]}:${parts[1]}:00`;
        }
      }
      return time;
    };
    
    timePoints.add(normalizeTime(shift.start_time!));
    timePoints.add(normalizeTime(shift.end_time!));
  });
  
  const sortedTimePoints = Array.from(timePoints).sort();
  console.log('🔍 Time points:', sortedTimePoints);
  
  const blocks: ShiftBlockInsert[] = [];
  
  // Create blocks between consecutive time points
  for (let i = 0; i < sortedTimePoints.length - 1; i++) {
    const startTime = sortedTimePoints[i];
    const endTime = sortedTimePoints[i + 1];
    
    // Skip if start and end are the same (shouldn't happen with valid shifts, but safety first)
    if (startTime === endTime) {
      console.log(`⚠️ Skipping identical times: ${startTime}`);
      continue;
    }
    
    // Find all users working during this time period
    const workingUsers = new Set<string>();
    
    console.log(`🔍 Checking overlap for block: ${startTime} - ${endTime}`);
    
    validShifts.forEach(shift => {
      const shiftStart = shift.start_time!;
      const shiftEnd = shift.end_time!;
      
      console.log(`  📋 Shift: ${shift.profile_id} (${shiftStart} - ${shiftEnd})`);
      
      // Normalize time format to HH:MM:SS for consistent comparison
      const normalizeTime = (time: string) => {
        if (time.includes(':')) {
          const parts = time.split(':');
          if (parts.length === 2) {
            return `${parts[0]}:${parts[1]}:00`;
          }
        }
        return time;
      };
      
      const normalizedShiftStart = normalizeTime(shiftStart);
      const normalizedShiftEnd = normalizeTime(shiftEnd);
      const normalizedBlockStart = normalizeTime(startTime);
      const normalizedBlockEnd = normalizeTime(endTime);
      
      console.log(`    🔧 Normalized: ${normalizedShiftStart} - ${normalizedShiftEnd} vs block ${normalizedBlockStart} - ${normalizedBlockEnd}`);
      
      // User is working if their shift overlaps with this time period
      // A shift overlaps if:
      // 1. Shift starts before the block ends AND shift ends after the block starts
      // 2. This means the shift is active during at least part of the block
      const condition1 = normalizedShiftStart < normalizedBlockEnd;
      const condition2 = normalizedShiftEnd > normalizedBlockStart;
      const overlaps = condition1 && condition2;
      
      console.log(`    ✅ Condition 1 (${normalizedShiftStart} < ${normalizedBlockEnd}): ${condition1}`);
      console.log(`    ✅ Condition 2 (${normalizedShiftEnd} > ${normalizedBlockStart}): ${condition2}`);
      console.log(`    🎯 Overlaps: ${overlaps}`);
      
      if (overlaps) {
        workingUsers.add(shift.profile_id!);
        console.log(`    👤 Added ${shift.profile_id} to working users`);
      }
    });
    
    console.log(`📊 Final working users for ${startTime} - ${endTime}:`, Array.from(workingUsers));
    
    // Only create block if someone is working
    if (workingUsers.size > 0) {
      const assignments = Array.from(workingUsers).map(userId => ({
        user: userId,
        rooms: []
      }));
      
      blocks.push({
        date,
        start_time: startTime,
        end_time: endTime,
        assignments
      });
      
      console.log(`✅ Created block: ${startTime} - ${endTime} with ${workingUsers.size} users`);
    }
  }
  
  console.log('🔍 Final blocks:', blocks.map(b => ({
    start_time: b.start_time,
    end_time: b.end_time,
    users: Array.isArray(b.assignments) ? b.assignments.map((a: any) => a.user) : []
  })));
  
  return blocks;
}

// Function to automatically assign all rooms to single users in shift blocks
export async function autoAssignRoomsToSingleUsers(date: string): Promise<void> {
  try {
    // Get all shift blocks for the date
    const { data: blocks, error: blocksError } = await supabase
      .from('shift_blocks')
      .select('*')
      .eq('date', date);
    
    if (blocksError) throw blocksError;
    
    if (!blocks || blocks.length === 0) return;
    
    // Get all available rooms
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('name')
      .order('name');
    
    if (roomsError) throw roomsError;
    
    const allRoomNames = rooms.map(room => room.name).filter(Boolean);
    
    // Check each block for single users and auto-assign rooms
    const updatedBlocks = blocks.map(block => {
      const assignments = (block.assignments as any[]) || [];
      
      // If there's only one user and they have no rooms assigned
      if (assignments.length === 1 && assignments[0].rooms.length === 0) {
        const singleUser = assignments[0];
        return {
          ...block,
          assignments: [{
            ...singleUser,
            rooms: allRoomNames
          }]
        };
      }
      
      return block;
    });
    
    // Update the blocks in the database
    for (const block of updatedBlocks) {
      const { error: updateError } = await supabase
        .from('shift_blocks')
        .update({ assignments: block.assignments })
        .eq('id', block.id);
      
      if (updateError) {
        console.error('Error updating block:', block.id, updateError);
      }
    }
    
    console.log('✅ Auto-assigned rooms to single users for date:', date);
  } catch (error) {
    console.error('❌ Error auto-assigning rooms to single users:', error);
    throw error;
  }
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
        
        // Auto-assign rooms to single users after creating blocks
        try {
          await autoAssignRoomsToSingleUsers(date);
        } catch (error) {
          console.error('Warning: Failed to auto-assign rooms to single users:', error);
        }
        
        return data;
      }
      
      return [];
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shift_blocks', variables.date] });
      queryClient.invalidateQueries({ queryKey: ['allShiftBlocks'] });
      // Also invalidate the shiftBlocksForOwner query used by useOwnerDisplay
      queryClient.invalidateQueries({ queryKey: ['shiftBlocksForOwner'] });
      // Invalidate event ownership queries so useCalculateOwners updates
      queryClient.invalidateQueries({ queryKey: ['eventOwnership'] });
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
      // Invalidate event ownership queries so useCalculateOwners updates
      queryClient.invalidateQueries({ queryKey: ['eventOwnership'] });
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
      // Invalidate event ownership queries so useCalculateOwners updates
      queryClient.invalidateQueries({ queryKey: ['eventOwnership'] });
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
      
      // Replace target day's blocks instead of accumulating duplicates
      const { error: deleteTargetBlocksError } = await supabase
        .from('shift_blocks')
        .delete()
        .eq('date', targetDate);
      if (deleteTargetBlocksError) throw deleteTargetBlocksError;
      
      // Copy blocks to target date
      const newBlocks = sourceBlocks.map(block => {
        const { id, created_at, ...blockWithoutId } = block;
        return {
          ...blockWithoutId,
          date: targetDate,
        };
      });
      
      const { data, error } = await supabase
        .from('shift_blocks')
        .insert(newBlocks)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      // Invalidate shift blocks queries only
      queryClient.invalidateQueries({ queryKey: ['shift_blocks', variables.sourceDate] });
      queryClient.invalidateQueries({ queryKey: ['shift_blocks', variables.targetDate] });
      queryClient.invalidateQueries({ queryKey: ['allShiftBlocks'] });
      // Also invalidate the shiftBlocksForOwner query used by useOwnerDisplay
      queryClient.invalidateQueries({ queryKey: ['shiftBlocksForOwner'] });
      // Invalidate event ownership queries so useCalculateOwners updates
      queryClient.invalidateQueries({ queryKey: ['eventOwnership'] });
    },
  });
}