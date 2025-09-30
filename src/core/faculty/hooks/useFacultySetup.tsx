import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { Database } from '../../../types/supabase';

type FacultySetup = Database['public']['Tables']['faculty_setup']['Row'];

interface FacultySetupAttributes {
  uses_mic: boolean;
  left_source: string;
  right_source: string;
}

interface UpdateFacultySetupParams {
  facultyId: number;
  attributes: FacultySetupAttributes;
}

// Function to fetch faculty setup by faculty ID
const fetchFacultySetup = async (facultyId: number): Promise<FacultySetup | null> => {
  if (!facultyId) {
    return null;
  }
  try {
    const { data, error } = await supabase
      .from('faculty_setup')
      .select('*')
      .eq('id', facultyId)
      .single();
    
    if (error) {
      console.error('Error fetching faculty setup:', error);
      return null;
    }
    return data;
  } catch (error) {
    console.error('Error in fetchFacultySetup:', error);
    return null;
  }
};

// Function to update faculty setup attributes
const updateFacultySetupAttributes = async ({ facultyId, attributes }: UpdateFacultySetupParams) => {
  if (!facultyId) {
    throw new Error('No faculty ID provided');
  }
  
  const { data, error } = await supabase
    .from('faculty_setup')
    .update({
      uses_mic: attributes.uses_mic,
      left_source: attributes.left_source,
      right_source: attributes.right_source,
      updated_at: new Date().toISOString()
    })
    .eq('id', facultyId)
    .select()
    .single();
    
  if (error) {
    console.error('Error updating faculty setup attributes:', error);
    throw error;
  }
  return data;
};

// React Query hook for faculty setup
export const useFacultySetup = (facultyId: number) => {
  return useQuery({
    queryKey: ['facultySetup', facultyId],
    queryFn: () => fetchFacultySetup(facultyId),
    enabled: !!facultyId,
    staleTime: 1000 * 60 * 5,
    retry: 3
  });
};

// React Query mutation hook for updating faculty setup attributes
export const useUpdateFacultySetupAttributes = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateFacultySetupAttributes,
    onSuccess: (data, variables) => {
      // Invalidate faculty setup query
      queryClient.invalidateQueries({ queryKey: ['facultySetup', variables.facultyId] });
      
      // Update faculty setup cache
      queryClient.setQueryData(['facultySetup', variables.facultyId], (oldData: FacultySetup | undefined) => {
        if (oldData) {
          return {
            ...oldData,
            uses_mic: variables.attributes.uses_mic,
            left_source: variables.attributes.left_source,
            right_source: variables.attributes.right_source,
            updated_at: new Date().toISOString()
          };
        }
        return oldData;
      });
    },
    onError: (error) => {
      console.error('Faculty setup mutation failed:', error);
    }
  });
};
