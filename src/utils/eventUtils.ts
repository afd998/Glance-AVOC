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
  isAdHocClassMeeting: boolean;
  isReducedHeightEvent: boolean;
  isMergedRoomEvent: boolean;
  bgColor: string;
  contentBgColor: string;
  truncatedEventName: string;
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
  const isAdHocClassMeeting = eventType === 'Ad Hoc Class Meeting';

  // Determine if it's a reduced height event
  const isReducedHeightEvent = (
    eventType === 'KSM: Kellogg Special Events (KGH)' ||
    eventType === 'KSM: Kellogg FacStaff (KGH)' ||
    eventType === 'KEC' ||
    eventType === 'Ad Hoc Class Meeting'
  );

  // Determine if it's a merged room event
  const isMergedRoomEvent = event.room_name?.includes('&') || false;

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
    bgColor = "bg-[#33bbff]"; // KSM blue based on #1bacf5
    contentBgColor = "bg-[#00aaff]"; // Slightly darker blue for content
  } else if (isLecture) {
    bgColor = "noise-bg"; // Check lectures FIRST - Keep lecture events with the purple noise background
    contentBgColor = "bg-[#5a4a7a]"; // Slightly darker purple for content
  } else if (isStudentEvent) {
    bgColor = "bg-[#b8a68a]";
    contentBgColor = "bg-[#ad9b80]"; // Slightly darker beige for content
  } else if (isAdHocClassMeeting) {
    bgColor = "bg-[#9b8ba5]"; // Custom purple based on #70538a
    contentBgColor = "bg-[#8c7c94]"; // Slightly darker purple for content
  } else if (isFacStaffEvent) {
    bgColor = "bg-[#9b8ba5]";
    contentBgColor = "bg-[#8f7f99]"; // Slightly darker purple for content
  }
  
  return {
    isStudentEvent,
    isFacStaffEvent,
    isLecture,
    isAdHocClassMeeting,
    isReducedHeightEvent,
    isMergedRoomEvent,
    bgColor,
    contentBgColor,
    truncatedEventName: truncateEventName(event)
  };
};

/**
 * Extract hex color from Tailwind bg class
 */
const extractHexFromBgClass = (bgClass: string): string => {
  // Extract hex color from classes like 'bg-[#f0e8f5]' or 'bg-gray-50'
  const hexMatch = bgClass.match(/bg-\[#([a-fA-F0-9]{6})\]/);
  if (hexMatch) return `#${hexMatch[1]}`;

  // Handle standard Tailwind colors
  const colorMap: { [key: string]: string } = {
    'bg-white': '#ffffff',
    'bg-gray-50': '#f9fafb',
    'bg-gray-100': '#f3f4f6',
    'bg-gray-200': '#e5e7eb',
    'bg-gray-300': '#d1d5db',
    'bg-gray-400': '#9ca3af',
    'bg-gray-500': '#6b7280',
    'bg-gray-600': '#4b5563',
    'bg-gray-700': '#374151',
    'bg-gray-800': '#1f2937',
    'bg-gray-900': '#111827',
    'bg-red-50': '#fef2f2',
    'bg-red-100': '#fee2e2',
    'bg-red-200': '#fecaca',
    'bg-red-300': '#fca5a5',
    'bg-red-400': '#f87171',
    'bg-red-500': '#ef4444',
    'bg-red-600': '#dc2626',
    'bg-red-700': '#b91c1c',
    'bg-red-800': '#991b1b',
    'bg-red-900': '#7f1d1d',
    'bg-amber-50': '#fffbeb',
    'bg-amber-100': '#fef3c7',
    'bg-amber-200': '#fde68a',
    'bg-amber-300': '#fcd34d',
    'bg-amber-400': '#fbbf24',
    'bg-amber-500': '#f59e0b',
    'bg-amber-600': '#d97706',
    'bg-amber-700': '#b45309',
    'bg-amber-800': '#92400e',
    'bg-amber-900': '#78350f',
    'bg-slate-50': '#f8fafc',
    'bg-slate-100': '#f1f5f9',
    'bg-slate-200': '#e2e8f0',
    'bg-slate-300': '#cbd5e1',
    'bg-slate-400': '#94a3b8',
    'bg-slate-500': '#64748b',
    'bg-slate-600': '#475569',
    'bg-slate-700': '#334155',
    'bg-slate-800': '#1e293b',
    'bg-slate-900': '#0f172a'
  };

  return colorMap[bgClass] || '#ffffff'; // Default to white if not found
};

/**
 * Generate theme colors as hex values for inline styles
 */
export const getEventThemeHexColors = (event: Event) => {
  const themeColors = getEventThemeColors(event);

  return {
    // Convert Tailwind classes to hex colors
    1: extractHexFromBgClass(themeColors[1]),
    2: extractHexFromBgClass(themeColors[2]),
    3: extractHexFromBgClass(themeColors[3]),
    4: extractHexFromBgClass(themeColors[4]),
    5: extractHexFromBgClass(themeColors[5]),
    6: extractHexFromBgClass(themeColors[6]),
    7: extractHexFromBgClass(themeColors[7]),
    8: extractHexFromBgClass(themeColors[8]),
    9: extractHexFromBgClass(themeColors[9]),
    10: extractHexFromBgClass(themeColors[10]),
    // Keep text and border colors as Tailwind classes for className usage
    text1: themeColors.text1,
    text2: themeColors.text2,
    text3: themeColors.text3,
    text4: themeColors.text4,
    text5: themeColors.text5,
    text6: themeColors.text6,
    text7: themeColors.text7,
    text8: themeColors.text8,
    text9: themeColors.text9,
    text10: themeColors.text10,
    border1: themeColors.border1,
    border2: themeColors.border2,
    border3: themeColors.border3,
    border4: themeColors.border4,
    border5: themeColors.border5
  };
};

/**
 * Generate theme colors based on event type
 */
export const getEventThemeColors = (event: Event) => {
  const eventType = event.event_type || '';
  const eventName = event.event_name || '';

  const isLecture = eventType === 'Lecture';
  const isAdHocClassMeeting = eventType === 'Ad Hoc Class Meeting';
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
    // KSM: Kellogg FacStaff (KGH) - custom theme based on #1bacf5
    return {
      // Light backgrounds and surfaces
      1: 'bg-[#e6f7ff]',
      2: 'bg-[#cceeff]',
      3: 'bg-[#99ddff]',
      // Medium colors for cards and containers
      4: 'bg-[#66ccff]',
      5: 'bg-[#33bbff]',
      // Medium-dark for icons and badges
      6: 'bg-[#00aaff]',
      7: 'bg-[#0099e6]',
      // Dark colors for borders and accents
      8: 'bg-[#0088cc]',
      9: 'bg-[#0077b3]',
      // Darkest for text
      10: 'bg-[#1bacf5]',
      // Text colors
      text1: 'text-[#1bacf5]',
      text2: 'text-[#0077b3]',
      text3: 'text-[#0088cc]',
      text4: 'text-[#0099e6]',
      text5: 'text-[#00aaff]',
      text6: 'text-[#33bbff]',
      text7: 'text-[#66ccff]',
      text8: 'text-[#99ddff]',
      text9: 'text-[#cceeff]',
      text10: 'text-white',
      // Border colors
      border1: 'border-[#99ddff]',
      border2: 'border-[#66ccff]',
      border3: 'border-[#33bbff]',
      border4: 'border-[#00aaff]',
      border5: 'border-[#0099e6]'
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
  } else if (isAdHocClassMeeting) {
    // Ad Hoc Class Meeting - custom theme based on #70538a
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
      10: 'bg-[#70538a]',
      // Text colors
      text1: 'text-[#70538a]',
      text2: 'text-[#6e5f72]',
      text3: 'text-[#7d6d83]',
      text4: 'text-[#8c7c94]',
      text5: 'text-[#9b8ba5]',
      text6: 'text-[#aa9bb1]',
      text7: 'text-[#b9abbd]',
      text8: 'text-[#c8bad9]',
      text9: 'text-[#d4c2dc]',
      text10: 'text-white',
      // Border colors
      border1: 'border-[#d4c2dc]',
      border2: 'border-[#b9abbd]',
      border3: 'border-[#9b8ba5]',
      border4: 'border-[#8c7c94]',
      border5: 'border-[#7d6d83]'
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

/**
 * Truncate event name based on event type
 * Only truncates for Lecture, Exam, and Lab events
 * Returns full name for other event types
 */
export function truncateEventName(event: Event): string {
  const eventName = event.event_name ? String(event.event_name) : '';
  const eventType = event.event_type || '';

  // Only truncate for specific event types
  if (eventType === 'Lecture' || eventType === 'Exam' || eventType === 'Lab') {
    const dashIndex = eventName.indexOf('-');
    return dashIndex !== -1 ? eventName.substring(0, dashIndex) : eventName;
  }

  // Return full name for all other event types (including Default)
  return eventName;
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