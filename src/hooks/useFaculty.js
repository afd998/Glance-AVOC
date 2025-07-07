import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

// Function to fetch faculty member by 25Live name
const fetchFacultyMember = async (twentyfiveliveName) => {
  if (!twentyfiveliveName) {
    console.log('fetchFacultyMember - no twentyfiveliveName provided');
    return null;
  }

  console.log('fetchFacultyMember - searching for:', twentyfiveliveName);
  console.log('fetchFacultyMember - timestamp:', new Date().toISOString());

  try {
    // First, let's see what's in the faculty table
    const { data: allFaculty, error: listError } = await supabase
      .from('faculty')
      .select('twentyfivelive_name, kelloggdirectory_name');

    console.log('fetchFacultyMember - all faculty in table:', allFaculty);
    console.log('fetchFacultyMember - list error:', listError);

    // Now try the specific query
    const { data, error } = await supabase
      .from('faculty')
      .select('*')
      .eq('twentyfivelive_name', twentyfiveliveName)
      .single();

    console.log('fetchFacultyMember - Supabase response data:', data);
    console.log('fetchFacultyMember - Supabase response error:', error);
    console.log('fetchFacultyMember - query completed at:', new Date().toISOString());

    if (error) {
      console.error('Error fetching faculty member:', error);
      return null;
    }

    // Map database column names to expected property names
    if (data) {
      console.log('fetchFacultyMember - raw data from Supabase:', data);
      console.log('fetchFacultyMember - timing value:', data.timing);
      console.log('fetchFacultyMember - complexity value:', data.complexity);
      console.log('fetchFacultyMember - temperment value:', data.temperment);
      console.log('fetchFacultyMember - uses_mic value:', data.uses_mic);
      console.log('fetchFacultyMember - right_source value:', data.right_source);
      console.log('fetchFacultyMember - left_source value:', data.left_source);
      
      const mappedData = {
        name: data.kelloggdirectory_name,
        title: data.kelloggdirectory_title,
        subtitle: data.kelloggdirectory_subtitle,
        bio: data.kelloggdirectory_bio,
        imageUrl: data.kelloggdirectory_image_url,
        bioUrl: data.kelloggdirectory_bio_url,
        twentyfivelive_name: data.twentyfivelive_name,
        timing: data.timing,
        complexity: data.complexity,
        temperment: data.temperment,
        uses_mic: data.uses_mic,
        right_source: data.right_source,
        left_source: data.left_source,
        setup_notes: data.setup_notes
      };
      
      console.log('fetchFacultyMember - mapped data:', mappedData);
      return mappedData;
    }

    console.log('fetchFacultyMember - no data found');
    return null;
  } catch (error) {
    console.error('Error in fetchFacultyMember:', error);
    return null;
  }
};

// Function to update faculty member attributes
const updateFacultyAttributes = async ({ twentyfiveliveName, attributes }) => {
  if (!twentyfiveliveName) {
    throw new Error('No faculty name provided');
  }

  console.log('updateFacultyAttributes - updating:', twentyfiveliveName, 'with:', attributes);

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

  console.log('updateFacultyAttributes - success:', data);
  return data;
};

// React Query hook for individual faculty member
export const useFacultyMember = (twentyfiveliveName) => {
  return useQuery({
    queryKey: ['facultyMember', twentyfiveliveName],
    queryFn: () => fetchFacultyMember(twentyfiveliveName),
    enabled: !!twentyfiveliveName,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    cacheTime: 1000 * 60 * 60 * 24, // Keep in cache for 24 hours
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
      queryClient.invalidateQueries(['facultyMember', variables.twentyfiveliveName]);
      
      // Optionally, you can also update the cache directly for immediate UI update
      queryClient.setQueryData(['facultyMember', variables.twentyfiveliveName], (oldData) => {
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