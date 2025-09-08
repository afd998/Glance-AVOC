import { useQuery } from '@tanstack/react-query';
import { useUserProfile } from './useUserProfile';
import { useUserProfiles } from './useUserProfiles';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { updateEventInCache } from './useEvents';
import { notifyEventAssignment } from '../utils/notificationUtils';
import type { Database } from '../types/supabase';

type Event = Database['public']['Tables']['events']['Row'];
type ShiftBlock = Database['public']['Tables']['shift_blocks']['Row'];

// Base data structure for intersecting shift blocks
interface IntersectingBlock {
  blockId: number;
  startTime: string;
  endTime: string;
  owners: string[];
}

// Processed ownership data
interface OwnershipData {
  owners: string[];
  handOffTimes: string[];
}

// Timeline entry for ownership display
interface OwnershipTimelineEntry {
  ownerId: string;
  transitionTime?: string; // undefined for the last owner
}

// Get intersecting shift blocks for an event
function getIntersectingBlocks(event: Event, shiftBlocks: ShiftBlock[]): IntersectingBlock[] {
  if (!event.date || !event.start_time || !event.end_time || !event.room_name) {
    return [];
  }

  const eventDate = event.date;
  const eventStartTime = event.start_time;
  const eventEndTime = event.end_time;
  const eventRoom = event.room_name;



  // Find shift blocks that overlap with the event
  const relevantBlocks = shiftBlocks.filter(block => {
    if (!block.date || !block.start_time || !block.end_time) return false;
    
    // Check if block is for the same date
    if (block.date !== eventDate) return false;
    
    // Check if block overlaps with event time
    const blockStart = block.start_time;
    const blockEnd = block.end_time;
    
    // Event overlaps with block
    const overlaps = (eventStartTime >= blockStart && eventStartTime < blockEnd) ||
           (eventEndTime > blockStart && eventEndTime <= blockEnd) ||
           (eventStartTime <= blockStart && eventEndTime >= blockEnd);
    

    
    return overlaps;
  });

  // For each relevant block, find who owns the event's room
  const intersectingBlocks: IntersectingBlock[] = [];
  
  relevantBlocks.forEach(block => {
    if (!block.start_time || !block.end_time || !block.assignments) return;
    
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
    

    
    intersectingBlocks.push({
      blockId: block.id,
      startTime: block.start_time,
      endTime: block.end_time,
      owners: owners
    });
  });

  // Sort by start time
  return intersectingBlocks.sort((a, b) => a.startTime.localeCompare(b.startTime));
}

// Process intersecting blocks to get owners and hand-off times
function processOwnershipData(intersectingBlocks: IntersectingBlock[]): OwnershipData {
  if (intersectingBlocks.length === 0) {
    return { owners: [], handOffTimes: [] };
  }

  // Collect all unique owners
  const allOwners = new Set<string>();
  intersectingBlocks.forEach(block => {
    block.owners.forEach(owner => allOwners.add(owner));
  });

  // Find hand-off times between consecutive blocks
  const handOffTimes: string[] = [];
  
  for (let i = 0; i < intersectingBlocks.length - 1; i++) {
    const currentBlock = intersectingBlocks[i];
    const nextBlock = intersectingBlocks[i + 1];
    
    // Check if ownership changed between blocks
    const currentOwners = new Set(currentBlock.owners);
    const nextOwners = new Set(nextBlock.owners);
    
    // If the sets are different, there's a hand-off
    const hasHandOff = currentOwners.size !== nextOwners.size || 
        !Array.from(currentOwners).every(owner => nextOwners.has(owner));
    
    if (hasHandOff) {
      handOffTimes.push(currentBlock.endTime);
    }
  }

  return {
    owners: Array.from(allOwners),
    handOffTimes
  };
}

// Create timeline entries for ownership display
function createOwnershipTimeline(owners: string[], handOffTimes: string[], manualOwner?: string | null): OwnershipTimelineEntry[] {
  const timeline: OwnershipTimelineEntry[] = [];
  
  // If there's a manual owner, show it first
  if (manualOwner) {
    timeline.push({
      ownerId: manualOwner,
      transitionTime: undefined // Manual owner doesn't have transition time
    });
    return timeline;
  }
  
  // Otherwise, show calculated owners from shift blocks
  if (owners.length === 0) return [];
  
  owners.forEach((ownerId, index) => {
    timeline.push({
      ownerId,
      transitionTime: index < handOffTimes.length ? handOffTimes[index] : undefined
    });
  });
  
  return timeline;
}

// Main hook to get ownership data for an event
export function useEventOwnership(event: Event | null) {
  return useQuery({
    queryKey: ['eventOwnership', event?.id, event?.date, event?.man_owner],
    queryFn: async () => {
      if (!event?.date) return null;
      
      // Return no owners for KEC events
      if (event.event_type === "KEC") {
        return {
          intersectingBlocks: [],
          owners: [],
          handOffTimes: [],
          timeline: []
        };
      }
      

      
      // Get shift blocks for the event's date
      const { data: shiftBlocks, error } = await supabase
        .from('shift_blocks')
        .select('*')
        .eq('date', event.date)
        .order('start_time', { ascending: true });
      
      if (error) throw error;
      

      
      // Get intersecting blocks
      const intersectingBlocks = getIntersectingBlocks(event, shiftBlocks || []);
      

      
      // Process ownership data
      const ownershipData = processOwnershipData(intersectingBlocks);
      

      
      // Create timeline for display
      const timeline = createOwnershipTimeline(ownershipData.owners, ownershipData.handOffTimes, event.man_owner);
      

      
      return {
        intersectingBlocks,
        ...ownershipData,
        timeline
      };
    },
    enabled: !!event?.date,
  });
}



// Mutation for assigning manual owner
export function useAssignManualOwner() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ eventId, userId }: { eventId: number; userId: string }) => {
      const { data, error } = await supabase
        .from('events')
        .update({ man_owner: userId })
        .eq('id', eventId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: async (updatedEvent) => {
      // Update the individual event cache
      queryClient.setQueryData(['event', updatedEvent.id], updatedEvent);
      
      // Update the specific date-based events query to avoid full refetch
      const dateString = updatedEvent.date;
      const existingEvents = queryClient.getQueryData(['events', dateString]) as Event[];
      if (existingEvents) {
        const updatedEvents = existingEvents.map(event => 
          event.id === updatedEvent.id ? updatedEvent : event
        );
        queryClient.setQueryData(['events', dateString], updatedEvents);
      }

      // Invalidate event ownership queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['eventOwnership', updatedEvent.id] });

      // Send notification to the assigned user
      try {
        await notifyEventAssignment(
          updatedEvent.id,
          updatedEvent.man_owner!,
          updatedEvent.event_name || 'Event'
        );
      } catch (error) {
        console.error('Failed to send event assignment notification:', error);
      }
    },
  });
}

// Mutation for clearing manual owner
export function useClearManualOwner() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ eventId }: { eventId: number }) => {
      const { data, error } = await supabase
        .from('events')
        .update({ man_owner: null })
        .eq('id', eventId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (updatedEvent) => {
      // Update the individual event cache
      queryClient.setQueryData(['event', updatedEvent.id], updatedEvent);
      
      // Update the specific date-based events query to avoid full refetch
      const dateString = updatedEvent.date;
      const existingEvents = queryClient.getQueryData(['events', dateString]) as Event[];
      if (existingEvents) {
        const updatedEvents = existingEvents.map(event => 
          event.id === updatedEvent.id ? updatedEvent : event
        );
        queryClient.setQueryData(['events', dateString], updatedEvents);
      }

      // Invalidate event ownership queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['eventOwnership', updatedEvent.id] });
    },
  });
} 