import { useUserProfile } from './useUserProfile';
import { useUserProfiles } from './useUserProfiles';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';

type Event = Database['public']['Tables']['events']['Row'];

export function useOwnerDisplay(event: Event) {
  const queryClient = useQueryClient();
  
  // Get the display owners (man_owner takes precedence over owner)
  const owner1 = event.man_owner || event.owner || '';
  const owner2 = event.man_owner_2 || event.owner_2;
  
  // Get user profiles for tooltips
  const { data: owner1Profile } = useUserProfile(owner1);
  const { data: owner2Profile } = useUserProfile(owner2 || '');
  
  // Check each owner individually for yellow dot display
  const isOwner1FromManOwner = event.man_owner !== null && event.man_owner !== undefined;
  const isOwner2FromManOwner = event.man_owner_2 !== null && event.man_owner_2 !== undefined;
  
  // Check if there are two different owners
  const hasTwoOwners = owner2 && owner1 !== owner2;
  
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
      queryClient.setQueryData(['event', event.id], updatedEvent);
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  const handleUserSelect = (ownerType: 'man_owner' | 'man_owner_2', userId: string) => {
    const updates: Partial<Event> = {};
    updates[ownerType] = userId;
    
    updateEventMutation.mutate({
      eventId: event.id,
      updates
    });
  };

  const handleClearOwner = (ownerType: 'man_owner' | 'man_owner_2') => {
    const updates: Partial<Event> = {};
    updates[ownerType] = null;
    
    updateEventMutation.mutate({
      eventId: event.id,
      updates
    });
  };

  return {
    // Display data
    owner1,
    owner2,
    owner1Profile,
    owner2Profile,
    hasTwoOwners,
    
    // Yellow dot indicators
    isOwner1FromManOwner,
    isOwner2FromManOwner,
    
    // Actions
    handleUserSelect,
    handleClearOwner,
    updateEventMutation
  };
} 