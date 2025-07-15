import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

interface UserProfile {
  id: string;
  name: string | null;
}

// Function to fetch user profile by ID
const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
  if (!userId) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in fetchUserProfile:', error);
    return null;
  }
};

// React Query hook for fetching user profile
export const useUserProfile = (userId: string) => {
  return useQuery({
    queryKey: ['userProfile', userId],
    queryFn: () => fetchUserProfile(userId),
    enabled: !!userId,
  });
}; 