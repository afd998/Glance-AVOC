import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

interface UserProfile {
  id: string;
  name: string | null;
}

// Function to validate UUID format
const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

// Function to fetch user profile by ID
const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
  if (!userId || userId === 'unknown' || !isValidUUID(userId)) {
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
    queryKey: ['profile', userId],
    queryFn: () => fetchUserProfile(userId),
    enabled: !!userId && userId !== 'unknown' && isValidUUID(userId),
  });
};

// Utility function to update profile name if it's null
export const updateProfileNameIfNeeded = async (userId: string) => {
  try {
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error('Error fetching profile for update:', fetchError);
      return;
    }

    if (profile && !profile.name) {
      // Update the profile to use the user ID (email) as the name
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ name: userId })
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating profile name:', updateError);
      } else {
        console.log('Updated profile name for user:', userId);
      }
    }
  } catch (error) {
    console.error('Error in updateProfileNameIfNeeded:', error);
  }
}; 