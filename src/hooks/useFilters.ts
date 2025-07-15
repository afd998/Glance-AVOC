import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Database } from '../types/supabase';

type RoomFilter = Database['public']['Tables']['room_filters']['Row'];

export interface Filter {
  id: number;
  name: string | null;
  display: string[]; // Array of room names to display
  notify: string[]; // Array of room names for notifications
  owner: string | null;
  isDefault: boolean;
  createdAt: string;
}

// Parse the display and notify JSON arrays
const parseFilter = (filter: RoomFilter): Filter => {
  const display = Array.isArray(filter.display) ? filter.display : [];
  const notifyRooms = Array.isArray(filter.notify) ? filter.notify : [];
  
  return {
    id: filter.id,
    name: filter.name,
    display: display as string[],
    notify: notifyRooms as string[],
    owner: filter.owner,
    isDefault: filter.default || false,
    createdAt: filter.created_at,
  };
};

export const useFilters = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Query key for filters data
  const filtersQueryKey = ['filters', user?.id];

  // Fetch filters data
  const { data: filters, isLoading, error } = useQuery({
    queryKey: filtersQueryKey,
    queryFn: async () => {
      if (!user) throw new Error('No user');
      
      // Fetch user's own filters
      const { data: userFilters, error: userError } = await supabase
        .from('room_filters')
        .select('*')
        .eq('owner', user.id);

      if (userError) throw userError;

      // Fetch default filters (available to everyone)
      const { data: defaultFilters, error: defaultError } = await supabase
        .from('room_filters')
        .select('*')
        .eq('default', true);

      if (defaultError) throw defaultError;

      // Combine and parse all filters, removing duplicates by ID
      const allFilters = [...(userFilters || []), ...(defaultFilters || [])];
      const uniqueFilters = allFilters.filter((filter, index, self) => 
        index === self.findIndex(f => f.id === filter.id)
      );
      return uniqueFilters.map(parseFilter);
    },
    enabled: !!user,
  });

  // Save filter mutation
  const saveFilterMutation = useMutation({
    mutationFn: async (filter: Omit<Filter, 'id' | 'createdAt'>) => {
      if (!user) throw new Error('No user');
      
      const { data, error } = await supabase
        .from('room_filters')
        .insert({
          name: filter.name,
          display: filter.display,
          notify: filter.notify,
          owner: user.id,
          default: false,
        })
        .select()
        .single();

      if (error) throw error;
      
      // Also update the profile to set this as the current filter
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          current_filter: filter.name,
          auto_hide: false 
        })
        .eq('id', user.id);

      if (profileError) throw profileError;
      
      return parseFilter(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: filtersQueryKey });
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });

  // Delete filter mutation
  const deleteFilterMutation = useMutation({
    mutationFn: async (filterId: number) => {
      if (!user) throw new Error('No user');
      
      const { error } = await supabase
        .from('room_filters')
        .delete()
        .eq('id', filterId)
        .eq('owner', user.id); // Only allow deleting own filters

      if (error) throw error;
      return filterId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: filtersQueryKey });
    },
  });

  // Load filter mutation
  const loadFilterMutation = useMutation({
    mutationFn: async (filter: Filter) => {
      if (!user) throw new Error('No user');
      
      // Update profile with current filter name
      const { error } = await supabase
        .from('profiles')
        .update({ 
          current_filter: filter.name,
          auto_hide: false 
        })
        .eq('id', user.id);

      if (error) throw error;
      return filter;
    },
    onSuccess: (filter) => {
      // Update room store state with the filter's room selections
      const { setSelectedRooms, setNotificationRooms } = require('../stores/roomStore').default.getState();
      setSelectedRooms(filter.display);
      setNotificationRooms(filter.notify);
      
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });

  // Convenience methods
  const saveFilter = (name: string, displayRooms: string[], notifyRooms: string[]) => {
    const newFilter: Omit<Filter, 'id' | 'createdAt'> = {
      name,
      display: displayRooms,
      notify: notifyRooms,
      owner: user?.id || null,
      isDefault: false,
    };
    saveFilterMutation.mutate(newFilter);
  };

  const deleteFilter = (filterId: number) => {
    deleteFilterMutation.mutate(filterId);
  };

  const loadFilter = (filter: Filter) => {
    loadFilterMutation.mutate(filter);
  };

  return {
    // Data
    filters: filters || [],
    userFilters: filters?.filter(f => f.owner === user?.id) || [],
    defaultFilters: filters?.filter(f => f.isDefault) || [],
    
    // Loading states
    isLoading,
    isSavingFilter: saveFilterMutation.isPending,
    isDeletingFilter: deleteFilterMutation.isPending,
    isLoadingFilter: loadFilterMutation.isPending,
    
    // Errors
    error,
    saveFilterError: saveFilterMutation.error,
    deleteFilterError: deleteFilterMutation.error,
    loadFilterError: loadFilterMutation.error,
    
    // Actions
    saveFilter,
    deleteFilter,
    loadFilter,
    
    // Mutations (for direct access)
    saveFilterMutation,
  };
}; 