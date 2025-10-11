import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { Database } from '../../../types/supabase';

type FacultySetup = Database['public']['Tables']['faculty_setup']['Row'];
type FacultySetupWithOptionalName = FacultySetup & { name?: string | null };

interface FacultySetupAttributes {
  uses_mic: boolean;
  left_source: string;
  right_source: string;
  byod_os?: string;
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
      .eq('faculty', facultyId)
      .order('created_at', { ascending: true })
      .limit(1);
    
    if (error) {
      console.error('Error fetching faculty setup:', error);
      return null;
    }
    return (Array.isArray(data) ? data[0] : null) as FacultySetup | null;
  } catch (error) {
    console.error('Error in fetchFacultySetup:', error);
    return null;
  }
};

// Fetch all setups for a faculty
const fetchFacultySetups = async (facultyId: number): Promise<FacultySetupWithOptionalName[]> => {
  if (!facultyId) return [];
  const { data, error } = await supabase
    .from('faculty_setup')
    .select('*')
    .eq('faculty', facultyId)
    .order('created_at', { ascending: true });
  if (error) {
    console.error('Error fetching faculty setups list:', error);
    return [];
  }
  return (data as FacultySetupWithOptionalName[]) ?? [];
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
      byod_os: attributes.byod_os,
      updated_at: new Date().toISOString()
    })
    .eq('faculty', facultyId)
    .select();
    
  if (error) {
    console.error('Error updating faculty setup attributes:', error);
    throw error;
  }
  return (Array.isArray(data) ? data[0] : data) as FacultySetup;
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

// React Query hook for list of setups for a faculty
export const useFacultySetups = (facultyId: number) => {
  return useQuery({
    queryKey: ['facultySetups', facultyId],
    queryFn: () => fetchFacultySetups(facultyId),
    enabled: !!facultyId,
    staleTime: 1000 * 60 * 5,
    retry: 3,
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
            byod_os: variables.attributes.byod_os,
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

// Mutation that updates by setup id (string) and reconciles list cache
export const useUpdateFacultySetupAttributesBySetupId = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ setupId, attributes }: { setupId: string; attributes: FacultySetupAttributes; facultyId?: number }) => {
      const { data, error } = await supabase
        .from('faculty_setup')
        .update({
          uses_mic: attributes.uses_mic,
          left_source: attributes.left_source,
          right_source: attributes.right_source,
          byod_os: attributes.byod_os,
          updated_at: new Date().toISOString(),
        })
        .eq('id', setupId)
        .select()
        .single();
      if (error) throw error;
      return data as FacultySetupWithOptionalName;
    },
    onMutate: async (variables) => {
      const { setupId, attributes, facultyId } = variables as { setupId: string; attributes: FacultySetupAttributes; facultyId?: number };
      // Cancel queries likely to be affected
      if (facultyId) {
        await queryClient.cancelQueries({ queryKey: ['facultySetups', facultyId] });
        await queryClient.cancelQueries({ queryKey: ['facultySetup', facultyId] });
      } else {
        await queryClient.cancelQueries({ queryKey: ['facultySetups'] });
        await queryClient.cancelQueries({ queryKey: ['facultySetup'] });
      }

      // Snapshot previous cache values for rollback
      const previousList = facultyId
        ? queryClient.getQueryData<FacultySetupWithOptionalName[] | undefined>(['facultySetups', facultyId])
        : undefined;
      const previousSingles = queryClient.getQueriesData<FacultySetupWithOptionalName | null | undefined>({ queryKey: ['facultySetup'] });

      // Optimistically update the specific faculty list if scoped
      if (facultyId) {
        queryClient.setQueryData<FacultySetupWithOptionalName[] | undefined>(['facultySetups', facultyId], (old) => {
          if (!old) return old;
          return old.map((s) => (s.id === setupId ? { ...s, ...attributes, updated_at: new Date().toISOString() as any } : s));
        });
      } else {
        // Fallback: update any lists containing this setupId
        queryClient.setQueriesData({ queryKey: ['facultySetups'] }, (old: any) => {
          if (!old) return old;
          if (Array.isArray(old)) {
            return old.map((s: FacultySetupWithOptionalName) => (s.id === setupId ? { ...s, ...attributes, updated_at: new Date().toISOString() as any } : s));
          }
          return old;
        });
      }

      // Update any singular cache matching this setup id
      queryClient.setQueriesData({ queryKey: ['facultySetup'] }, (old: any) => {
        if (old && old.id === setupId) {
          return { ...old, ...attributes, updated_at: new Date().toISOString() as any };
        }
        return old;
      });

      return { previousList, previousSingles, facultyId };
    },
    onSuccess: (updated) => {
      // Narrowly reconcile caches for the affected faculty
      const facultyId = (updated as any).faculty as number | undefined;

      if (facultyId) {
        // Update the list cache for this faculty only
        queryClient.setQueryData<FacultySetupWithOptionalName[] | undefined>(
          ['facultySetups', facultyId],
          (old) => (old ? old.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)) : old)
        );

        // Optionally update singular cache if present and matches this row
        queryClient.setQueryData<FacultySetupWithOptionalName | null | undefined>(['facultySetup', facultyId], (old) => {
          if (old && old.id === updated.id) return { ...old, ...updated };
          return old;
        });

        // Invalidate to refetch fresh data if needed
        queryClient.invalidateQueries({ queryKey: ['facultySetups', facultyId] });
        queryClient.invalidateQueries({ queryKey: ['facultySetup', facultyId] });
      } else {
        // Fallback: conservative update across any lists
        queryClient.setQueriesData({ queryKey: ['facultySetups'] }, (old: any) => {
          if (!old) return old;
          if (Array.isArray(old)) {
            return old.map((s: FacultySetupWithOptionalName) => (s.id === updated.id ? { ...s, ...updated } : s));
          }
          return old;
        });
      }
    },
    onError: (error, _variables, context) => {
      if (context?.facultyId && context?.previousList) {
        queryClient.setQueryData(['facultySetups', context.facultyId], context.previousList);
      }
      if (context?.previousSingles) {
        for (const [key, data] of context.previousSingles as any[]) {
          queryClient.setQueryData(key, data);
        }
      }
      console.error('Faculty setup update by setup id failed:', error);
    },
    onSettled: (_data, _error, variables) => {
      const facultyId = (variables as any)?.facultyId as number | undefined;
      if (facultyId) {
        queryClient.invalidateQueries({ queryKey: ['facultySetups', facultyId] });
        queryClient.invalidateQueries({ queryKey: ['facultySetup', facultyId] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['facultySetups'] });
        queryClient.invalidateQueries({ queryKey: ['facultySetup'] });
      }
    },
  });
};

// Update left_device/right_device by setup id
export const useUpdateFacultySetupDevicesBySetupId = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ setupId, leftDevice, rightDevice }: { setupId: string; leftDevice?: string | null; rightDevice?: string | null; facultyId?: number }) => {
      const update: any = { updated_at: new Date().toISOString() };
      if (leftDevice !== undefined) update.left_device = leftDevice; // allow null
      if (rightDevice !== undefined) update.right_device = rightDevice; // allow null
      const { data, error } = await supabase
        .from('faculty_setup')
        .update(update)
        .eq('id', setupId)
        .select()
        .single();
      if (error) throw error;
      return data as FacultySetupWithOptionalName;
    },
    onMutate: async (variables) => {
      const { setupId, leftDevice, rightDevice, facultyId } = variables as { setupId: string; leftDevice?: string | null; rightDevice?: string | null; facultyId?: number };
      if (facultyId) {
        await queryClient.cancelQueries({ queryKey: ['facultySetups', facultyId] });
        await queryClient.cancelQueries({ queryKey: ['facultySetup', facultyId] });
      } else {
        await queryClient.cancelQueries({ queryKey: ['facultySetups'] });
        await queryClient.cancelQueries({ queryKey: ['facultySetup'] });
      }

      const previousList = facultyId
        ? queryClient.getQueryData<FacultySetupWithOptionalName[] | undefined>(['facultySetups', facultyId])
        : undefined;

      // Optimistic update for list cache
      const optimisticUpdate = (s: FacultySetupWithOptionalName) => {
        if (s.id !== setupId) return s;
        const next = { ...s } as any;
        if (leftDevice !== undefined) next.left_device = leftDevice; // null or string
        if (rightDevice !== undefined) next.right_device = rightDevice; // null or string
        next.updated_at = new Date().toISOString() as any;
        return next as FacultySetupWithOptionalName;
      };

      if (facultyId) {
        queryClient.setQueryData<FacultySetupWithOptionalName[] | undefined>(['facultySetups', facultyId], (old) => {
          if (!old) return old;
          return old.map(optimisticUpdate);
        });
      } else {
        queryClient.setQueriesData({ queryKey: ['facultySetups'] }, (old: any) => {
          if (!old) return old;
          if (Array.isArray(old)) {
            return old.map(optimisticUpdate);
          }
          return old;
        });
      }

      return { previousList, facultyId };
    },
    onSuccess: (updated) => {
      const facultyId = (updated as any).faculty as number | undefined;
      if (facultyId) {
        queryClient.setQueryData<FacultySetupWithOptionalName[] | undefined>(
          ['facultySetups', facultyId],
          (old) => (old ? old.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)) : old)
        );
        queryClient.setQueryData<FacultySetupWithOptionalName | null | undefined>(['facultySetup', facultyId], (old) => {
          if (old && old.id === updated.id) return { ...old, ...updated };
          return old;
        });
        queryClient.invalidateQueries({ queryKey: ['facultySetups', facultyId] });
        queryClient.invalidateQueries({ queryKey: ['facultySetup', facultyId] });
      } else {
        queryClient.setQueriesData({ queryKey: ['facultySetups'] }, (old: any) => {
          if (!old) return old;
          if (Array.isArray(old)) {
            return old.map((s: FacultySetupWithOptionalName) => (s.id === updated.id ? { ...s, ...updated } : s));
          }
          return old;
        });
      }
    },
    onError: (_error, _variables, context) => {
      if (context?.facultyId && context?.previousList) {
        queryClient.setQueryData(['facultySetups', context.facultyId], context.previousList);
      }
    },
  });
};

// Update notes by setup id
export const useUpdateFacultySetupNotesBySetupId = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ setupId, notes }: { setupId: string; notes: string | null; facultyId?: number }) => {
      const { data, error } = await supabase
        .from('faculty_setup')
        .update({ notes, updated_at: new Date().toISOString() })
        .eq('id', setupId)
        .select()
        .single();
      if (error) throw error;
      return data as FacultySetupWithOptionalName;
    },
    onMutate: async (variables) => {
      const { setupId, notes, facultyId } = variables as { setupId: string; notes: string | null; facultyId?: number };
      if (facultyId) {
        await queryClient.cancelQueries({ queryKey: ['facultySetups', facultyId] });
        await queryClient.cancelQueries({ queryKey: ['facultySetup', facultyId] });
      } else {
        await queryClient.cancelQueries({ queryKey: ['facultySetups'] });
        await queryClient.cancelQueries({ queryKey: ['facultySetup'] });
      }

      const previousList = facultyId
        ? queryClient.getQueryData<FacultySetupWithOptionalName[] | undefined>(['facultySetups', facultyId])
        : undefined;

      if (facultyId) {
        queryClient.setQueryData<FacultySetupWithOptionalName[] | undefined>(['facultySetups', facultyId], (old) => {
          if (!old) return old;
          return old.map((s) => (s.id === setupId ? { ...s, notes, updated_at: new Date().toISOString() as any } : s));
        });
      } else {
        queryClient.setQueriesData({ queryKey: ['facultySetups'] }, (old: any) => {
          if (!old) return old;
          if (Array.isArray(old)) {
            return old.map((s: FacultySetupWithOptionalName) => (s.id === setupId ? { ...s, notes, updated_at: new Date().toISOString() as any } : s));
          }
          return old;
        });
      }

      return { previousList, facultyId };
    },
    onSuccess: (updated) => {
      const facultyId = (updated as any).faculty as number | undefined;
      if (facultyId) {
        queryClient.setQueryData<FacultySetupWithOptionalName[] | undefined>(
          ['facultySetups', facultyId],
          (old) => (old ? old.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)) : old)
        );
        queryClient.setQueryData<FacultySetupWithOptionalName | null | undefined>(['facultySetup', facultyId], (old) => {
          if (old && old.id === updated.id) return { ...old, ...updated };
          return old;
        });
        queryClient.invalidateQueries({ queryKey: ['facultySetups', facultyId] });
        queryClient.invalidateQueries({ queryKey: ['facultySetup', facultyId] });
      }
    },
  });
};

// Create a new setup for a faculty
export const useCreateFacultySetup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ facultyId, name }: { facultyId: number; name: string }) => {
      const { data, error } = await supabase
        .from('faculty_setup')
        .insert([{ faculty: facultyId, name } as any])
        .select()
        .single();
      if (error) throw error;
      return data as FacultySetupWithOptionalName;
    },
    onSuccess: (created, variables) => {
      queryClient.setQueryData<FacultySetupWithOptionalName[] | undefined>(
        ['facultySetups', variables.facultyId],
        (old) => (old ? [...old, created] : [created])
      );
    },
    onError: (error) => {
      console.error('Create faculty setup failed:', error);
    },
  });
};

// Delete a setup by id
export const useDeleteFacultySetup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ setupId }: { setupId: string }) => {
      const { error } = await supabase
        .from('faculty_setup')
        .delete()
        .eq('id', setupId);
      if (error) throw error;
      return setupId;
    },
    onSuccess: (deletedId, variables, context) => {
      // Invalidate all lists; also optimistically remove from any cached lists
      queryClient.setQueriesData({ queryKey: ['facultySetups'] }, (old: any) => {
        if (!old) return old;
        if (Array.isArray(old)) {
          return old.filter((s: FacultySetupWithOptionalName) => s.id !== deletedId);
        }
        return old;
      });
      queryClient.invalidateQueries({ queryKey: ['facultySetups'] });
      queryClient.invalidateQueries({ queryKey: ['facultySetup'] });
    },
    onError: (error) => {
      console.error('Delete faculty setup failed:', error);
    },
  });
};
