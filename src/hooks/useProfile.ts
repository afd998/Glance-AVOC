import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Json } from '../types/supabase';
import useRoomStore from '../stores/roomStore';

export interface RoomFilters {
  selectedRooms: string[];
  notificationRooms: string[];
  autoHideEmpty: boolean;
}

export interface Preset {
  id: string;
  name: string;
  selectedRooms: string[];
  notificationRooms: string[];
}

// Type guard to check if a value is a valid Preset array
const isPresetArray = (value: any): value is Preset[] => {
  return Array.isArray(value) && value.every(item => 
    typeof item === 'object' && 
    typeof item.name === 'string' &&
    Array.isArray(item.selectedRooms) &&
    Array.isArray(item.notificationRooms)
  );
};

// Convert Json to Preset array with validation
const parsePresets = (json: Json | null | undefined): Preset[] => {
  if (!json || !isPresetArray(json)) {
    return [];
  }
  return json as Preset[];
};

export const useProfile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Query key for profile data
  const profileQueryKey = ['profile', user?.id];

  // Fetch profile data
  const { data: profile, isLoading, error } = useQuery({
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
  });

  // Update auto-hide mutation
  const updateAutoHideMutation = useMutation({
    mutationFn: async (autoHide: boolean) => {
      if (!user) throw new Error('No user');
      
      // When auto-hide is turned on, clear the current_filter
      const updateData = autoHide 
        ? { auto_hide: autoHide, current_filter: null }
        : { auto_hide: autoHide };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
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

  // Save preset mutation
  const savePresetMutation = useMutation({
    mutationFn: async (preset: Preset) => {
      if (!user) throw new Error('No user');
      
      // Get current presets and add new one
      const currentPresets = parsePresets(profile?.room_filters);
      const updatedPresets = [...currentPresets, preset];

      const { error } = await supabase
        .from('profiles')
        .update({ room_filters: updatedPresets as unknown as Json })
        .eq('id', user.id);

      if (error) throw error;
      return preset;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileQueryKey });
    },
  });

  // Delete preset mutation
  const deletePresetMutation = useMutation({
    mutationFn: async (presetId: string) => {
      if (!user) throw new Error('No user');
      
      const currentPresets = parsePresets(profile?.room_filters);
      const updatedPresets = currentPresets.filter(preset => preset.id !== presetId);

      const { error } = await supabase
        .from('profiles')
        .update({ room_filters: updatedPresets as unknown as Json })
        .eq('id', user.id);

      if (error) throw error;
      return presetId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileQueryKey });
    },
  });

  // Load preset mutation
  const loadPresetMutation = useMutation({
    mutationFn: async (preset: Preset) => {
      if (!user) throw new Error('No user');
      
      // Update current_filter and turn off auto-hide
      const { error } = await supabase
        .from('profiles')
        .update({ 
          current_filter: preset.name,
          auto_hide: false 
        })
        .eq('id', user.id);

      if (error) throw error;
      return preset;
    },
    onSuccess: (preset) => {
      // Update room store state with the preset's room selections
      const { setSelectedRooms, setNotificationRooms } = useRoomStore.getState();
      setSelectedRooms(preset.selectedRooms);
      setNotificationRooms(preset.notificationRooms);
      
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

  const savePreset = (name: string, selectedRooms: string[], notificationRooms: string[]) => {
    const newPreset: Preset = {
      id: Date.now().toString(),
      name,
      selectedRooms,
      notificationRooms,
    };
    savePresetMutation.mutate(newPreset);
  };

  const deletePreset = (presetId: string) => {
    deletePresetMutation.mutate(presetId);
  };

  const loadPreset = (preset: Preset) => {
    loadPresetMutation.mutate(preset);
  };

  // Parse presets from profile data
  const presets = parsePresets(profile?.room_filters);

  return {
    // Data
    profile,
    presets,
    autoHide: profile?.auto_hide || false,
    currentFilter: profile?.current_filter,
    
    // Loading states
    isLoading,
    isUpdatingAutoHide: updateAutoHideMutation.isPending,
    isUpdatingCurrentFilter: updateCurrentFilterMutation.isPending,
    isSavingPreset: savePresetMutation.isPending,
    isDeletingPreset: deletePresetMutation.isPending,
    isLoadingPreset: loadPresetMutation.isPending,
    
    // Errors
    error,
    autoHideError: updateAutoHideMutation.error,
    currentFilterError: updateCurrentFilterMutation.error,
    savePresetError: savePresetMutation.error,
    deletePresetError: deletePresetMutation.error,
    loadPresetError: loadPresetMutation.error,
    
    // Actions
    updateAutoHide,
    updateCurrentFilter,
    savePreset,
    deletePreset,
    loadPreset,
  };
}; 