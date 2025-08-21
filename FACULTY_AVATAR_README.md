# Faculty Avatar System

This system provides head isolation effects for faculty headshots with hover overflow animations.

## Features

- **CSS-Based Head Isolation**: Uses advanced CSS `clip-path` to isolate head area from background
- **Hover Overflow Effect**: On hover, the head can overflow the circular border while the background stays contained
- **AI Background Removal (Optional)**: Can use `@imgly/background-removal` but disabled by default due to CORS issues
- **Performance Optimized**: Lightweight CSS solution with optional AI processing cache
- **Configurable**: Easy to switch between AI and simple modes

## Configuration

Edit `src/config/avatarConfig.ts` to customize behavior:

```typescript
export const AVATAR_CONFIG = {
  // Set to true to enable AI background removal (may fail due to CORS with external images)
  USE_AI_BACKGROUND_REMOVAL: false,
  
  // Animation settings
  HOVER_SCALE: 1.25,
  TRANSITION_DURATION: '300ms',
  
  // Head isolation settings for simple mode
  HEAD_CIRCLE_SIZE: '40%',
  
  // Performance settings
  ENABLE_IMAGE_CACHING: true,
  MAX_CACHE_SIZE: 50
};
```

## Components

### FacultyAvatar
Main component with AI background removal capabilities:
```tsx
<FacultyAvatar
  imageUrl={facultyMember.kelloggdirectory_image_url}
  instructorName={event.instructor_name}
  isHovering={isHovering}
  size="md" // 'sm' | 'md' | 'lg'
/>
```

### SimpleFacultyAvatar
Fallback component using CSS-based head isolation:
```tsx
<SimpleFacultyAvatar
  imageUrl={imageUrl}
  instructorName={instructorName}
  isHovering={isHovering}
  size="md"
/>
```

## How It Works

1. **Simple Mode (Default)**: 
   - Uses CSS `clip-path: circle()` to isolate head area
   - Creates layered effect with background contained and head overflowing on hover
   - Focuses on face area with `circle(42% at 50% 45%)` 
   - No AI processing required, works with any image

2. **AI Mode (Optional)**:
   - Downloads faculty headshot
   - Uses ML model to remove background (may fail due to CORS)
   - Caches processed image if successful
   - Falls back to Simple Mode if processing fails

## Performance Considerations

- **Simple Mode**: Instant, no processing required ✅ RECOMMENDED
- **AI Mode**: ⚠️ **VERY SLOW** - can take 2-5 minutes per image!
  - Downloads ~50MB AI model on first use
  - Heavy CPU processing that can freeze the browser
  - Limited to 1 concurrent processing to prevent crashes
  - 30-second timeout to prevent infinite processing
- Processed images are cached for instant subsequent loads
- Graceful degradation to Simple Mode if AI fails

### **Why AI Mode is Slow:**
1. **Model Download**: 50MB+ AI models downloaded on first use
2. **CPU Intensive**: Background removal blocks the main thread
3. **CORS Proxy**: Extra network latency for external images
4. **Browser Limitations**: Client-side ML is inherently slow

## CORS Issues

The AI background removal may fail with external images due to CORS restrictions. Faculty images from `kellogg.northwestern.edu` cannot be processed client-side due to their CORS policy. The system automatically falls back to the CSS-based solution.

## Troubleshooting

If the hover effect isn't working:
1. Check that images are loading properly
2. Verify CSS transitions are enabled
3. Try adjusting `HEAD_CIRCLE_SIZE` in config
4. For AI mode, check console for CORS errors

## Bundle Size Impact

- **Simple mode**: No additional bundle size
- **AI mode**: `@imgly/background-removal` ~50MB (downloaded on-demand, may not work due to CORS)
