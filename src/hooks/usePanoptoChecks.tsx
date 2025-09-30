import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

import { supabase } from '../lib/supabase';
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';

const PANOPTO_CHECK_INTERVAL = 30 * 60 * 1000; // 30 minutes in milliseconds

// Hook to get panopto checks data for a specific event with realtime updates
export const usePanoptoChecksData = (eventId: number) => {
  const queryClient = useQueryClient();
  const queryClientRef = useRef(queryClient);

  // Keep the ref updated
  queryClientRef.current = queryClient;

  const query = useQuery({
    queryKey: ['panoptoChecks', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('panopto_checks')
        .select(`
          check_time, 
          completed_time, 
          completed_by_user_id,
          status,
          profiles!panopto_checks_completed_by_user_id_fkey(id, name)
        `)
        .eq('event_id', eventId)
        .order('check_time');

      if (error) throw error;
      return data || [];
    },
    enabled: !!eventId,
    staleTime: 120000, // Consider data stale after 2 minutes
  });

  // Set up realtime subscription for this specific event
  useEffect(() => {
    if (!eventId) return;

    let channel: any = null;

    const setupBroadcast = async () => {

      // Set auth for broadcast (required for authorization)
      await supabase.realtime.setAuth();
      
      // Use Broadcast approach - listen to topic for this specific event
      channel = supabase
        .channel(`topic:${eventId}`)
        .on('broadcast', { event: 'INSERT' }, (payload) => {
          queryClientRef.current.invalidateQueries({ 
            queryKey: ['panoptoChecks', eventId] 
          });
        })
        .on('broadcast', { event: 'UPDATE' }, (payload) => {
          queryClientRef.current.invalidateQueries({ 
            queryKey: ['panoptoChecks', eventId] 
          });
        })
        .on('broadcast', { event: 'DELETE' }, (payload) => {
          queryClientRef.current.invalidateQueries({ 
            queryKey: ['panoptoChecks', eventId] 
          });
        })
        .subscribe((status) => {
          console.log(`🔴 Broadcast subscription status:`, status);
        });
    };

    setupBroadcast();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [eventId]);

  return query;
};



