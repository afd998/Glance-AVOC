import React from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';

type Event = Database['public']['Tables']['events']['Row'];

interface ResourceItem {
  itemName: string;
  [key: string]: any;
}

interface ResourceFlags {
  resources: ResourceItem[];
}

interface EventTypeInfo {
  isStudentEvent: boolean;
  isFacStaffEvent: boolean;
  isLecture: boolean;
  bgColor: string;
  contentBgColor: string;
}

interface EventPosition {
  startMinutes: number;
  endMinutes: number;
  durationMinutes: number;
  left: string;
  width: string;
}

/**
 * Parse event resources and return both boolean flags and full resource list
 * @param event - The event object with resources stored in event.resources
 * @returns Object containing boolean flags and resource list
 */
export const parseEventResources = (event: Event): ResourceFlags => {
  // Check if event has resources in the new JSONB format
  if (!event.resources || !Array.isArray(event.resources)) {
    return {
      resources: []
    };
  }

  const resources = event.resources as ResourceItem[];

  // Add icon and displayName properties to each resource item
  const resourcesWithIcons = resources.map(item => ({
    ...item,
    icon: getResourceIcon(item.itemName),
    displayName: getResourceDisplayName(item.itemName)
  }));

  return {
    resources: resourcesWithIcons
  };
};

/**
 * Get icon for a resource item
 */
export const getResourceIcon = (itemName: string): string => {
  const name = itemName?.toLowerCase() || '';

  if (name.includes('laptop') || name.includes('computer')) return '💻';
  if (name.includes('camera') || name.includes('doc cam')) return '📷';
  if (name.includes('zoom') || name.includes('video')) return '📹';
  if (name.includes('panel') || name.includes('control')) return '🎛️';
  if (name.includes('audio') || name.includes('microphone')) return '🎤';
  if (name.includes('display') || name.includes('monitor')) return '🖥️';
  if (name.includes('ksm-kgh-av-kis notes') || name.includes('notes')) return '📝';

  return '📱'; // Default icon
};

/**
 * Get specific icon for AV resources (similar to EventHeader style)
 */
export const getAVResourceIcon = (itemName: string): string => {
  const name = itemName?.toLowerCase() || '';

  // Special case for web conferencing - should use Zoom icon image
  if (name.includes('video-conferencing') || name.includes('web conference') || name.includes('zoom')) {
    return 'ZOOM_ICON'; // Special marker for zoom icon image
  }

  // Video-related resources
  if (name.includes('video-recording') || name.includes('recording')) return '🔴';
  if (name.includes('camera') || name.includes('doc cam')) return '📷';

  // Audio-related resources
  if (name.includes('microphone') || name.includes('mic')) return '🎤';
  if (name.includes('audio')) return '🔊';

  // Control/display resources
  if (name.includes('panel') || name.includes('control')) return '🎛️';
  if (name.includes('display') || name.includes('monitor')) return '🖥️';

  // Notes/assistance
  if (name.includes('staff') || name.includes('assistance')) return '🚶';
  if (name.includes('notes') || name.includes('kis')) return '📝';

  // Computer/laptop resources
  if (name.includes('laptop') || name.includes('computer')) return '💻';

  return '📱'; // Default icon
};

/**
 * Check if a resource should use the Zoom icon image instead of emoji
 */
export const shouldUseZoomIcon = (itemName: string): boolean => {
  const name = itemName?.toLowerCase() || '';
  return name.includes('video-conferencing') || name.includes('web conference') || name.includes('zoom');
};

/**
 * Get display name for a resource item
 */
export const getResourceDisplayName = (itemName: string): string => {
  // Clean up common patterns
  return itemName
    ?.replace(/^(laptop|computer)\s*-?\s*/i, 'Laptop ')
    ?.replace(/^(camera|doc cam)\s*-?\s*/i, 'Camera ')
    ?.replace(/zoom/i, 'Zoom')
    ?.replace(/^.*staff assistance$/i, 'Staff Assistance')
    ?.replace(/^.*web conference$/i, 'Web Conference')
    ?.replace(/^ksm-kgh-video-conferencing$/i, 'Web Conference')
    ?.replace(/^ksm-kgh-video-recording.*$/i, 'Video Recording')
    ?.replace(/^.*handheld microphone$/i, 'Handheld Microphone')
    ?.replace(/^.*clickers.*polling.*$/i, 'Clickers (Polling)')
    ?.replace(/^ksm-kgh-av-kis notes$/i, 'AV Setup Notes')
    || itemName;
};

/**
 * Determine event type information including colors
 */
export const getEventTypeInfo = (event: Event): EventTypeInfo => {
  const eventType = event.event_type || '';
  const eventName = event.event_name || '';
  
  const isLecture = eventType === 'Lecture';
  
  // Determine if it's a student or faculty/staff event
  const isStudentEvent = eventName.toLowerCase().includes('student');
  const isFacStaffEvent = !isStudentEvent;
  
  // Determine background color
  let bgColor = "bg-gray-400"; // Default light gray color for non-lecture events
  let contentBgColor = "bg-gray-500"; // Slightly darker version for content sections
  
  if (eventType === 'KEC') {
    bgColor = "bg-gray-400"; // KEC events get medium gray background
    contentBgColor = "bg-[#8a91a0]"; // Custom slightly darker version of #9da4b0
  } else if (eventType === 'CMC') {
    bgColor = "bg-red-300"; // CMC events get pastel red background
    contentBgColor = "bg-red-400"; // Slightly darker red for content
  } else if (eventType === 'KSM: Kellogg FacStaff (KGH)') {
    bgColor = "bg-[#9b8ba5]"; // KSM purple
    contentBgColor = "bg-[#8f7f99]"; // Slightly darker purple for content
  } else if (isLecture) {
    bgColor = "noise-bg"; // Check lectures FIRST - Keep lecture events with the purple noise background
    contentBgColor = "bg-[#5a4a7a]"; // Slightly darker purple for content
  } else if (isStudentEvent) {
    bgColor = "bg-[#b8a68a]";
    contentBgColor = "bg-[#ad9b80]"; // Slightly darker beige for content
  } else if (isFacStaffEvent) {
    bgColor = "bg-[#9b8ba5]";
    contentBgColor = "bg-[#8f7f99]"; // Slightly darker purple for content
  }
  
  return {
    isStudentEvent,
    isFacStaffEvent,
    isLecture,
    bgColor,
    contentBgColor
  };
};

/**
 * Generate theme colors based on event type
 */
export const getEventThemeColors = (event: Event) => {
  const eventType = event.event_type || '';
  const eventName = event.event_name || '';

  const isLecture = eventType === 'Lecture';
  const isStudentEvent = eventName.toLowerCase().includes('student');
  const isFacStaffEvent = !isStudentEvent;

  // Define theme colors using numerical scale (1 = lightest, 10 = darkest)
  if (eventType === 'KEC') {
    return {
      // Light backgrounds and surfaces
      1: 'bg-white dark:bg-gray-900',
      2: 'bg-gray-50 dark:bg-gray-800',
      3: 'bg-gray-100 dark:bg-gray-700',
      // Medium colors for cards and containers
      4: 'bg-gray-200 dark:bg-gray-600',
      5: 'bg-gray-300 dark:bg-gray-500',
      // Medium-dark for icons and badges
      6: 'bg-gray-400 dark:bg-gray-400',
      7: 'bg-gray-500 dark:bg-gray-300',
      // Dark colors for borders and accents
      8: 'bg-gray-600 dark:bg-gray-200',
      9: 'bg-gray-700 dark:bg-gray-100',
      // Darkest for text
      10: 'bg-gray-800 dark:bg-white',
      // Text colors
      text1: 'text-gray-100',
      text2: 'text-gray-200',
      text3: 'text-gray-300',
      text4: 'text-gray-400',
      text5: 'text-gray-500',
      text6: 'text-gray-600',
      text7: 'text-gray-700',
      text8: 'text-gray-800',
      text9: 'text-gray-900',
      text10: 'text-black dark:text-white',
      // Border colors
      border1: 'border-gray-200',
      border2: 'border-gray-300',
      border3: 'border-gray-400',
      border4: 'border-gray-500',
      border5: 'border-gray-600'
    };
  } else if (eventType === 'KSM: Kellogg FacStaff (KGH)') {
    return {
      // Light backgrounds and surfaces
      1: 'bg-[#f0e8f5]',
      2: 'bg-[#e8d8ed]',
      3: 'bg-[#d4c2dc]',
      // Medium colors for cards and containers
      4: 'bg-[#b9abbd]',
      5: 'bg-[#9b8ba5]',
      // Medium-dark for icons and badges
      6: 'bg-[#8c7c94]',
      7: 'bg-[#7d6d83]',
      // Dark colors for borders and accents
      8: 'bg-[#6e5f72]',
      9: 'bg-[#5f5061]',
      // Darkest for text
      10: 'bg-[#504250]',
      // Text colors
      text1: 'text-[#504250]',
      text2: 'text-[#5f5061]',
      text3: 'text-[#6e5f72]',
      text4: 'text-[#7d6d83]',
      text5: 'text-[#8c7c94]',
      text6: 'text-[#9b8ba5]',
      text7: 'text-[#aa9bb1]',
      text8: 'text-[#b9abbd]',
      text9: 'text-[#c8bad9]',
      text10: 'text-white',
      // Border colors
      border1: 'border-[#d4c2dc]',
      border2: 'border-[#b9abbd]',
      border3: 'border-[#9b8ba5]',
      border4: 'border-[#8c7c94]',
      border5: 'border-[#7d6d83]'
    };
  } else if (eventType === 'CMC') {
    return {
      // Light backgrounds and surfaces
      1: 'bg-red-50',
      2: 'bg-red-100',
      3: 'bg-red-200',
      // Medium colors for cards and containers
      4: 'bg-red-300',
      5: 'bg-red-400',
      // Medium-dark for icons and badges
      6: 'bg-red-500',
      7: 'bg-red-600',
      // Dark colors for borders and accents
      8: 'bg-red-700',
      9: 'bg-red-800',
      // Darkest for text
      10: 'bg-red-900',
      // Text colors
      text1: 'text-red-100',
      text2: 'text-red-200',
      text3: 'text-red-300',
      text4: 'text-red-400',
      text5: 'text-red-500',
      text6: 'text-red-600',
      text7: 'text-red-700',
      text8: 'text-red-800',
      text9: 'text-red-900',
      text10: 'text-white',
      // Border colors
      border1: 'border-red-200',
      border2: 'border-red-300',
      border3: 'border-red-400',
      border4: 'border-red-500',
      border5: 'border-red-600'
    };
  } else if (isLecture) {
    return {
      // Light backgrounds and surfaces
      1: 'bg-[#f0e6ff]',
      2: 'bg-[#d4c2ff]',
      3: 'bg-[#b19cd9]',
      // Medium colors for cards and containers
      4: 'bg-[#8d7dad]',
      5: 'bg-[#7c6ca1]',
      // Medium-dark for icons and badges
      6: 'bg-[#6b5b8f]',
      7: 'bg-[#605283]',
      // Dark colors for borders and accents
      8: 'bg-[#4a3e60]',
      9: 'bg-[#3e3250]',
      // Darkest for text
      10: 'bg-[#332640]',
      // Text colors
      text1: 'text-[#332640]',
      text2: 'text-[#3e3250]',
      text3: 'text-[#4a3e60]',
      text4: 'text-[#605283]',
      text5: 'text-[#6b5b8f]',
      text6: 'text-[#7c6ca1]',
      text7: 'text-[#8d7dad]',
      text8: 'text-[#9e8eb9]',
      text9: 'text-[#af9fc5]',
      text10: 'text-white',
      // Border colors
      border1: 'border-[#b19cd9]',
      border2: 'border-[#8d7dad]',
      border3: 'border-[#7c6ca1]',
      border4: 'border-[#6b5b8f]',
      border5: 'border-[#605283]'
    };
  } else if (isStudentEvent) {
    return {
      // Light backgrounds and surfaces
      1: 'bg-amber-50',
      2: 'bg-amber-100',
      3: 'bg-amber-200',
      // Medium colors for cards and containers
      4: 'bg-amber-300',
      5: 'bg-amber-400',
      // Medium-dark for icons and badges
      6: 'bg-amber-500',
      7: 'bg-amber-600',
      // Dark colors for borders and accents
      8: 'bg-amber-700',
      9: 'bg-amber-800',
      // Darkest for text
      10: 'bg-amber-900',
      // Text colors
      text1: 'text-amber-100',
      text2: 'text-amber-200',
      text3: 'text-amber-300',
      text4: 'text-amber-400',
      text5: 'text-amber-500',
      text6: 'text-amber-600',
      text7: 'text-amber-700',
      text8: 'text-amber-800',
      text9: 'text-amber-900',
      text10: 'text-white',
      // Border colors
      border1: 'border-amber-200',
      border2: 'border-amber-300',
      border3: 'border-amber-400',
      border4: 'border-amber-500',
      border5: 'border-amber-600'
    };
  } else if (isFacStaffEvent) {
    return {
      // Light backgrounds and surfaces
      1: 'bg-slate-50',
      2: 'bg-slate-100',
      3: 'bg-slate-200',
      // Medium colors for cards and containers
      4: 'bg-slate-300',
      5: 'bg-slate-400',
      // Medium-dark for icons and badges
      6: 'bg-slate-500',
      7: 'bg-slate-600',
      // Dark colors for borders and accents
      8: 'bg-slate-700',
      9: 'bg-slate-800',
      // Darkest for text
      10: 'bg-slate-900',
      // Text colors
      text1: 'text-slate-100',
      text2: 'text-slate-200',
      text3: 'text-slate-300',
      text4: 'text-slate-400',
      text5: 'text-slate-500',
      text6: 'text-slate-600',
      text7: 'text-slate-700',
      text8: 'text-slate-800',
      text9: 'text-slate-900',
      text10: 'text-white',
      // Border colors
      border1: 'border-slate-200',
      border2: 'border-slate-300',
      border3: 'border-slate-400',
      border4: 'border-slate-500',
      border5: 'border-slate-600'
    };
  } else {
    // Default gray theme
    return {
      // Light backgrounds and surfaces
      1: 'bg-gray-50',
      2: 'bg-gray-100',
      3: 'bg-gray-200',
      // Medium colors for cards and containers
      4: 'bg-gray-300',
      5: 'bg-gray-400',
      // Medium-dark for icons and badges
      6: 'bg-gray-500',
      7: 'bg-gray-600',
      // Dark colors for borders and accents
      8: 'bg-gray-700',
      9: 'bg-gray-800',
      // Darkest for text
      10: 'bg-gray-900',
      // Text colors
      text1: 'text-gray-100',
      text2: 'text-gray-200',
      text3: 'text-gray-300',
      text4: 'text-gray-400',
      text5: 'text-gray-500',
      text6: 'text-gray-600',
      text7: 'text-gray-700',
      text8: 'text-gray-800',
      text9: 'text-gray-900',
      text10: 'text-white',
      // Border colors
      border1: 'border-gray-200',
      border2: 'border-gray-300',
      border3: 'border-gray-400',
      border4: 'border-gray-500',
      border5: 'border-gray-600'
    };
  }
};

/**
 * Calculate event position on the timeline
 */
export const calculateEventPosition = (
  event: Event,
  startMinutes: number,
  pixelsPerMinute: number,
  roomLabelWidth: number,
  eventMargin: number = 1
): EventPosition => {
  if (!event.start_time || !event.end_time) {
    return {
      startMinutes: 0,
      endMinutes: 0,
      durationMinutes: 0,
      left: '0px',
      width: '0px'
    };
  }

  // Parse start and end times (now in HH:MM:SS format)
  const [startHour, startMin] = event.start_time.split(':').map(Number);
  const [endHour, endMin] = event.end_time.split(':').map(Number);
  
  const eventStartMinutes = startHour * 60 + startMin;
  const eventEndMinutes = endHour * 60 + endMin;
  const durationMinutes = eventEndMinutes - eventStartMinutes;
  
  // Calculate position relative to timeline start
  const startMinutesRelative = eventStartMinutes - startMinutes;
  const endMinutesRelative = eventEndMinutes - startMinutes;
  
  // Ensure minimum width for very short events
  const calculatedWidth = Math.max(durationMinutes * pixelsPerMinute - eventMargin * 2, 30); // Minimum 30px width
  
  return {
    startMinutes: startMinutesRelative,
    endMinutes: endMinutesRelative,
    durationMinutes,
    left: `${(startMinutesRelative * pixelsPerMinute + eventMargin) - roomLabelWidth}px`,
    width: `${calculatedWidth}px`
  };
}; 

type ShiftBlock = Database['public']['Tables']['shift_blocks']['Row'];
type Shift = Database['public']['Tables']['shifts']['Row'];

// Updated to use date instead of week_start
export async function getAllShiftBlocksForDate(date: string) {
  const { data, error } = await supabase
    .from('shift_blocks')
    .select('*')
    .eq('date', date);

  if (error) throw error;
  return data || [];
}

// Updated to use date instead of day_of_week
export function sortShiftsByTime(shifts: Shift[]): Shift[] {
  // Sort by date and then by start_time to ensure consistent chronological order
  return shifts.sort((a, b) => {
    // First sort by date
    if (a.date !== b.date) {
      return (a.date ?? '').localeCompare(b.date ?? '');
    }
    
    // Then sort by start_time
    if (!a.start_time || !b.start_time) return 0;
    return a.start_time.localeCompare(b.start_time);
  });
} 

// Check if a user is an owner of an event
export function isUserEventOwner(
  event: any,
  userId: string,
  shiftBlocks: any[] = []
): boolean {
  // Check if user is the manual owner
  if (event.man_owner === userId) {
    return true;
  }

  // For KEC events, there are no calculated owners, so only check manual ownership
  if (event.event_type === "KEC") {
    return false;
  }

  // Check if user is a calculated owner from shift blocks
  if (!event.date || !event.start_time || !event.end_time || !event.room_name) {
    return false;
  }

  const eventDate = event.date;
  const eventStartTime = event.start_time;
  const eventEndTime = event.end_time;
  const eventRoom = event.room_name;

  // Find shift blocks that overlap with the event
  const relevantBlocks = shiftBlocks.filter((block: any) => {
    if (!block.date || !block.start_time || !block.end_time) return false;
    
    // Check if block is for the same date
    if (block.date !== eventDate) return false;
    
    // Check if block overlaps with event time
    const blockStart = block.start_time;
    const blockEnd = block.end_time;
    
    // Event overlaps with block
    const overlaps = (eventStartTime >= blockStart && eventStartTime < blockEnd) ||
           (eventEndTime > blockStart && eventEndTime <= blockEnd) ||
           (eventStartTime <= blockStart && eventEndTime >= blockEnd);
    
    return overlaps;
  });

  // Check if user is assigned to the event's room in any of the relevant blocks
  for (const block of relevantBlocks) {
    if (!block.assignments) continue;
    
    if (Array.isArray(block.assignments)) {
      for (const assignment of block.assignments) {
        if (assignment && assignment.rooms && Array.isArray(assignment.rooms)) {
          if (assignment.rooms.includes(eventRoom) && assignment.user === userId) {
            return true;
          }
        }
      }
    }
  }

  return false;
} 