import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { Database } from '../../../types/supabase';

type RoomFilter = Database['public']['Tables']['room_filters']['Row'];

export interface Filter {
  id: number;
  name: string | null;
  display: string[]; // Array of room names to display
  owner: string | null;
  isDefault: boolean;
  createdAt: string;
}

// Parse the display JSON array
const parseFilter = (filter: RoomFilter): Filter => {
  const display = Array.isArray(filter.display) ? filter.display : [];
  
  return {
    id: filter.id,
    name: filter.name,
    display: display as string[],
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
      // Fetch all filters
      const { data: allFilters, error } = await supabase
        .from('room_filters')
        .select('*');

      if (error) throw error;

      return allFilters.map(parseFilter);
    },
    enabled: !!user,
  });


  // Load filter mutation
  const loadFilterMutation = useMutation({
    mutationFn: async (filter: Filter) => {
      if (!user) throw new Error('No user');

      // First get the current auto_hide setting
      const { data: currentProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('auto_hide')
        .eq('id', user.id)
        .single();

      if (fetchError) throw fetchError;

      // Update profile with current filter name, preserving auto_hide setting
      const { error } = await supabase
        .from('profiles')
        .update({
          current_filter: filter.name,
          auto_hide: currentProfile?.auto_hide || false
        })
        .eq('id', user.id);

      if (error) throw error;
      return filter;
    },
    onSuccess: (filter) => {
      // Update room store state with the filter's room selections
    
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });


  const loadFilter = (filter: Filter) => {
    loadFilterMutation.mutate(filter);
  };

  // Get filter by name
  const getFilterByName = (name: string) => {
    return filters?.find(filter => filter.name === name);
  };

  return {
    // Data
    filters: filters || [],
    
    // Loading states
    isLoading,
    isLoadingFilter: loadFilterMutation.isPending,
    
    // Errors
    error,
    loadFilterError: loadFilterMutation.error,
    
    // Actions
    loadFilter,
    getFilterByName,
  };
}; 