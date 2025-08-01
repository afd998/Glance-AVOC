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
      
      if (typeof dateOrEvent === 'string') {
        date = dateOrEvent;
      } else if (dateOrEvent && typeof dateOrEvent === 'object' && 'date' in dateOrEvent) {
        date = dateOrEvent.date;
      }
      
      if (!date) return null;
      
      // Get shift blocks for the specified date
      const { data: shiftBlocks, error } = await supabase
        .from('shift_blocks')
        .select('*')
        .eq('date', date)
        .order('start_time', { ascending: true });
      
      if (error) throw error;
      
      if (!shiftBlocks || shiftBlocks.length === 0) {
        return null;
      }
      
      // Find the latest end time from all shift blocks
      const latestEndTime = shiftBlocks.reduce((latest, block) => {
        if (!block.end_time) return latest;
        if (!latest) return block.end_time;
        return block.end_time > latest ? block.end_time : latest;
      }, null as string | null);
      
      return latestEndTime;
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
    console.log('findOwnersForEvent: Missing event date/time info');
    return { owner1: null, owner2: null };
  }

  const eventDate = event.date;
  const eventStartTime = event.start_time;
  const eventEndTime = event.end_time;
  const eventRoom = event.room_name;

  console.log('findOwnersForEvent:', {
    eventDate,
    eventStartTime,
    eventEndTime,
    eventRoom,
    shiftBlocksCount: shiftBlocks.length
  });

  if (!eventRoom) {
    console.log('findOwnersForEvent: No event room');
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
    
    console.log('Block check:', {
      blockId: block.id,
      blockDate: block.date,
      blockStart,
      blockEnd,
      overlaps
    });
    
    return overlaps;
  });

  console.log('Relevant blocks:', relevantBlocks);

  // Find owners for the specific room
  const roomOwners = new Set<string>();
  
  relevantBlocks.forEach(block => {
    console.log('Checking block assignments:', block.assignments);
    if (block.assignments && Array.isArray(block.assignments)) {
      block.assignments.forEach((assignment: any) => {
        console.log('Assignment:', assignment);
        if (assignment && assignment.rooms && Array.isArray(assignment.rooms)) {
          if (assignment.rooms.includes(eventRoom)) {
            console.log('Found owner for room:', assignment.user);
            roomOwners.add(assignment.user);
          }
        }
      });
    }
  });

  const owners = Array.from(roomOwners);
  console.log('Final owners:', owners);
  
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

  console.log('useOwnerDisplay result:', {
    eventId: event?.id,
    eventDate: event?.date,
    eventRoom: event?.room_name,
    eventTime: event?.start_time,
    manOwner: event?.man_owner,
    manOwner2: event?.man_owner_2,
    calculatedOwner1: calculatedOwners.owner1,
    calculatedOwner2: calculatedOwners.owner2,
    finalOwner1: owner1,
    finalOwner2: owner2
  });

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