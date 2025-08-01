import { useQuery } from '@tanstack/react-query';
import { useUserProfile } from './useUserProfile';
import { useUserProfiles } from './useUserProfiles';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';

type Event = Database['public']['Tables']['events']['Row'];
type ShiftBlock = Database['public']['Tables']['shift_blocks']['Row'];

// Export useHandOffTime function
export function useHandOffTime(dateOrEvent: string | null | Event | undefined) {
  return useQuery({
    queryKey: ['handOffTime', dateOrEvent],
    queryFn: async () => {
      // Handle different input types
      let date: string | null = null;
      let eventStartTime: string | null = null;
      let eventEndTime: string | null = null;
      let eventRoom: string | null = null;
      let eventName: string | null = null;
      
      if (typeof dateOrEvent === 'string') {
        date = dateOrEvent;
      } else if (dateOrEvent && typeof dateOrEvent === 'object' && 'date' in dateOrEvent) {
        date = dateOrEvent.date;
        eventStartTime = dateOrEvent.start_time;
        eventEndTime = dateOrEvent.end_time;
        eventRoom = dateOrEvent.room_name;
        eventName = dateOrEvent.event_name;
      }
      
      const shouldLog = eventName === 'Saraniti Lunch';
      
      if (shouldLog) {
        console.log('useHandOffTime input:', {
          date,
          eventStartTime,
          eventEndTime,
          eventRoom,
          eventName
        });
      }
      
      if (!date || !eventStartTime || !eventEndTime || !eventRoom) {
        if (shouldLog) {
          console.log('useHandOffTime: Missing required data, returning null');
        }
        return null;
      }
      
      // Get shift blocks for the specified date
      const { data: shiftBlocks, error } = await supabase
        .from('shift_blocks')
        .select('*')
        .eq('date', date)
        .order('start_time', { ascending: true });
      
      if (error) throw error;
      
      if (shouldLog) {
        console.log('useHandOffTime: All shift blocks for date:', shiftBlocks);
      }
      
      if (!shiftBlocks || shiftBlocks.length === 0) {
        if (shouldLog) {
          console.log('useHandOffTime: No shift blocks found, returning null');
        }
        return null;
      }
      
      // Find all shift blocks that overlap with the event
      const relevantBlocks = shiftBlocks.filter(block => {
        if (!block.start_time || !block.end_time) return false;
        
        const blockStart = block.start_time;
        const blockEnd = block.end_time;
        
        // Event overlaps with block
        const overlaps = (eventStartTime! >= blockStart && eventStartTime! < blockEnd) ||
               (eventEndTime! > blockStart && eventEndTime! <= blockEnd) ||
               (eventStartTime! <= blockStart && eventEndTime! >= blockEnd);
        
        if (shouldLog) {
          console.log('useHandOffTime: Block overlap check:', {
            blockId: block.id,
            blockStart,
            blockEnd,
            eventStart: eventStartTime,
            eventEnd: eventEndTime,
            overlaps
          });
        }
        
        return overlaps;
      });
      
      if (shouldLog) {
        console.log('useHandOffTime: Relevant blocks that overlap:', relevantBlocks);
      }
      
      if (relevantBlocks.length === 0) {
        if (shouldLog) {
          console.log('useHandOffTime: No relevant blocks overlap with event, returning null');
        }
        return null; // No shift blocks overlap with event
      }
      
      // For each relevant block, find who owns the event during that block's time
      const ownershipPeriods: Array<{
        startTime: string;
        endTime: string;
        owners: string[];
      }> = [];
      
      relevantBlocks.forEach(block => {
        if (!block.start_time || !block.end_time || !block.assignments) return;
        
        // Find the time period this block covers during the event
        const blockStart = block.start_time;
        const blockEnd = block.end_time;
        
        // Calculate the actual overlap period
        const overlapStart = eventStartTime! >= blockStart ? eventStartTime! : blockStart;
        const overlapEnd = eventEndTime! <= blockEnd ? eventEndTime! : blockEnd;
        
        // Find who is assigned to the event's room during this block
        const owners: string[] = [];
        if (Array.isArray(block.assignments)) {
          block.assignments.forEach((assignment: any) => {
            if (assignment && assignment.rooms && Array.isArray(assignment.rooms)) {
              if (assignment.rooms.includes(eventRoom)) {
                owners.push(assignment.user);
              }
            }
          });
        }
        
        if (shouldLog) {
          console.log('useHandOffTime: Ownership period:', {
            blockId: block.id,
            overlapStart,
            overlapEnd,
            owners,
            assignments: block.assignments
          });
        }
        
        ownershipPeriods.push({
          startTime: overlapStart,
          endTime: overlapEnd,
          owners: owners
        });
      });
      
      // Sort by start time
      ownershipPeriods.sort((a, b) => a.startTime.localeCompare(b.startTime));
      
      if (shouldLog) {
        console.log('useHandOffTime: Sorted ownership periods:', ownershipPeriods);
      }
      
      // Find transitions where ownership changes
      const transitions: string[] = [];
      
      for (let i = 0; i < ownershipPeriods.length - 1; i++) {
        const currentPeriod = ownershipPeriods[i];
        const nextPeriod = ownershipPeriods[i + 1];
        
        // Check if ownership changed between periods
        const currentOwners = new Set(currentPeriod.owners);
        const nextOwners = new Set(nextPeriod.owners);
        
        // If the sets are different, there's a transition
        const hasTransition = currentOwners.size !== nextOwners.size || 
            !Array.from(currentOwners).every(owner => nextOwners.has(owner));
        
        if (shouldLog) {
          console.log('useHandOffTime: Transition check:', {
            periodIndex: i,
            currentOwners: Array.from(currentOwners),
            nextOwners: Array.from(nextOwners),
            hasTransition
          });
        }
        
        if (hasTransition) {
          transitions.push(nextPeriod.startTime);
        }
      }
      
      if (shouldLog) {
        console.log('useHandOffTime: Found transitions:', transitions);
      }
      
      // Return the first transition time, or null if no transitions
      const result = transitions.length > 0 ? transitions[0] : null;
      if (shouldLog) {
        console.log('useHandOffTime: Final result:', result);
      }
      
      return result;
    },
    enabled: !!dateOrEvent,
  });
}

interface OwnerDisplayResult {
  owner1: string | null;
  owner2: string | null;
  owner1Profile: any | null;
  owner2Profile: any | null;
  hasTwoOwners: boolean;
  isOwner1FromManOwner: boolean;
  isOwner2FromManOwner: boolean;
  handleUserSelect: (ownerType: 'man_owner' | 'man_owner_2', userId: string) => void;
  handleClearOwner: (ownerType: 'man_owner' | 'man_owner_2') => void;
}

// Helper function to check if a time falls within a shift block
function isTimeInShiftBlock(eventTime: string, blockStart: string, blockEnd: string): boolean {
  return eventTime >= blockStart && eventTime < blockEnd;
}

// Helper function to find owners for an event based on shift blocks
function findOwnersForEvent(event: Event, shiftBlocks: ShiftBlock[]): { owner1: string | null; owner2: string | null } {
  if (!event.date || !event.start_time || !event.end_time) {
    return { owner1: null, owner2: null };
  }

  const eventDate = event.date;
  const eventStartTime = event.start_time;
  const eventEndTime = event.end_time;
  const eventRoom = event.room_name;

  if (!eventRoom) {
    return { owner1: null, owner2: null };
  }

  // Find shift blocks that overlap with the event's time range
  const relevantBlocks = shiftBlocks.filter(block => {
    if (!block.date || !block.start_time || !block.end_time) return false;
    
    // Check if block is for the same date
    if (block.date !== eventDate) return false;
    
    // Check if block overlaps with event time
    const blockStart = block.start_time;
    const blockEnd = block.end_time;
    
    // Event starts during the block OR event ends during the block OR event spans the entire block
    const overlaps = (eventStartTime >= blockStart && eventStartTime < blockEnd) ||
           (eventEndTime > blockStart && eventEndTime <= blockEnd) ||
           (eventStartTime <= blockStart && eventEndTime >= blockEnd);
    
    return overlaps;
  });

  // Find owners for the specific room
  const roomOwners = new Set<string>();
  
  relevantBlocks.forEach(block => {
    if (block.assignments && Array.isArray(block.assignments)) {
      block.assignments.forEach((assignment: any) => {
        if (assignment && assignment.rooms && Array.isArray(assignment.rooms)) {
          if (assignment.rooms.includes(eventRoom)) {
            roomOwners.add(assignment.user);
          }
        }
      });
    }
  });

  const owners = Array.from(roomOwners);
  
  return {
    owner1: owners[0] || null,
    owner2: owners[1] || null
  };
}

export function useOwnerDisplay(event: Event | null): OwnerDisplayResult {
  const queryClient = useQueryClient();

  // Get shift blocks for the event's date
  const { data: shiftBlocks = [] } = useQuery({
    queryKey: ['shiftBlocksForOwner', event?.date],
    queryFn: async () => {
      if (!event?.date) return [];
      
      const { data, error } = await supabase
        .from('shift_blocks')
        .select('*')
        .eq('date', event.date)
        .order('start_time', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!event?.date,
  });

  // Calculate owners from shift blocks
  const calculatedOwners = event ? findOwnersForEvent(event, shiftBlocks) : { owner1: null, owner2: null };

  // Use manual owners if they exist, otherwise use calculated owners
  const owner1 = event?.man_owner || calculatedOwners.owner1 || '';
  const owner2 = event?.man_owner_2 || calculatedOwners.owner2;

  // Get profiles for the owners
  const { data: owner1Profile } = useUserProfile(owner1);
  const { data: owner2Profile } = useUserProfile(owner2 || '');

  // Check if owners are from manual assignment
  const isOwner1FromManOwner = event?.man_owner !== null && event?.man_owner !== undefined;
  const isOwner2FromManOwner = event?.man_owner_2 !== null && event?.man_owner_2 !== undefined;

  const hasTwoOwners = !!(owner2 && owner1 !== owner2);

  // Update event mutation
  const updateEventMutation = useMutation({
    mutationFn: async ({ eventId, updates }: { eventId: number, updates: Partial<Event> }) => {
      const { data, error } = await supabase
        .from('events')
        .update(updates)
        .eq('id', eventId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (updatedEvent) => {
      // Update the event in cache
      queryClient.setQueryData(['event', event?.id], updatedEvent);
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  const handleUserSelect = (ownerType: 'man_owner' | 'man_owner_2', userId: string) => {
    if (!event) return;
    
    const updates: Partial<Event> = {};
    updates[ownerType] = userId;
    
    updateEventMutation.mutate({
      eventId: event.id,
      updates
    });
  };

  const handleClearOwner = (ownerType: 'man_owner' | 'man_owner_2') => {
    if (!event) return;
    
    const updates: Partial<Event> = {};
    updates[ownerType] = null;
    
    updateEventMutation.mutate({
      eventId: event.id,
      updates
    });
  };

  return {
    owner1,
    owner2,
    owner1Profile,
    owner2Profile,
    hasTwoOwners,
    isOwner1FromManOwner,
    isOwner2FromManOwner,
    handleUserSelect,
    handleClearOwner,
  };
} 