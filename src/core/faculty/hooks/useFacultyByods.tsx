import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { Database } from '../../../types/supabase';

type ByodRow = Database['public']['Tables']['faculty_byods']['Row'];

// Fetch BYOD rows for a faculty
const fetchByods = async (facultyId: number): Promise<ByodRow[]> => {
  if (!facultyId) return [];
  const { data, error } = await supabase
    .from('faculty_byods')
    .select('*')
    .or(`faculty.eq.${facultyId},faculty.is.null`)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching faculty_byods:', error);
    return [];
  }
  return data || [];
};

export const useFacultyByods = (facultyId: number) => {
  return useQuery({
    queryKey: ['facultyByods', facultyId],
    queryFn: () => fetchByods(facultyId),
    enabled: !!facultyId,
    staleTime: 1000 * 60 * 2,
  });
};

interface UpdateParams { id: number; name?: string | null; os?: string | null }

const updateByod = async ({ id, name, os }: UpdateParams) => {
  const { data, error } = await supabase
    .from('faculty_byods')
    .update({ name, os })
    .eq('id', id)
    .select()
    .single();
  if (error) {
    console.error('Error updating faculty_byod:', error);
    throw error;
  }
  return data;
};

export const useUpdateFacultyByod = (facultyId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateByod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facultyByods', facultyId] });
    },
  });
};

const deleteByod = async (id: number) => {
  const { error } = await supabase
    .from('faculty_byods')
    .delete()
    .eq('id', id);
  if (error) {
    console.error('Error deleting faculty_byod:', error);
    throw error;
  }
  return true;
};

export const useDeleteFacultyByod = (facultyId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteByod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facultyByods', facultyId] });
    },
  });
};

interface CreateParams { faculty: number; name: string | null; os: string | null }

const createByod = async ({ faculty, name, os }: CreateParams) => {
  const { data, error } = await supabase
    .from('faculty_byods')
    .insert({ faculty, name, os })
    .select()
    .single();
  if (error) {
    console.error('Error creating faculty_byod:', error);
    throw error;
  }
  return data;
};

export const useCreateFacultyByod = (facultyId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createByod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facultyByods', facultyId] });
    },
  });
};


