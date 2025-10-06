import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export const useProfile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Query key for profile data
  const profileQueryKey = ['profile', user?.id];

  // Fetch profile data
  const { data: profile, isLoading, error, refetch } = useQuery({
    queryKey: profileQueryKey,
    queryFn: async () => {
      if (!user) throw new Error('No user');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });

  // Update auto-hide mutation
  const updateAutoHideMutation = useMutation({
    mutationFn: async (autoHide: boolean) => {
      if (!user) throw new Error('No user');
      
      const { error } = await supabase
        .from('profiles')
        .update({ auto_hide: autoHide })
        .eq('id', user.id);

      if (error) throw error;
      return { auto_hide: autoHide };
    },
    onSuccess: () => {
      // Invalidate and refetch profile data
      queryClient.invalidateQueries({ queryKey: profileQueryKey });
    },
  });

  // Update current filter mutation
  const updateCurrentFilterMutation = useMutation({
    mutationFn: async (filterName: string | null) => {
      if (!user) throw new Error('No user');
      
      const { error } = await supabase
        .from('profiles')
        .update({ current_filter: filterName })
        .eq('id', user.id);

      if (error) throw error;
      return { current_filter: filterName };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileQueryKey });
    },
  });

  // Update theme mutation
  const updateThemeMutation = useMutation({
    mutationFn: async (theme: string) => {
      if (!user) throw new Error('No user');
      
      const { error } = await supabase
        .from('profiles')
        .update({ theme })
        .eq('id', user.id);

      if (error) throw error;
      return { theme };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileQueryKey });
    },
  });

  // Convenience methods
  const updateAutoHide = (autoHide: boolean) => {
    updateAutoHideMutation.mutate(autoHide);
  };

  const updateCurrentFilter = (filterName: string | null) => {
    updateCurrentFilterMutation.mutate(filterName);
  };

  const updateTheme = (theme: string) => {
    updateThemeMutation.mutate(theme);
  };

  return {
    // Data
    profile,
    autoHide: profile?.auto_hide || false,
    currentFilter: profile?.current_filter,
    theme: profile?.theme || 'light', // Default to light theme
    
    // Loading states
    isLoading,
    isUpdatingAutoHide: updateAutoHideMutation.isPending,
    isUpdatingCurrentFilter: updateCurrentFilterMutation.isPending,
    isUpdatingTheme: updateThemeMutation.isPending,
    
    // Errors
    error,
    autoHideError: updateAutoHideMutation.error,
    currentFilterError: updateCurrentFilterMutation.error,
    themeError: updateThemeMutation.error,
    
    // Actions
    updateAutoHide,
    updateCurrentFilter,
    updateTheme,
    refetch,
  };
}; 