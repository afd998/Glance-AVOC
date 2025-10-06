import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { Database } from '../../../types/supabase';
import { type ResourceFlags, type ResourceItem  } from '../../../utils/eventUtils';
import { Monitor, CircleDot, Mic, FileText, Laptop, User, Smartphone } from 'lucide-react';
import { FaPoll } from "react-icons/fa";

type Event = Database['public']['Tables']['events']['Row'];

// Fetch a single event by ID
const fetchEvent = async (eventId: number): Promise<Event | null> => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();
      
    if (error) {
      console.error('Error fetching event:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in fetchEvent:', error);
    throw error;
  }
};

export function useEvent(eventId: number | null, date?: string) {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: ['event', eventId],
    queryFn: () => fetchEvent(eventId!),
    enabled: !!eventId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
    refetchOnMount: false,
    initialData: () => {
      if (!date) return undefined;
      const eventsCache = queryClient.getQueryData(['events', date]);
      return Array.isArray(eventsCache) ? eventsCache.find((event: Event) => event.id === eventId) : undefined;
    },
  });
}




// Hook to get cached parsed event resources with computed flags
export function useEventResources(eventId: number) {
  const { data: event, isLoading, error } = useEvent(eventId);

  return useQuery({
    queryKey: ['eventResources', eventId],
    queryFn: () => {
      // Don't make queries for invalid event IDs
      if (!eventId || eventId <= 0) {
        return { resources: [], hasVideoRecording: false, hasStaffAssistance: false, hasHandheldMic: false, hasWebConference: false, hasClickers: false, hasAVNotes: false, hasNeatBoard: false };
      }
      
      if (!event) {
        return { resources: [], hasVideoRecording: false, hasStaffAssistance: false, hasHandheldMic: false, hasWebConference: false, hasClickers: false, hasAVNotes: false, hasNeatBoard: false };
      }
      
      // Parse resources and compute flags in one go
      return parseEventResources(event);
    },
    enabled: !!eventId && eventId > 0 && !!event, // Only run when we have valid event ID and event data
    staleTime: Infinity, // Data never becomes stale - only invalidated on page refresh
    gcTime: Infinity, // Keep in cache indefinitely
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

 const parseEventResources = (event: Event): ResourceFlags => {
  const resources = (event.resources as ResourceItem[]) || [];

  // Add icon, displayName, and isAVResource properties to each resource item
  const resourcesWithIcons = resources.map(item => {
    const name = item.itemName?.toLowerCase() || '';
    const isAVResource = name.startsWith('ksm-kgh-video') || 
                        name.startsWith('ksm-kgh-av') || 
                        name.endsWith('staff-assistance');
    
    return {
      ...item,
      icon: getAVResourceAvatar(item.itemName),
      displayName: getResourceDisplayName(item.itemName),
      isAVResource
    };
  });

  // Single pass through resources to compute all flags
  let hasVideoRecording = false;
  let hasStaffAssistance = false;
  let hasHandheldMic = false;
  let hasWebConference = false;
  let hasClickers = false;
  let hasAVNotes = false;
  let hasNeatBoard = false;
  
  for (const item of resourcesWithIcons) {
    const displayName = item.displayName;
    if (!displayName) continue;
    
    if (displayName.includes('Recording')) hasVideoRecording = true;
    if (displayName === 'Staff Assistance') hasStaffAssistance = true;
    if (displayName === 'Handheld Microphone') hasHandheldMic = true;
    if (displayName === 'Web Conference') hasWebConference = true;
    if (displayName === 'Clickers (Polling)') hasClickers = true;
    if (displayName === 'AV Setup Notes') hasAVNotes = true;
    if (displayName === 'Neat Board') hasNeatBoard = true;
  }

  return {
    resources: resourcesWithIcons,
    // Computed boolean flags
    hasVideoRecording,
    hasStaffAssistance,
    hasHandheldMic,
    hasWebConference,
    hasClickers,
    hasAVNotes,
    hasNeatBoard,
  };
};



/**
 * Get specific avatar component for AV resources
 */
export const getAVResourceAvatar = (itemName: string): React.ReactElement => {
  const name = itemName?.toLowerCase() || '';

  // Special case for web conferencing - should use Zoom icon image
  if (name.includes('video-conferencing') || name.includes('web conference') || name.includes('zoom')) {
    return <img src="/zoomicon.png" alt="Zoom" className="size-4" />;
  }

  // Special case for Surface Hub - should use TV icon
  if (name.includes('surface hub') || name.includes('ksm-kgh-av-surface hub')) {
    return <Monitor className="size-4" strokeWidth={2.5} />;
  }

  // Video-related resources
  if (name.includes('video-recording') || name.includes('recording')) {
    return <img src="/icons8-record-50.png" alt="Recording" className="size-4" />;
  }

  // Audio-related resources
  if (name.includes('handheld') || name.includes('mic')) {
    return <span className="text-sm">🎤</span>;
  }
  // Audio-related resources
  if (name.includes('lapel') || name.includes('mic')) {
   return <img src="/lapel.png" alt="Lapel Mic" className="size-4" />;
 }
  // Notes/assistance
  if (name.includes('staff') || name.includes('assistance')) {
    return (
      <div className="flex items-center justify-center rounded-full bg-green-500/90 w-4 h-4">
        <span className="text-white text-xs">🚶</span>
      </div>
    );
  }
  if (name.includes('notes') || name.includes('kis')) {
    return <FileText className="size-4" />;
  }

  // Computer/laptop resources
  if (name.includes('laptop') || name.includes('computer')) {
    return <Laptop className="size-4" />;
  }
  if (name.includes('polling') || name.includes('computer')) {
    return <FaPoll className="size-4 text-pink-500" />;
  }

  return <Smartphone className="size-4" />; // Default icon
};

/**
 * Render resource icon component based on resource name
 */

/**
 * Get display name for a resource item (optimized version)
 */
const getResourceDisplayNameFast = (itemName: string, lowerName: string): string => {
  if (!itemName) return itemName;
  
  // Use faster string operations and avoid regex where possible
  if (lowerName.startsWith('laptop') || lowerName.startsWith('computer')) {
    return 'Laptop ' + itemName.substring(itemName.indexOf(' ') + 1);
  }
  if (lowerName.startsWith('camera') || lowerName.startsWith('doc cam')) {
    return 'Camera ' + itemName.substring(itemName.indexOf(' ') + 1);
  }
  if (lowerName.includes('zoom')) {
    return itemName.replace(/zoom/i, 'Zoom');
  }
  if (lowerName.endsWith('staff assistance')) {
    return 'Staff Assistance';
  }
  if (lowerName.endsWith('web conference')) {
    return 'Web Conference';
  }
  if (lowerName === 'ksm-kgh-video-conferencing') {
    return 'Web Conference';
  }
  if (lowerName.startsWith('ksm-kgh-video-recording')) {
    return 'Video Recording';
  }
  if (lowerName.endsWith('handheld microphone')) {
    return 'Handheld Microphone';
  }
  if (lowerName.includes('clickers') && lowerName.includes('polling')) {
    return 'Clickers (Polling)';
  }
  if (lowerName === 'ksm-kgh-av-kis notes') {
    return 'AV Setup Notes';
  }
  if (lowerName === 'ksm-kgh-av-surface hub') {
    return 'Neat Board';
  }
  
  return itemName;
};

/**
 * Get display name for a resource item (legacy version)
 */
 const getResourceDisplayName = (itemName: string): string => {
  const lowerName = itemName?.toLowerCase() || '';
  return getResourceDisplayNameFast(itemName, lowerName);
};
