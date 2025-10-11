import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { User } from '@supabase/supabase-js';

// Helper function to create a profile if it doesn't exist
const createProfile = async (user: User) => {
  console.log('[createProfile] Creating profile for user:', user.id);
  
  const profileData = {
    id: user.id,
    name: user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
    auto_hide: false,
    theme: 'light',
    roles: [],
    // Set default values for other fields
    bg: null,
    color: null,
    current_filter: null,
    pixels_per_min: 2,
    row_height: 96,
    zoom: 1.0,
    start_hour: 7,
    end_hour: 23,
  };

  const { data, error } = await supabase
    .from('profiles')
    .insert(profileData)
    .select()
    .single();

  if (error) {
    console.error('[createProfile] Error creating profile:', error);
    throw error;
  }

  console.log('[createProfile] Profile created successfully:', data);
  return data;
};

export const useProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  // Query key for profile data
  const profileQueryKey = ['profile', user?.id];

  // Fetch profile data
  const { data: profile, isLoading, error, refetch } = useQuery({
    queryKey: profileQueryKey,
    queryFn: async () => {
      if (!user) {
        throw new Error('No user');
      }
      
      console.log('[useProfile] Fetching profile for user:', {
        userId: user.id,
        userEmail: user.email,
        userName: user.user_metadata?.name || user.user_metadata?.full_name
      });
      
      // Try explicit column selection first
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, auto_hide, bg, color, current_filter, pixels_per_min, roles, row_height, theme, zoom, start_hour, end_hour')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('[useProfile] Query error:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        
        // If profile doesn't exist, try to create it
        if (error.code === 'PGRST116') {
          console.log('[useProfile] Profile not found, attempting to create...');
          return await createProfile(user);
        }
        
        throw error;
      }
      
      console.log('[useProfile] Raw profile data:', data);
      console.log('[useProfile] Profile keys:', data ? Object.keys(data) : 'No data');
      
      return data;
    },
    enabled: !!user && !authLoading,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });

  // Update schedule hours mutation
  const updateScheduleHoursMutation = useMutation({
    mutationFn: async ({ startHour, endHour }: { startHour: number; endHour: number }) => {
      if (!user) throw new Error('No user');

      const clampedStart = Math.max(0, Math.min(22, Math.floor(startHour)));
      const clampedEnd = Math.max(clampedStart + 1, Math.min(23, Math.ceil(endHour)));

      const { error } = await supabase
        .from('profiles')
        .update({ start_hour: clampedStart, end_hour: clampedEnd })
        .eq('id', user.id);

      if (error) throw error;
      return { start_hour: clampedStart, end_hour: clampedEnd };
    },
    onSuccess: () => {
      console.log('[useProfile] schedule hours updated successfully');
      queryClient.invalidateQueries({ queryKey: profileQueryKey });
    },
    onError: (err) => {
      console.error('[useProfile] schedule hours update failed', err);
    }
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

  // Update zoom mutation
  const updateZoomMutation = useMutation({
    mutationFn: async (zoom: number) => {
      if (!user) throw new Error('No user');

      // Store zoom as decimal (1.0 for 100%, 1.2 for 120%, etc.)
      const { error } = await supabase
        .from('profiles')
        .update({ zoom })
        .eq('id', user.id);

      if (error) throw error;
      return { zoom };
    },
    onSuccess: () => {
      console.log('[useProfile] zoom updated successfully');
      queryClient.invalidateQueries({ queryKey: profileQueryKey });
    },
    onError: (err) => {
      console.error('[useProfile] zoom update failed', err);
    }
  });

  // Update pixels per minute mutation
  const updatePixelsPerMinMutation = useMutation({
    mutationFn: async (pixelsPerMin: number) => {
      if (!user) throw new Error('No user');

      const { error } = await supabase
        .from('profiles')
        .update({ pixels_per_min: pixelsPerMin })
        .eq('id', user.id);

      if (error) throw error;
      return { pixels_per_min: pixelsPerMin };
    },
    onSuccess: () => {
      console.log('[useProfile] pixels_per_min updated successfully');
      queryClient.invalidateQueries({ queryKey: profileQueryKey });
    },
    onError: (err) => {
      console.error('[useProfile] pixels_per_min update failed', err);
    }
  });

  // Update row height mutation
  const updateRowHeightMutation = useMutation({
    mutationFn: async (rowHeightPx: number) => {
      if (!user) throw new Error('No user');

      const { error } = await supabase
        .from('profiles')
        .update({ row_height: rowHeightPx })
        .eq('id', user.id);

      if (error) throw error;
      return { row_height: rowHeightPx };
    },
    onSuccess: () => {
      console.log('[useProfile] row_height updated successfully');
      queryClient.invalidateQueries({ queryKey: profileQueryKey });
    },
    onError: (err) => {
      console.error('[useProfile] row_height update failed', err);
    }
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

  const updateZoom = (zoom: number) => {
    updateZoomMutation.mutate(zoom);
  };

  const updatePixelsPerMin = (pixelsPerMin: number) => {
    updatePixelsPerMinMutation.mutate(pixelsPerMin);
  };

  const updateRowHeight = (rowHeightPx: number) => {
    updateRowHeightMutation.mutate(rowHeightPx);
  };

  // Normalize zoom to decimal format (1.0 = 100%, 1.2 = 120%, etc.)
  const normalizedZoom = (() => {
    const raw = profile?.zoom;
    if (typeof raw !== 'number') return 1;
    
    // If the value is > 2, it's likely stored as percentage (100, 120, etc.)
    // Convert to decimal format (100 -> 1.0, 120 -> 1.2)
    if (raw > 2) {
      return raw / 100;
    }
    
    // If the value is <= 2, it's already in decimal format
    return raw;
  })();


  return {
    // Data
    profile,
    email: user?.email || 'user@example.com',
    autoHide: profile?.auto_hide || false,
    currentFilter: profile?.current_filter,
    theme: profile?.theme || 'light', // Default to light theme
    // New profile-driven UI preferences
    zoom: normalizedZoom,
    pixelsPerMin: typeof profile?.pixels_per_min === 'number' ? profile.pixels_per_min : 2,
    rowHeightPx: typeof profile?.row_height === 'number' ? profile.row_height : 96,
    startHour: typeof profile?.start_hour === 'number' ? profile.start_hour : 7,
    endHour: typeof profile?.end_hour === 'number' ? profile.end_hour : 23,
    
    // Loading states
    isLoading,
    isUpdatingAutoHide: updateAutoHideMutation.isPending,
    isUpdatingCurrentFilter: updateCurrentFilterMutation.isPending,
    isUpdatingTheme: updateThemeMutation.isPending,
    isUpdatingZoom: updateZoomMutation.isPending,
    isUpdatingPixelsPerMin: updatePixelsPerMinMutation.isPending,
    isUpdatingRowHeight: updateRowHeightMutation.isPending,
    isUpdatingScheduleHours: updateScheduleHoursMutation.isPending,
    
    // Errors
    error,
    autoHideError: updateAutoHideMutation.error,
    currentFilterError: updateCurrentFilterMutation.error,
    themeError: updateThemeMutation.error,
    zoomError: updateZoomMutation.error,
    pixelsPerMinError: updatePixelsPerMinMutation.error,
    rowHeightError: updateRowHeightMutation.error,
    scheduleHoursError: updateScheduleHoursMutation.error,
    
    // Actions
    updateAutoHide,
    updateCurrentFilter,
    updateTheme,
    updateZoom,
    updatePixelsPerMin,
    updateRowHeight,
    updateScheduleHours: (startHour: number, endHour: number) =>
      updateScheduleHoursMutation.mutate({ startHour, endHour }),
    refetch,
  };
}; 
