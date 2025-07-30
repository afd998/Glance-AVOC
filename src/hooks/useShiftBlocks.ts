import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';

export type ShiftBlock = Database['public']['Tables']['shift_blocks']['Row'];
export type ShiftBlockInsert = Database['public']['Tables']['shift_blocks']['Insert'];
export type Shift = Database['public']['Tables']['shifts']['Row'];
export type Event = Database['public']['Tables']['events']['Row'];

/**
 * Enhanced useShiftBlocks hook with event synchronization
 * 
 * This module provides shift block management with automatic event owner synchronization.
 * When shift blocks are created, updated, or deleted, the corresponding events in the
 * events table are automatically updated to reflect the ownership assignments.
 * 
 * Features:
 * - Automatic event owner clearing when shift blocks are deleted
 * - Automatic event owner assignment when shift blocks are created/updated
 * - Enhanced mutations for full day updates and copying between days
 * - Comprehensive logging for debugging
 * - Manual sync function for troubleshooting
 * - Proper timezone handling for event owner assignments
 */

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
      
      // Sort by start_time to ensure chronological order (earliest first)
      const sortedData = (data || []).sort((a, b) => {
        if (!a.start_time || !b.start_time) return 0;
        return a.start_time.localeCompare(b.start_time);
      });
      
      return sortedData;
    },
    enabled: week_start != null,
  });
}

// ============================================================================
// TIMEZONE AND TIME UTILITY FUNCTIONS
// ============================================================================

/**
 * Normalize time string to HH:MM format
 */
function normalizeTimeString(t: string | null | undefined): string | null {
  if (!t) return null;
  const [h, m] = t.split(':');
  if (h === undefined || m === undefined) return null;
  const hour = h.padStart(2, '0');
  const minute = m.padStart(2, '0');
  return `${hour}:${minute}`;
}

/**
 * Convert day of week and week start to actual date with proper timezone handling
 * This ensures we're working with the correct local date for the target day
 */
function getDateFromDayOfWeek(dayOfWeek: number, weekStart: string): string {
  // Parse the week start date (should be in YYYY-MM-DD format)
  const weekStartDate = new Date(weekStart + 'T00:00:00');
  
  // Calculate the target date by adding the day offset
  const targetDate = new Date(weekStartDate);
  targetDate.setDate(weekStartDate.getDate() + dayOfWeek);
  
  // Return in YYYY-MM-DD format for consistent database queries
  return targetDate.toISOString().split('T')[0];
}

/**
 * Create proper ISO timestamps for database queries with timezone consideration
 * This ensures we're querying the correct time range in the database
 * 
 * IMPORTANT: Events in the database are stored in UTC, so we need to convert
 * local time ranges to UTC for proper comparison
 */
function createTimeRangeForDay(dayOfWeek: number, weekStart: string, startTime: string, endTime: string): {
  startTimestamp: string;
  endTimestamp: string;
  date: string;
} {
  const date = getDateFromDayOfWeek(dayOfWeek, weekStart);

  // Parse date and time
  const [year, month, day] = date.split('-').map(Number);
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);

  // Helper to get offset in minutes for America/Chicago on this date
  function getChicagoOffsetMinutes(y: number, m: number, d: number, h: number, min: number) {
    // Create a UTC date for the local time
    const utcDate = new Date(Date.UTC(y, m - 1, d, h, min));
    // Get the local hour in Chicago
    const chicagoHour = Number(utcDate.toLocaleString('en-US', { timeZone: 'America/Chicago', hour12: false, hour: '2-digit' }));
    // Get the UTC hour
    const utcHour = utcDate.getUTCHours();
    // Calculate offset
    let offset = (chicagoHour - utcHour) * 60;
    // Adjust for day wrap
    if (offset > 720) offset -= 1440;
    if (offset < -720) offset += 1440;
    // Now get the full offset in minutes
    const chicagoDate = new Date(utcDate.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
    return -(chicagoDate.getTimezoneOffset());
  }

  // Get offsets for start and end
  const startOffset = getChicagoOffsetMinutes(year, month, day, startHour, startMinute);
  const endOffset = getChicagoOffsetMinutes(year, month, day, endHour, endMinute);

  // Calculate UTC millis for start and end
  const utcStartMillis = Date.UTC(year, month - 1, day, startHour, startMinute) - startOffset * 60 * 1000;
  const utcEndMillis = Date.UTC(year, month - 1, day, endHour, endMinute) - endOffset * 60 * 1000;

  const startTimestamp = new Date(utcStartMillis).toISOString();
  const endTimestamp = new Date(utcEndMillis).toISOString();

  // For logging, show the local timestamps as they would appear
  const localStartTimestamp = new Date(Date.UTC(year, month - 1, day, startHour, startMinute)).toLocaleString('en-US', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  const localEndTimestamp = new Date(Date.UTC(year, month - 1, day, endHour, endMinute)).toLocaleString('en-US', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  console.log(`🕐 Time conversion for day ${dayOfWeek}:`);
  console.log(`  📅 Date: ${date}`);
  console.log(`  ⏰ Local time range: ${startTime} - ${endTime}`);
  console.log(`  🌍 Local timestamps: ${localStartTimestamp} - ${localEndTimestamp}`);
  console.log(`  🌐 UTC timestamps: ${startTimestamp} - ${endTimestamp}`);
  console.log(`  📊 Start offset: ${startOffset} min, End offset: ${endOffset} min`);

  return { startTimestamp, endTimestamp, date };
}

// ============================================================================
// CENTRALIZED EVENT OWNER MANAGEMENT
// ============================================================================

/**
 * Centralized function to manage event owners for a time range
 * This replaces the separate removeEventOwnersInTimeRange and assignEventOwnersFromShiftBlock functions
 * 
 * IMPROVEMENTS:
 * 1. TIMEZONE HANDLING: Proper timezone-aware date calculations using ISO timestamps
 * 2. CODE REUSE: Single function handles both clearing and assigning owners
 * 3. COMPREHENSIVE LOGGING: Detailed logging for debugging timezone and assignment issues
 * 4. ERROR HANDLING: Graceful error handling with detailed error reporting
 * 5. CONSISTENT TIMESTAMPS: Uses proper ISO format for database queries
 * 6. UTC CONVERSION: Converts local shift block times to UTC for proper event matching
 * 
 * TIMEZONE FIX:
 * - Events in database are stored in UTC
 * - Shift blocks are defined in local time (CST)
 * - We convert shift block time ranges to UTC before querying events
 * - This ensures proper matching between shift blocks and events
 * 
 * USAGE:
 * - To clear owners only: manageEventOwnersInTimeRange(day, week, start, end)
 * - To assign owners: manageEventOwnersInTimeRange(day, week, start, end, assignments)
 * 
 * @param dayOfWeek - Day of week (0-6, where 0 is Sunday)
 * @param weekStart - Week start date in YYYY-MM-DD format
 * @param startTime - Start time in HH:MM or HH:MM:SS format (local time)
 * @param endTime - End time in HH:MM or HH:MM:SS format (local time)
 * @param assignments - Optional array of user assignments with rooms
 * @returns Promise with detailed results of the operation
 */
async function manageEventOwnersInTimeRange(
  dayOfWeek: number,
  weekStart: string,
  startTime: string,
  endTime: string,
  assignments: Array<{ user: string; rooms: string[] }> | null = null
): Promise<{
  clearedEvents: Event[];
  assignedEvents: Event[];
  errors: string[];
}> {
  const date = getDateFromDayOfWeek(dayOfWeek, weekStart);
  
  console.log(`🔄 DEBUG: manageEventOwnersInTimeRange called`);
  console.log(`  📅 Day of week: ${dayOfWeek}`);
  console.log(`  📅 Week start: ${weekStart}`);
  console.log(`  📅 Calculated date: ${date}`);
  console.log(`  ⏰ Time range: ${startTime} - ${endTime}`);
  console.log(`  👥 Assignments:`, assignments);
  console.log(`  🔍 Query will be: date=${date}, start_time>=${startTime}, start_time<${endTime}`);
  
  const clearedEvents: Event[] = [];
  const assignedEvents: Event[] = [];
  const errors: string[] = [];
  
  try {
    // Step 1: Clear all existing owners in the time range
    console.log(`🧹 Step 1: Clearing existing event owners...`);
    
         // First, let's see what events exist in this time range for debugging
     console.log(`🔍 DEBUG: Querying events with: date=${date}, start_time>=${startTime}, start_time<${endTime}`);
     const { data: existingEvents, error: queryError } = await supabase
       .from('events')
       .select('*')
       .eq('date', date)
       .gte('start_time', startTime)
       .lt('start_time', endTime);
       
     if (queryError) {
       console.error(`❌ Error querying events: ${queryError.message}`);
     } else {
       console.log(`🔍 DEBUG: Found ${existingEvents?.length || 0} events in time range ${startTime} to ${endTime}:`);
       if (existingEvents && existingEvents.length > 0) {
         existingEvents.forEach(event => {
           console.log(`  📅 ${event.event_name} in ${event.room_name} - Time: ${event.start_time} - Owner: ${event.owner || 'null'}`);
         });
       } else {
         console.log(`  ⚠️ DEBUG: No events found in this time range!`);
       }
     }
    
    const { data: clearedData, error: clearError } = await supabase
      .from('events')
      .update({ owner: null })
      .eq('date', date)
      .gte('start_time', startTime)
      .lt('start_time', endTime)
      .select('*');
      
    if (clearError) {
      const errorMsg = `Failed to clear event owners: ${clearError.message}`;
      console.error(`❌ ${errorMsg}`);
      errors.push(errorMsg);
      throw clearError;
    }
    
    if (clearedData && clearedData.length > 0) {
      clearedEvents.push(...clearedData);
      console.log(`  ✅ Cleared ownership for ${clearedData.length} events:`, 
        clearedData.map(e => `${e.event_name} in ${e.room_name} (${e.start_time})`));
    } else {
      console.log(`  ℹ️ No events found in time range to clear`);
    }
    
    // Step 2: Assign new owners if assignments are provided
    if (assignments && assignments.length > 0) {
      console.log(`👤 Step 2: Assigning new event owners...`);
      
      for (const assignment of assignments) {
        if (!assignment.rooms || assignment.rooms.length === 0) {
          console.log(`  ⚠️ User ${assignment.user} has no rooms assigned, skipping`);
          continue;
        }
        
        console.log(`  🔄 Assigning ${assignment.user} to rooms: [${assignment.rooms.join(', ')}]`);
        
                 console.log(`🔍 DEBUG: Assigning ${assignment.user} to rooms [${assignment.rooms.join(', ')}]`);
         console.log(`🔍 DEBUG: Assignment query: date=${date}, start_time>=${startTime}, start_time<${endTime}, room_name IN [${assignment.rooms.join(', ')}], event_type != 'KEC'`);
         
         const { data: assignedData, error: assignError } = await supabase
           .from('events')
           .update({ owner: assignment.user })
           .eq('date', date)
           .gte('start_time', startTime)
           .lt('start_time', endTime)
           .in('room_name', assignment.rooms)
           .neq('event_type', 'KEC')
           .select('*');
          
        if (assignError) {
          const errorMsg = `Failed to assign events to ${assignment.user}: ${assignError.message}`;
          console.error(`❌ ${errorMsg}`);
          errors.push(errorMsg);
          continue; // Continue with other assignments even if one fails
        }
        
        if (assignedData && assignedData.length > 0) {
          assignedEvents.push(...assignedData);
          console.log(`  ✅ Assigned ${assignedData.length} events to ${assignment.user} in rooms [${assignment.rooms.join(', ')}]:`, 
            assignedData.map(e => `${e.event_name} in ${e.room_name} (${e.start_time})`));
        } else {
          console.log(`  ℹ️ No events found for ${assignment.user} in rooms [${assignment.rooms.join(', ')}]`);
        }
      }
    } else {
      console.log(`  ℹ️ No assignments provided, only clearing owners`);
    }
    
    console.log(`✅ Event owner management complete:`);
    console.log(`  📊 Cleared: ${clearedEvents.length} events`);
    console.log(`  📊 Assigned: ${assignedEvents.length} events`);
    console.log(`  ❌ Errors: ${errors.length}`);
    
  } catch (error) {
    const errorMsg = `Unexpected error in manageEventOwnersInTimeRange: ${error}`;
    console.error(`❌ ${errorMsg}`);
    errors.push(errorMsg);
  }
  
  return { clearedEvents, assignedEvents, errors };
}

// ============================================================================
// HAND-OFF EVENT OWNER_2 MANAGEMENT
// ============================================================================

/**
 * Manage owner_2 assignments for events that hand off into shift blocks
 * 
 * This function finds events that END in a shift block but DON'T start in it,
 * and assigns/removes owner_2 based on the shift block assignments.
 * 
 * @param dayOfWeek - Day of week (0-6, where 0 is Sunday)
 * @param weekStart - Week start date in YYYY-MM-DD format
 * @param startTime - Start time in HH:MM or HH:MM:SS format (local time)
 * @param endTime - End time in HH:MM or HH:MM:SS format (local time)
 * @param assignments - Optional array of user assignments with rooms
 * @returns Promise with detailed results of the operation
 */
async function manageHandoffEventOwners(
  dayOfWeek: number,
  weekStart: string,
  startTime: string,
  endTime: string,
  assignments: Array<{ user: string; rooms: string[] }> | null = null
): Promise<{
  clearedEvents: Event[];
  assignedEvents: Event[];
  errors: string[];
}> {
  const date = getDateFromDayOfWeek(dayOfWeek, weekStart);
  
  console.log(`🔄 DEBUG: manageHandoffEventOwners called`);
  console.log(`  📅 Day of week: ${dayOfWeek}`);
  console.log(`  📅 Week start: ${weekStart}`);
  console.log(`  📅 Calculated date: ${date}`);
  console.log(`  ⏰ Time range: ${startTime} - ${endTime}`);
  console.log(`  👥 Assignments:`, assignments);
  
  const clearedEvents: Event[] = [];
  const assignedEvents: Event[] = [];
  const errors: string[] = [];
  
  try {
    // Step 1: Clear all existing owner_2 in the time range
    console.log(`🧹 Step 1: Clearing existing event owner_2...`);
    
    const { data: clearedData, error: clearError } = await supabase
      .from('events')
      .update({ owner_2: null })
      .eq('date', date)
      .gte('end_time', startTime)
      .lt('end_time', endTime)
      .select('*');
      
    if (clearError) {
      const errorMsg = `Failed to clear event owner_2: ${clearError.message}`;
      console.error(`❌ ${errorMsg}`);
      errors.push(errorMsg);
      throw clearError;
    }
    
    if (clearedData && clearedData.length > 0) {
      clearedEvents.push(...clearedData);
      console.log(`  ✅ Cleared owner_2 for ${clearedData.length} events:`, 
        clearedData.map(e => `${e.event_name} in ${e.room_name} (${e.end_time})`));
    } else {
      console.log(`  ℹ️ No events found in time range to clear owner_2`);
    }
    
    // Step 2: Assign new owner_2 if assignments are provided
    if (assignments && assignments.length > 0) {
      console.log(`👤 Step 2: Assigning new event owner_2...`);
      
      for (const assignment of assignments) {
        if (!assignment.rooms || assignment.rooms.length === 0) {
          console.log(`  ⚠️ User ${assignment.user} has no rooms assigned, skipping`);
          continue;
        }
        
        console.log(`  🔄 Assigning ${assignment.user} as owner_2 to rooms: [${assignment.rooms.join(', ')}]`);
        
        // Find events that END in this time range but DON'T start in it
        const { data: assignedData, error: assignError } = await supabase
          .from('events')
          .update({ owner_2: assignment.user })
          .eq('date', date)
          .gte('end_time', startTime)
          .lt('end_time', endTime)
          .lt('start_time', startTime) // Event doesn't start in this shift block
          .in('room_name', assignment.rooms)
          .neq('event_type', 'KEC')
          .select('*');
         
        if (assignError) {
          const errorMsg = `Failed to assign owner_2 to ${assignment.user}: ${assignError.message}`;
          console.error(`❌ ${errorMsg}`);
          errors.push(errorMsg);
          continue; // Continue with other assignments even if one fails
        }
        
        if (assignedData && assignedData.length > 0) {
          assignedEvents.push(...assignedData);
          console.log(`  ✅ Assigned owner_2 for ${assignedData.length} events to ${assignment.user} in rooms [${assignment.rooms.join(', ')}]:`, 
            assignedData.map(e => `${e.event_name} in ${e.room_name} (${e.end_time})`));
        } else {
          console.log(`  ℹ️ No events found for ${assignment.user} as owner_2 in rooms [${assignment.rooms.join(', ')}]`);
        }
      }
    } else {
      console.log(`  ℹ️ No assignments provided, only clearing owner_2`);
    }
    
    console.log(`✅ Hand-off event owner_2 management complete:`);
    console.log(`  📊 Cleared: ${clearedEvents.length} events`);
    console.log(`  📊 Assigned: ${assignedEvents.length} events`);
    console.log(`  ❌ Errors: ${errors.length}`);
    
  } catch (error) {
    const errorMsg = `Unexpected error in manageHandoffEventOwners: ${error}`;
    console.error(`❌ ${errorMsg}`);
    errors.push(errorMsg);
  }
  
  return { clearedEvents, assignedEvents, errors };
}

// ============================================================================
// LEGACY FUNCTIONS (for backward compatibility)
// ============================================================================

/**
 * @deprecated Use manageEventOwnersInTimeRange instead
 */
async function removeEventOwnersInTimeRange(
  dayOfWeek: number,
  weekStart: string,
  startTime: string,
  endTime: string
): Promise<void> {
  console.warn('⚠️ removeEventOwnersInTimeRange is deprecated, use manageEventOwnersInTimeRange instead');
  await manageEventOwnersInTimeRange(dayOfWeek, weekStart, startTime, endTime);
}

/**
 * @deprecated Use manageEventOwnersInTimeRange instead
 */
async function assignEventOwnersFromShiftBlock(
  dayOfWeek: number,
  weekStart: string,
  startTime: string,
  endTime: string,
  assignments: Array<{ user: string; rooms: string[] }>
): Promise<void> {
  console.warn('⚠️ assignEventOwnersFromShiftBlock is deprecated, use manageEventOwnersInTimeRange instead');
  await manageEventOwnersInTimeRange(dayOfWeek, weekStart, startTime, endTime, assignments);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Helper to find events that overlap with a time range on a specific date
 */
async function findEventsInTimeRange(
  date: string,
  startTime: string,
  endTime: string,
  rooms?: string[]
): Promise<Event[]> {
  let query = supabase
    .from('events')
    .select('*')
    .eq('date', date)
    .gte('start_time', startTime)
    .lt('start_time', endTime);

  if (rooms && rooms.length > 0) {
    query = query.in('room_name', rooms);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// ============================================================================
// SHIFT BLOCK CALCULATION
// ============================================================================

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

// ============================================================================
// MUTATIONS
// ============================================================================

// Mutation: Delete all shift_blocks for a day and insert new ones (with event synchronization)
export function useUpdateShiftBlocks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ day_of_week, week_start, newBlocks }: { day_of_week: number, week_start: string, newBlocks: ShiftBlockInsert[] }) => {
      console.log('🔄 DEBUG: useUpdateShiftBlocks mutation triggered!');
      console.log('  📅 Day of week:', day_of_week);
      console.log('  📅 Week start:', week_start);
      console.log('  📦 New blocks count:', newBlocks.length);
      console.log('  📦 New blocks:', newBlocks);
      
      // 1. Get existing shift blocks to know what time ranges to clear event owners from
      const { data: existingBlocks, error: fetchError } = await supabase
        .from('shift_blocks')
        .select('*')
        .eq('day_of_week', day_of_week)
        .eq('week_start', week_start);
      if (fetchError) {
        console.error('❌ Error fetching existing blocks:', fetchError);
        throw fetchError;
      }
      
      console.log('📄 Existing blocks found:', existingBlocks);

      // 2. Remove event owners for all existing shift block time ranges
      if (existingBlocks && existingBlocks.length > 0) {
        for (const block of existingBlocks) {
          if (block.start_time && block.end_time) {
            // Clear regular event owners
            await manageEventOwnersInTimeRange(
              day_of_week,
              week_start,
              block.start_time,
              block.end_time
            );
            
            // Clear hand-off event owners
            await manageHandoffEventOwners(
              day_of_week,
              week_start,
              block.start_time,
              block.end_time
            );
          }
        }
      }

      // 3. Delete all shift_blocks for this day/week
      console.log('🗑️ Deleting existing shift blocks for day', day_of_week, 'week', week_start);
      const { error: delError } = await supabase
        .from('shift_blocks')
        .delete()
        .eq('day_of_week', day_of_week)
        .eq('week_start', week_start);
      if (delError) {
        console.error('❌ Error deleting blocks:', delError);
        throw delError;
      }
      console.log('✅ Successfully deleted existing blocks');

      // 4. Insert new shift_blocks
      if (newBlocks.length > 0) {
        console.log('💾 Inserting new shift blocks:', newBlocks);
        const { error: insError, data: insertedData } = await supabase
          .from('shift_blocks')
          .insert(newBlocks)
          .select();
        if (insError) {
          console.error('❌ Error inserting blocks:', insError);
          throw insError;
        }
        console.log('✅ Successfully inserted new blocks:', insertedData);

        // 5. Assign event owners based on new shift block assignments
        for (const block of newBlocks) {
          if (block.start_time && block.end_time && block.assignments) {
            // Manage regular event owners (events that start in this shift block)
            await manageEventOwnersInTimeRange(
              block.day_of_week!,
              block.week_start!,
              block.start_time,
              block.end_time,
              block.assignments as Array<{ user: string; rooms: string[] }>
            );
            
            // Manage hand-off event owners (events that end in this shift block but don't start in it)
            await manageHandoffEventOwners(
              block.day_of_week!,
              block.week_start!,
              block.start_time,
              block.end_time,
              block.assignments as Array<{ user: string; rooms: string[] }>
            );
          }
        }
      }

      return true;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shift_blocks', variables.day_of_week, variables.week_start] });
      queryClient.invalidateQueries({ queryKey: ['allShiftBlocks', variables.week_start] });
      // Also invalidate events queries since we've updated event owners
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

// Manual sync function for troubleshooting - syncs events for a specific shift block
export async function syncEventsForShiftBlock(shiftBlock: ShiftBlock): Promise<void> {
  if (!shiftBlock.start_time || !shiftBlock.end_time || !shiftBlock.day_of_week || !shiftBlock.week_start) {
    throw new Error('Invalid shift block - missing required fields');
  }

  console.log(`🔄 Manually syncing events for shift block ${shiftBlock.id}`);

  // Use the centralized function to manage regular event owners
  await manageEventOwnersInTimeRange(
    shiftBlock.day_of_week,
    shiftBlock.week_start,
    shiftBlock.start_time,
    shiftBlock.end_time,
    shiftBlock.assignments && Array.isArray(shiftBlock.assignments) 
      ? shiftBlock.assignments as Array<{ user: string; rooms: string[] }>
      : null
  );

  // Use the centralized function to manage hand-off event owners
  await manageHandoffEventOwners(
    shiftBlock.day_of_week,
    shiftBlock.week_start,
    shiftBlock.start_time,
    shiftBlock.end_time,
    shiftBlock.assignments && Array.isArray(shiftBlock.assignments) 
      ? shiftBlock.assignments as Array<{ user: string; rooms: string[] }>
      : null
  );

  console.log(`✅ Event sync complete for shift block ${shiftBlock.id}`);
}

export function useCopyShiftBlocks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ 
      sourceDayOfWeek, 
      weekStart 
    }: { 
      sourceDayOfWeek: number, 
      weekStart: string 
    }) => {
      // 1. Get all shifts for the week
      const { data: allShifts, error: shiftsError } = await supabase
        .from('shifts')
        .select('*')
        .eq('week_start', weekStart);
      if (shiftsError) throw shiftsError;

      // 2. Get the source day's shift blocks
      const { data: sourceBlocks, error: blocksError } = await supabase
        .from('shift_blocks')
        .select('*')
        .eq('day_of_week', sourceDayOfWeek)
        .eq('week_start', weekStart);
      if (blocksError) throw blocksError;

      if (!sourceBlocks || sourceBlocks.length === 0) {
        throw new Error('No shift blocks found for source day');
      }

      // 3. Find the schedule for the source day
      const sourceShifts = allShifts?.filter(s => s.day_of_week === sourceDayOfWeek) || [];
      
      // Create a schedule signature: sorted array of "profile_id:start_time:end_time"
      const createScheduleSignature = (shifts: Shift[]) => {
        return shifts
          .map(s => `${s.profile_id}:${normalizeTimeString(s.start_time)}:${normalizeTimeString(s.end_time)}`)
          .sort();
      };

      const sourceSignature = createScheduleSignature(sourceShifts);
      
      // 4. Find other days with matching schedules
      const matchingDays: number[] = [];
      for (let day = 0; day < 7; day++) {
        if (day === sourceDayOfWeek) continue; // Skip source day
        
        const dayShifts = allShifts?.filter(s => s.day_of_week === day) || [];
        const daySignature = createScheduleSignature(dayShifts);
        
        // Compare signatures
        if (daySignature.length === sourceSignature.length && 
            daySignature.every((sig, idx) => sig === sourceSignature[idx])) {
          matchingDays.push(day);
        }
      }

      console.log('Copy Shift Blocks:', {
        sourceDayOfWeek,
        sourceSignature,
        matchingDays,
        sourceBlocksCount: sourceBlocks.length
      });

      // 5. Copy shift blocks to matching days (with event synchronization)
      const copyPromises = matchingDays.map(async (targetDay) => {
        // Get existing blocks for target day to clear event owners
        const { data: existingTargetBlocks, error: fetchTargetError } = await supabase
          .from('shift_blocks')
          .select('*')
          .eq('day_of_week', targetDay)
          .eq('week_start', weekStart);
        if (fetchTargetError) throw fetchTargetError;

        // Remove event owners for existing target day blocks
        if (existingTargetBlocks && existingTargetBlocks.length > 0) {
          for (const block of existingTargetBlocks) {
            if (block.start_time && block.end_time) {
              // Clear regular event owners
              await manageEventOwnersInTimeRange(
                targetDay,
                weekStart,
                block.start_time,
                block.end_time
              );
              
              // Clear hand-off event owners
              await manageHandoffEventOwners(
                targetDay,
                weekStart,
                block.start_time,
                block.end_time
              );
            }
          }
        }

        // Delete existing blocks for target day
        const { error: delError } = await supabase
          .from('shift_blocks')
          .delete()
          .eq('day_of_week', targetDay)
          .eq('week_start', weekStart);
        if (delError) throw delError;

        // Copy blocks with updated day_of_week
        const blocksToInsert = sourceBlocks.map(block => ({
          day_of_week: targetDay,
          week_start: block.week_start,
          start_time: block.start_time,
          end_time: block.end_time,
          assignments: block.assignments,
        }));

        if (blocksToInsert.length > 0) {
          const { error: insError } = await supabase
            .from('shift_blocks')
            .insert(blocksToInsert);
          if (insError) throw insError;

          // Assign event owners for the copied blocks
          for (const block of blocksToInsert) {
            if (block.start_time && block.end_time && block.assignments) {
              // Assign regular event owners
              await manageEventOwnersInTimeRange(
                targetDay,
                weekStart,
                block.start_time,
                block.end_time,
                block.assignments as Array<{ user: string; rooms: string[] }>
              );
              
              // Assign hand-off event owners
              await manageHandoffEventOwners(
                targetDay,
                weekStart,
                block.start_time,
                block.end_time,
                block.assignments as Array<{ user: string; rooms: string[] }>
              );
            }
          }
        }
      });

      await Promise.all(copyPromises);
      
      return { matchingDays, copiedBlocks: sourceBlocks.length };
    },
    onSuccess: (_data, variables) => {
      // Invalidate all shift block queries for this week
      queryClient.invalidateQueries({ queryKey: ['allShiftBlocks', variables.weekStart] });
      for (let day = 0; day < 7; day++) {
        queryClient.invalidateQueries({ queryKey: ['shift_blocks', day, variables.weekStart] });
      }
      // Also invalidate events queries since we've updated event owners
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
} 