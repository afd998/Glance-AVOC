// Avatar configuration
export const AVATAR_CONFIG = {
  // Animation settings
  HOVER_SCALE: 1.25,
  TRANSITION_DURATION: '300ms',
  
  // Head isolation settings for CSS fallback mode
  HEAD_CIRCLE_SIZE: '40%', // Percentage of image to show as "head" in CSS mode
  
  // Overflow masking settings
  HIDE_BOTTOM_HALF: true, // Hide bottom half of image on overflow (shoulders/body)
  TOP_VISIBLE_PERCENTAGE: 60, // Percentage of image height that can be visible when overflowing
} as const;
