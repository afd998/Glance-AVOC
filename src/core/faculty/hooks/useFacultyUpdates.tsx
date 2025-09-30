import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { Database } from '../../../types/supabase';
import { useAuth } from '../../../contexts/AuthContext';

type FacultyUpdate = Database['public']['Tables']['faculty_updates']['Row'];

interface CreateFacultyUpdateParams {
  facultyId: number;
  content: string;
}

interface UpdateFacultyUpdateParams {
  updateId: number;
  content: string;
}

interface DeleteFacultyUpdateParams {
  updateId: number;
}

// Function to fetch faculty updates by faculty ID
const fetchFacultyUpdates = async (facultyId: number): Promise<FacultyUpdate[]> => {
  console.log('fetchFacultyUpdates called with facultyId:', facultyId);
  
  if (!facultyId) {
    console.log('No faculty ID provided, returning empty array');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('faculty_updates')
      .select('*')
      .eq('faculty', facultyId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching faculty updates:', error);
      return [];
    }

    console.log('Fetched faculty updates:', data);
    return data || [];
  } catch (error) {
    console.error('Error in fetchFacultyUpdates:', error);
    return [];
  }
};

// Function to create a new faculty update
const createFacultyUpdate = async ({ facultyId, content }: CreateFacultyUpdateParams) => {
  console.log('createFacultyUpdate called with:', { facultyId, content });
  
  if (!facultyId || !content.trim()) {
    throw new Error('Faculty ID and content are required');
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  console.log('User authenticated:', user.email || user.id);

  // First, verify that the faculty member exists
  const { data: facultyMember, error: facultyError } = await supabase
    .from('faculty')
    .select('id')
    .eq('id', facultyId)
    .single();

  if (facultyError || !facultyMember) {
    console.error('Faculty member not found:', { facultyId, error: facultyError });
    throw new Error(`Faculty member with ID ${facultyId} not found`);
  }

  console.log('Faculty member verified:', facultyMember);

  const insertData = {
    faculty: facultyId,
    content: content.trim(),
    author: user.id
  };
  
  console.log('Inserting faculty update with data:', insertData);

  const { data, error } = await supabase
    .from('faculty_updates')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('Error creating faculty update:', error);
    console.error('Error details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    throw error;
  }

  console.log('Faculty update created successfully:', data);
  return data;
};

// Function to update a faculty update
const updateFacultyUpdate = async ({ updateId, content }: UpdateFacultyUpdateParams) => {
  console.log('updateFacultyUpdate called with:', { updateId, content });
  
  if (!updateId || !content.trim()) {
    throw new Error('Update ID and content are required');
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  // First, verify that the user owns this update
  const { data: existingUpdate, error: fetchError } = await supabase
    .from('faculty_updates')
    .select('author')
    .eq('id', updateId)
    .single();

  if (fetchError || !existingUpdate) {
    throw new Error('Update not found');
  }

  if (existingUpdate.author !== user.id) {
    throw new Error('You can only edit your own updates');
  }

  const { data, error } = await supabase
    .from('faculty_updates')
    .update({ content: content.trim() })
    .eq('id', updateId)
    .select()
    .single();

  if (error) {
    console.error('Error updating faculty update:', error);
    throw error;
  }

  console.log('Faculty update updated successfully:', data);
  return data;
};

// Function to delete a faculty update
const deleteFacultyUpdate = async ({ updateId }: DeleteFacultyUpdateParams) => {
  console.log('deleteFacultyUpdate called with:', { updateId });
  
  if (!updateId) {
    throw new Error('Update ID is required');
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  // First, verify that the user owns this update
  const { data: existingUpdate, error: fetchError } = await supabase
    .from('faculty_updates')
    .select('author')
    .eq('id', updateId)
    .single();

  if (fetchError || !existingUpdate) {
    throw new Error('Update not found');
  }

  if (existingUpdate.author !== user.id) {
    throw new Error('You can only delete your own updates');
  }

  const { error } = await supabase
    .from('faculty_updates')
    .delete()
    .eq('id', updateId);

  if (error) {
    console.error('Error deleting faculty update:', error);
    throw error;
  }

  console.log('Faculty update deleted successfully');
  return updateId;
};

// React Query hook for fetching faculty updates
export const useFacultyUpdates = (facultyId: number) => {
  return useQuery({
    queryKey: ['facultyUpdates', facultyId],
    queryFn: () => fetchFacultyUpdates(facultyId),
    enabled: !!facultyId,
  });
};

// React Query mutation hook for creating faculty updates
export const useCreateFacultyUpdate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createFacultyUpdate,
    onSuccess: (data, variables) => {
      // Invalidate and refetch the faculty updates
      queryClient.invalidateQueries({ queryKey: ['facultyUpdates', variables.facultyId] });
    },
    onError: (error) => {
      console.error('Mutation failed:', error);
    }
  });
};

// React Query mutation hook for updating faculty updates
export const useUpdateFacultyUpdate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateFacultyUpdate,
    onSuccess: (data, variables) => {
      // Invalidate and refetch the faculty updates
      queryClient.invalidateQueries({ queryKey: ['facultyUpdates'] });
    },
    onError: (error) => {
      console.error('Update mutation failed:', error);
    }
  });
};

// React Query mutation hook for deleting faculty updates
export const useDeleteFacultyUpdate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteFacultyUpdate,
    onSuccess: (data, variables) => {
      // Invalidate and refetch the faculty updates
      queryClient.invalidateQueries({ queryKey: ['facultyUpdates'] });
    },
    onError: (error) => {
      console.error('Delete mutation failed:', error);
    }
  });
}; 