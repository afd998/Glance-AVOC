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
    eventType === 'KSM: Student (KGH)' ||
    eventType === 'CMC' ||
    eventType === 'Ad Hoc Class Meeting'
  );

  // Determine if it's a merged room event
  const isMergedRoomEvent = event.room_name?.includes('&') || false;
  
  // TEMPORARY FIX: Force CMC events in 2410A or 2410B to be treated as merged room events
  const isCMCIn2410 = event.event_type === 'CMC' && 
    (event.room_name === 'GH 2410A' || event.room_name === 'GH 2410B' || 
     event.room_name?.includes('2410A') || event.room_name?.includes('2410B'));
  const finalIsMergedRoomEvent = isMergedRoomEvent || isCMCIn2410;
  
  // Debug logging for the temporary fix
  if (isCMCIn2410) {
    console.log('TEMPORARY FIX APPLIED: CMC event in 2410A/B forced to merged room event', {
      eventType: event.event_type,
      roomName: event.room_name,
      originalIsMergedRoomEvent: isMergedRoomEvent,
      finalIsMergedRoomEvent
    });
  }

  // Determine if it's a student or faculty/staff event
  const isStudentEvent = eventType.toLowerCase().includes('student');
  const isFacStaffEvent = !isStudentEvent;
  
  
  return {
    isStudentEvent,
    isFacStaffEvent,
    isLecture,
    isAdHocClassMeeting,
    isReducedHeightEvent,
    isMergedRoomEvent: finalIsMergedRoomEvent,
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
  const isStudentEvent = eventType.toLowerCase().includes('student');
  const isFacStaffEvent = !isStudentEvent;

  // Define theme colors using numerical scale (1 = lightest, 10 = darkest)
  if (eventType === 'KEC') {
    return {
      // Light backgrounds and surfaces - luxury golden cream
      1: 'bg-[#fffef7]',
      2: 'bg-[#fffcf0]',
      3: 'bg-[#fff8e1]',
      4: 'bg-[#fff3d4]',
      // Medium colors for cards and containers - warm gold
      5: 'bg-[#ffe0a6]',  // luxury golden base (matches card design)
      // Medium-dark for icons and badges - deeper gold
      6: 'bg-[#f4d03f]',  // rich golden yellow
      7: 'bg-[#e6b800]',  // deep executive gold
      // Dark colors for borders and accents - bronze tones
      8: 'bg-[#c89664]',
      9: 'bg-[#a67c52]',
      // Darkest for text - dark bronze
      10: 'bg-[#8b6914]',
      // Text colors
      text1: 'text-[#8b6914]',
      text2: 'text-[#a67c52]',
      text3: 'text-[#c89664]',
      text4: 'text-[#e6b800]',
      text5: 'text-[#f4d03f]',
      text6: 'text-[#ffe0a6]',
      text7: 'text-[#fff3d4]',
      text8: 'text-[#fff8e1]',
      text9: 'text-[#fffcf0]',
      text10: 'text-white',
      // Border colors
      border1: 'border-[#fff8e1]',
      border2: 'border-[#fff3d4]',
      border3: 'border-[#ffe0a6]',
      border4: 'border-[#f4d03f]',
      border5: 'border-[#e6b800]'
    };
  } else if (eventType === 'KSM: Kellogg FacStaff (KGH)') {
    // KSM: Kellogg FacStaff (KGH) - custom muted blue theme
    return {
      // Light backgrounds and surfaces
      1: 'bg-[#e8f0f8]',
      2: 'bg-[#d1e0f0]',
      3: 'bg-[#b8d0e8]',
      4: 'bg-[#9bbcd4]',
      // Medium colors for cards and containers
      5: 'bg-[#6d8fbf]',  // medium blue, balanced
      // Medium-dark for icons and badges
      6: 'bg-[#59739b]',  // medium-dark, softened depth
      7: 'bg-[#4f6683]',  // deep muted blue
      // Dark colors for borders and accents
      8: 'bg-[#455b6f]',
      9: 'bg-[#3a4f5c]',
      // Darkest for text
      10: 'bg-[#2f4349]',
      // Text colors
      text1: 'text-[#2f4349]',
      text2: 'text-[#3a4f5c]',
      text3: 'text-[#455b6f]',
      text4: 'text-[#4f6683]',
      text5: 'text-[#59739b]',
      text6: 'text-[#6d8fbf]',
      text7: 'text-[#9bbcd4]',
      text8: 'text-[#b8d0e8]',
      text9: 'text-[#d1e0f0]',
      text10: 'text-white',
      // Border colors
      border1: 'border-[#b8d0e8]',
      border2: 'border-[#9bbcd4]',
      border3: 'border-[#6d8fbf]',
      border4: 'border-[#59739b]',
      border5: 'border-[#4f6683]'
    };
  } else if (eventType === 'CMC') {
    return {
      // Light backgrounds and surfaces
      1: 'bg-[#f8e8e8]',
      2: 'bg-[#f0d4d4]',
      3: 'bg-[#e8b8b8]',
      4: 'bg-[#d49494]',
      // Medium colors for cards and containers
      5: 'bg-[#c26868]',  // muted mid red
      // Medium-dark for icons and badges
      6: 'bg-[#a54f4f]',  // medium-dark, balanced warmth
      7: 'bg-[#7e3d3d]',
      // Dark colors for borders and accents
      8: 'bg-[#5a2a2a]',
      9: 'bg-[#3d1f1f]',
      // Darkest for text
      10: 'bg-[#1a0d0d]',
      // Text colors
      text1: 'text-[#1a0d0d]',
      text2: 'text-[#3d1f1f]',
      text3: 'text-[#5a2a2a]',
      text4: 'text-[#7e3d3d]',
      text5: 'text-[#a54f4f]',
      text6: 'text-[#c26868]',
      text7: 'text-[#d49494]',
      text8: 'text-[#e8b8b8]',
      text9: 'text-[#f0d4d4]',
      text10: 'text-white',
      // Border colors
      border1: 'border-[#e8b8b8]',
      border2: 'border-[#d49494]',
      border3: 'border-[#c26868]',
      border4: 'border-[#a54f4f]',
      border5: 'border-[#7e3d3d]'
    };
  } else if (isLecture) {
    return {
      // Light backgrounds and surfaces
      1: 'bg-[#f0e6ff]',
      2: 'bg-[#d4c2ff]',
      3: 'bg-[#b19cd9]',
      // Medium colors for cards and containers
      4: 'bg-[#8d7dad]',
      5: 'bg-[#866dbf]',
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
  } else if (isAdHocClassMeeting) {
    // Ad Hoc Class Meeting - using KEC gray theme
    return {
      // Light backgrounds and surfaces
      1: 'bg-[#f2f2f5]',
      2: 'bg-[#e6e6eb]',
      3: 'bg-[#d4d4da]',
      4: 'bg-[#c0c0c8]',
      // Medium colors for cards and containers
      5: 'bg-[#9a9aab]',  // medium gray with slight softness
      // Medium-dark for icons and badges
      6: 'bg-[#777788]',  // medium-dark, muted depth
      7: 'bg-[#666678]',
      // Dark colors for borders and accents
      8: 'bg-[#525260]',
      9: 'bg-[#3d3d46]',
      // Darkest for text
      10: 'bg-[#29292f]',
      // Text colors
      text1: 'text-[#29292f]',
      text2: 'text-[#3d3d46]',
      text3: 'text-[#525260]',
      text4: 'text-[#666678]',
      text5: 'text-[#777788]',
      text6: 'text-[#9a9aab]',
      text7: 'text-[#c0c0c8]',
      text8: 'text-[#d4d4da]',
      text9: 'text-[#e6e6eb]',
      text10: 'text-white',
      // Border colors
      border1: 'border-[#d4d4da]',
      border2: 'border-[#c0c0c8]',
      border3: 'border-[#9a9aab]',
      border4: 'border-[#777788]',
      border5: 'border-[#666678]'
    };
  } else if (isStudentEvent) {
    return {
      // Light backgrounds and surfaces
      1: 'bg-[#f0f9f0]',
      2: 'bg-[#dcf4dc]',
      3: 'bg-[#bbf0bb]',
      4: 'bg-[#9ae69a]',
      // Medium colors for cards and containers
      5: 'bg-[#6dd86d]',  // medium green, vibrant but not harsh
      // Medium-dark for icons and badges
      6: 'bg-[#4ade80]',  // medium-dark green, good depth
      7: 'bg-[#22c55e]',  // deeper green, grounding
      // Dark colors for borders and accents
      8: 'bg-[#16a34a]',
      9: 'bg-[#15803d]',
      // Darkest for text
      10: 'bg-[#14532d]',
      // Text colors
      text1: 'text-[#14532d]',
      text2: 'text-[#15803d]',
      text3: 'text-[#16a34a]',
      text4: 'text-[#22c55e]',
      text5: 'text-[#4ade80]',
      text6: 'text-[#6dd86d]',
      text7: 'text-[#9ae69a]',
      text8: 'text-[#bbf0bb]',
      text9: 'text-[#dcf4dc]',
      text10: 'text-white',
      // Border colors
      border1: 'border-[#bbf0bb]',
      border2: 'border-[#9ae69a]',
      border3: 'border-[#6dd86d]',
      border4: 'border-[#4ade80]',
      border5: 'border-[#22c55e]'
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
 * Get gradient class based on event type
 */
export const getEventGradientClass = (eventType: string): string => {
  switch (eventType) {
    case 'Lecture':
      return 'lecture-gradient';
    case 'Ad Hoc Class Meeting':
      return 'ad-hoc-solid';
    case 'KEC':
      return 'kec-gradient';
    case 'KSM: Kellogg FacStaff (KGH)':
      return 'ksm-facstaff-solid';
    case 'CMC':
      return 'cmc-solid';
    default:
      // Check if it's a student event
      if (eventType.toLowerCase().includes('student')) {
        return 'student-event-solid';
      }
      // Check if it's a faculty/staff event (but not KSM FacStaff which is handled above)
      if (!eventType.toLowerCase().includes('student') && eventType !== 'KSM: Kellogg FacStaff (KGH)') {
        return 'facstaff-event-solid';
      }
      // Default fallback
      return 'default-event-solid';
  }
};

/**
 * Extract hex color from Tailwind class and create dynamic blinking animation
 */
export const getOriginalColorFromTailwindClass = (bgColor: string): string => {
  // Extract hex color from Tailwind class like 'bg-[#6d8fbf]' or 'bg-slate-400'
  let originalColor = 'rgb(59 130 246)'; // Default blue fallback
  
  if (bgColor.includes('bg-[') && bgColor.includes(']')) {
    // Extract hex color from bg-[#hex] format
    const hexMatch = bgColor.match(/bg-\[#([a-fA-F0-9]{6})\]/);
    if (hexMatch) {
      const hex = hexMatch[1];
      // Convert hex to RGB
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      originalColor = `rgb(${r} ${g} ${b})`;
    }
  } else if (bgColor.includes('bg-slate-')) {
    // Handle slate colors
    const slateMap: { [key: string]: string } = {
      'bg-slate-50': 'rgb(248 250 252)',
      'bg-slate-100': 'rgb(241 245 249)',
      'bg-slate-200': 'rgb(226 232 240)',
      'bg-slate-300': 'rgb(203 213 225)',
      'bg-slate-400': 'rgb(148 163 184)',
      'bg-slate-500': 'rgb(100 116 139)',
      'bg-slate-600': 'rgb(71 85 105)',
      'bg-slate-700': 'rgb(51 65 85)',
      'bg-slate-800': 'rgb(30 41 59)',
      'bg-slate-900': 'rgb(15 23 42)',
    };
    originalColor = slateMap[bgColor] || 'rgb(148 163 184)';
  } else if (bgColor.includes('bg-gray-')) {
    // Handle gray colors
    const grayMap: { [key: string]: string } = {
      'bg-gray-50': 'rgb(249 250 251)',
      'bg-gray-100': 'rgb(243 244 246)',
      'bg-gray-200': 'rgb(229 231 235)',
      'bg-gray-300': 'rgb(209 213 219)',
      'bg-gray-400': 'rgb(156 163 175)',
      'bg-gray-500': 'rgb(107 114 128)',
      'bg-gray-600': 'rgb(75 85 99)',
      'bg-gray-700': 'rgb(55 65 81)',
      'bg-gray-800': 'rgb(31 41 55)',
      'bg-gray-900': 'rgb(17 24 39)',
    };
    originalColor = grayMap[bgColor] || 'rgb(156 163 175)';
  }
  
  return originalColor;
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