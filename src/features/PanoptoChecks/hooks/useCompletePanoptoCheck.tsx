import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useEvents } from '../features/Schedule/hooks/useEvents';
import { useEvent } from '../../../core/event/hooks/useEvent';
import { useProfile } from '../../../core/User/useProfile';
import { useShiftBlocks } from '../features/SessionAssignments/hooks/useShiftBlocks';
import { isUserEventOwner } from '../utils/eventUtils';
import { Database } from '../types/supabase';

import { supabase } from '../../../lib/supabase';
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';

const PANOPTO_CHECK_INTERVAL = 30 * 60 * 1000; // 30 minutes in milliseconds

// Hook to complete a specific Panopto check for an event
export const useCompletePanoptoCheckForEvent = (eventId: number | null) => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    
    // Use the useEvent hook to get event data
    const { data: eventData, isLoading: eventLoading, error: eventError } = useEvent(eventId);
    
    // Get current user's profile data for optimistic updates
    const { profile: currentUserProfile } = useProfile();
  
    const mutation = useMutation({
      mutationFn: async ({ checkNumber }: { checkNumber: number }) => {
        if (!eventData) {
          throw new Error('Event data not available');
        }
  
        // Calculate the check time based on check number
        let checkTime: string | null = null;
        if (eventData.start_time) {
          const eventStart = new Date(`${eventData.date}T${eventData.start_time}`);
          const checkTimeDate = new Date(eventStart.getTime() + (checkNumber - 1) * PANOPTO_CHECK_INTERVAL);
          checkTime = checkTimeDate.toTimeString().split(' ')[0]; // HH:MM:SS format
        }
  
        if (!checkTime) {
          throw new Error('Could not calculate check time');
        }
  
        // Update the panopto_checks table
        const { error: updateError } = await supabase
          .from('panopto_checks')
          .update({
            completed_time: new Date().toTimeString().split(' ')[0], // Current time
            completed_by_user_id: user?.id || null,
            status: 'completed', // Mark as completed
            updated_at: new Date().toISOString()
          })
          .eq('event_id', eventId!)
          .eq('check_time', checkTime)
          .is('completed_time', null); // Only update if not already completed
  
        if (updateError) {
          throw new Error(`Error updating check completion: ${updateError.message}`);
        }
  
        return { eventId: eventId!, checkNumber, checkTime };
      },
      onMutate: async ({ checkNumber }) => {
        // Cancel any outgoing refetches so they don't overwrite our optimistic update
        await queryClient.cancelQueries({ queryKey: ['panoptoChecks', eventId] });
  
        // Snapshot the previous value
        const previousChecks = queryClient.getQueryData(['panoptoChecks', eventId]);
  
        // Optimistically update the cache
        queryClient.setQueryData(['panoptoChecks', eventId], (old: any) => {
          if (!old) return old;
          
          return old.map((check: any) => {
            // Calculate the check time for this check number
            if (eventData?.start_time) {
              const eventStart = new Date(`${eventData.date}T${eventData.start_time}`);
              const checkTimeDate = new Date(eventStart.getTime() + (checkNumber - 1) * PANOPTO_CHECK_INTERVAL);
              const expectedCheckTime = checkTimeDate.toTimeString().split(' ')[0];
              
              // If this is the check being completed, update it optimistically
              if (check.check_time === expectedCheckTime) {
                return {
                  ...check,
                  completed_time: new Date().toTimeString().split(' ')[0],
                  completed_by_user_id: user?.id || null,
                  status: 'completed',
                  updated_at: new Date().toISOString(),
                  // Include profile data to prevent ID flashing
                  profiles: currentUserProfile ? {
                    id: currentUserProfile.id,
                    name: currentUserProfile.name
                  } : null
                };
              }
            }
            return check;
          });
        });
  
        // Return a context object with the snapshotted value
        return { previousChecks };
      },
      onError: (err, variables, context) => {
        // If the mutation fails, use the context returned from onMutate to roll back
        if (context?.previousChecks) {
          queryClient.setQueryData(['panoptoChecks', eventId], context.previousChecks);
        }
      },
      onSettled: () => {
        // Always refetch after error or success to ensure we have the latest data
        queryClient.invalidateQueries({ queryKey: ['panoptoChecks', eventId] });
        queryClient.invalidateQueries({ queryKey: ['allPanoptoChecks'] });
      }
    });
  
    return {
      ...mutation,
      eventData,
      eventLoading,
      eventError,
      // Helper function to complete a check
      completeCheck: (checkNumber: number) => {
        if (!eventId) {
          console.error('No event ID provided');
          return;
        }
        mutation.mutate({ checkNumber });
      }
    };
  };
  