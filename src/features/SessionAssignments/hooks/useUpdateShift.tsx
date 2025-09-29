import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import type { Database } from '../../../types/supabase';

export type ShiftInsert = Database['public']['Tables']['shifts']['Insert'];
export type Shift = Database['public']['Tables']['shifts']['Row'];
export type ShiftBlockInsert = Database['public']['Tables']['shift_blocks']['Insert'];

// Function to calculate new shift blocks based on shifts
function calculateNewShiftBlocks(shifts: Shift[], date: string): ShiftBlockInsert[] {
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

// Helper function to update shift blocks for a specific date
async function updateShiftBlocksForDate(date: string) {
  try {
    console.log('🔄 Updating shift blocks for date:', date);
    
    // Get all shifts for this date
    const { data: shifts, error: shiftsError } = await supabase
      .from('shifts')
      .select('*')
      .eq('date', date);
    
    if (shiftsError) {
      console.error('Error fetching shifts for shift block update:', shiftsError);
      throw shiftsError;
    }
    
    console.log('📋 Current shifts for date:', shifts);
    
    // Delete all existing shift blocks for this date
    const { error: deleteBlocksError } = await supabase
      .from('shift_blocks')
      .delete()
      .eq('date', date);
    
    if (deleteBlocksError) {
      console.error('Error deleting existing shift blocks:', deleteBlocksError);
      throw deleteBlocksError;
    }
    
    console.log('🗑️ Deleted existing shift blocks for date:', date);
    
    // Calculate new shift blocks
    const newBlocks = calculateNewShiftBlocks(shifts || [], date);
    console.log('🧮 Calculated new shift blocks:', newBlocks);
    
    // Insert new shift blocks if any
    if (newBlocks.length > 0) {
      const { error: insertBlocksError } = await supabase
        .from('shift_blocks')
        .insert(newBlocks);
      
      if (insertBlocksError) {
        console.error('Error inserting new shift blocks:', insertBlocksError);
        throw insertBlocksError;
      }
      
      console.log('✅ Inserted new shift blocks:', newBlocks.length);
    } else {
      console.log('ℹ️ No shift blocks to insert (no overlapping shifts)');
    }
    
  } catch (error) {
    console.error('❌ Error updating shift blocks:', error);
    throw error;
  }
}

export function useUpdateShift() {
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
        
        // After creating/updating shift, update shift blocks
        await updateShiftBlocksForDate(shift.date);
        
        return data;
      } else {
        console.log('Shift cleared (no start/end time provided)');
        
        // Even when clearing a shift, we need to update shift blocks
        await updateShiftBlocksForDate(shift.date);
        
        return [];
      }
    },
    onSuccess: async (data, variables) => {
      console.log('Shift mutation success, invalidating queries for date:', variables.date);
      // Invalidate the specific query
 
      // Also invalidate all shifts queries to be safe
      await queryClient.invalidateQueries({ queryKey: ['shifts'] });
      // Invalidate shift blocks for this date
      await queryClient.invalidateQueries({ queryKey: ['shift_blocks', variables.date] });
      // Invalidate event ownership queries
     
      await queryClient.invalidateQueries({ 
        queryKey: ['shifts'], 
        predicate: (query) => {
          const queryKey = query.queryKey;
          return queryKey[0] === 'shifts' && Array.isArray(queryKey[1]);
        }
      });
       queryClient.invalidateQueries({ queryKey: ['eventOwnership'] });
      // Invalidate any array-based queries that might include this date
    },
  });
}
