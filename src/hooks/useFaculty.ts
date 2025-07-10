import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';

type FacultyMember = Database['public']['Tables']['faculty']['Row'];

interface FacultyAttributes {
  timing: number;
  complexity: number;
  temperment: number;
  uses_mic: boolean;
  left_source: string;
  right_source: string;
  setup_notes: string;
}

interface UpdateFacultyParams {
  twentyfiveliveName: string;
  attributes: FacultyAttributes;
}

// Function to fetch faculty member by 25Live name
const fetchFacultyMember = async (twentyfiveliveName: string): Promise<FacultyMember | null> => {
  if (!twentyfiveliveName) {
    return null;
  }

  try {
    // Now try the specific query
    const { data, error } = await supabase
      .from('faculty')
      .select('*')
      .eq('twentyfivelive_name', twentyfiveliveName)
      .single();

    if (error) {
      console.error('Error fetching faculty member:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in fetchFacultyMember:', error);
    return null;
  }
};

// Function to update faculty member attributes
const updateFacultyAttributes = async ({ twentyfiveliveName, attributes }: UpdateFacultyParams) => {
  if (!twentyfiveliveName) {
    throw new Error('No faculty name provided');
  }

  const { data, error } = await supabase
    .from('faculty')
    .update({
      timing: attributes.timing,
      complexity: attributes.complexity,
      temperment: attributes.temperment,
      uses_mic: attributes.uses_mic,
      left_source: attributes.left_source,
      right_source: attributes.right_source,
      setup_notes: attributes.setup_notes
    })
    .eq('twentyfivelive_name', twentyfiveliveName)
    .select()
    .single();

  if (error) {
    console.error('Error updating faculty attributes:', error);
    throw error;
  }

  return data;
};

// React Query hook for individual faculty member
export const useFacultyMember = (twentyfiveliveName: string) => {
  return useQuery({
    queryKey: ['facultyMember', twentyfiveliveName],
    queryFn: () => fetchFacultyMember(twentyfiveliveName),
    enabled: !!twentyfiveliveName,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    retry: 3
  });
};

// React Query mutation hook for updating faculty attributes
export const useUpdateFacultyAttributes = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateFacultyAttributes,
    onSuccess: (data, variables) => {
      // Invalidate and refetch the specific faculty member
      queryClient.invalidateQueries({ queryKey: ['facultyMember', variables.twentyfiveliveName] });
      
      // Optionally, you can also update the cache directly for immediate UI update
      queryClient.setQueryData(['facultyMember', variables.twentyfiveliveName], (oldData: FacultyMember | undefined) => {
        if (oldData) {
          return {
            ...oldData,
            timing: variables.attributes.timing,
            complexity: variables.attributes.complexity,
            temperment: variables.attributes.temperment,
            uses_mic: variables.attributes.uses_mic,
            left_source: variables.attributes.left_source,
            right_source: variables.attributes.right_source,
            setup_notes: variables.attributes.setup_notes
          };
        }
        return oldData;
      });
    },
    onError: (error) => {
      console.error('Mutation failed:', error);
    }
  });
}; 
