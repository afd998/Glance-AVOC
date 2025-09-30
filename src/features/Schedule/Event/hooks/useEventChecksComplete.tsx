import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { useEvent } from '../../../../core/event/hooks/useEvent';
import { usePanoptoChecksData } from '../../../../hooks/usePanoptoChecks';
import { isUserEventOwner } from '../../../../utils/eventUtils';
import { Database } from '../../../../types/supabase';

import { supabase } from '../../../../lib/supabase';
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';

const PANOPTO_CHECK_INTERVAL = 30 * 60 * 1000; // 30 minutes in milliseconds

// Hook to get panopto checks data for a specific event with realtime updates
// Hook to check if all checks are complete for a specific event
export const useEventChecksComplete = (eventId: number, startTime?: string, endTime?: string, date?: string) => {
  // Use the existing usePanoptoChecksData hook instead of direct Supabase calls
  const { data: checksData, isLoading, error } = usePanoptoChecksData(eventId);

  const isComplete = useMemo(() => {
    if (!eventId || !startTime || !endTime || !date || !checksData) {
      return false;
    }

    try {
      // Calculate expected number of checks
      const eventStart = new Date(`${date}T${startTime}`);
      const eventEnd = new Date(`${date}T${endTime}`);
      const eventDuration = eventEnd.getTime() - eventStart.getTime();
      const totalChecks = Math.floor(eventDuration / PANOPTO_CHECK_INTERVAL);

      if (totalChecks === 0) {
        return true;
      }

      // Count completed checks
      const completedCount = checksData.filter(check => check.completed_time !== null).length;
      return completedCount >= totalChecks;

    } catch (err) {
      console.error('Error checking completion status:', err);
      return false;
    }
  }, [eventId, startTime, endTime, date, checksData]);

  return { isComplete, isLoading, error };
};
