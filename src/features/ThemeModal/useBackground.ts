import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export const useBackground = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user's background preference
  const { data: currentBackground, isLoading, error } = useQuery({
    queryKey: ['userBackground', user?.id],
    queryFn: async () => {
      if (!user) return 'Vista.avif'; // Default background

      const { data, error } = await supabase
        .from('profiles')
        .select('bg')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching background preference:', error);
        return 'Vista.avif'; // Default background
      }

      return data?.bg || 'Vista.avif'; // Return saved background or default
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Mutation to update background preference
  const updateBackgroundMutation = useMutation({
    mutationFn: async (newBackground: string) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({ bg: newBackground })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      return newBackground;
    },
    onSuccess: (newBackground) => {
      // Update the query cache with the new background
      queryClient.setQueryData(['userBackground', user?.id], newBackground);
    },
    onError: (error) => {
      console.error('Error updating background preference:', error);
    },
  });

  const setCurrentBackground = (background: string) => {
    updateBackgroundMutation.mutate(background);
  };

  return {
    currentBackground: isLoading ? null : (currentBackground || 'Vista.avif'),
    setCurrentBackground,
    isLoading,
    error,
    isUpdating: updateBackgroundMutation.isPending,
  };
};
