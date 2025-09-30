import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/supabase';

export type Profile = Database['public']['Tables']['profiles']['Row'];

export function useUserProfiles() {
  const {
    data: profiles,
    isLoading,
    error,
  } = useQuery<Profile[]>({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');
      if (error) throw error;
      return data || [];
    },
  });

  return { profiles, isLoading, error };
} 