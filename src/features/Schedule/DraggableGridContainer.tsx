import React, { useState, useRef, useCallback, useEffect, ReactNode, forwardRef, useImperativeHandle } from 'react';

interface DraggableGridContainerProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  startHour: number;
  endHour: number;
  pixelsPerMinute: number;
  actualRowCount: number;
  isDragEnabled: boolean;
  onScrollPositionChange?: (position: { left: number; top: number }) => void;
  rowHeightPx?: number;
  pageZoom?: number;
}


interface DragStart {
  x: number;
  y: number;
  scrollLeft: number;
  scrollTop: number;
};

const THROTTLE_INTERVAL = 16; // ~60fps

const DraggableGridContainer = forwardRef<HTMLDivElement, DraggableGridContainerProps>(({
  children,
  className = '',
  style = {},
  startHour,
  endHour,
  pixelsPerMinute,
  actualRowCount,
  isDragEnabled,
  onScrollPositionChange,
  rowHeightPx = 96,
  pageZoom
}, ref) => {
  const gridContainerRef = useRef<HTMLDivElement>(null);
  
  // Expose the ref to parent components
  useImperativeHandle(ref, () => gridContainerRef.current!, []);
  
  const containerRef = gridContainerRef;
  
  // Drag-to-scroll functionality
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<DragStart>({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
  
  // Throttling for performance
  const lastThrottledMove = useRef(0);

  // Helper function to clamp scroll values within boundaries
  const clampScrollPosition = useCallback((scrollLeft: number, scrollTop: number) => {
    if (!containerRef.current) return { scrollLeft, scrollTop };
    
    const container = containerRef.current;
    const { clientWidth, clientHeight } = container;
    
    // Calculate the actual content dimensions (header is rendered outside scaled content)
    const scaleFactor = pageZoom || 1;
    const actualContentWidth = ((endHour - startHour) * 60 * pixelsPerMinute) * scaleFactor;
    const actualContentHeight = ((actualRowCount * rowHeightPx)) * scaleFactor +0;
    
    
    // Calculate maximum scroll positions with iOS-specific adjustments
    // iOS Safari sometimes reports incorrect clientWidth/Height, so we add a small buffer
    const iosBuffer = 2; // Small buffer for iOS Safari viewport issues
    const scrollBuffer = 8; // Additional buffer to ensure all content is accessible
    const maxScrollLeft = Math.max(0, actualContentWidth - clientWidth + iosBuffer);
    const maxScrollTop = Math.max(0, actualContentHeight - clientHeight + iosBuffer + scrollBuffer);
    
    // Clamp the values; avoid negative overscroll for stable overlays
    return {
      scrollLeft: Math.max(0, Math.min(scrollLeft, maxScrollLeft)),
      scrollTop: Math.max(0, Math.min(scrollTop, maxScrollTop)) 
    };
  }, [endHour, startHour, pixelsPerMinute, actualRowCount, rowHeightPx, pageZoom]);


  // Drag-to-scroll handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current || !isDragEnabled) return;
    
    // Only start dragging if clicking on the background (not on events)
    const target = e.target as HTMLElement;
    if (target.closest('[data-event]') || target.closest('[data-room-label]')) {
      return; // Don't drag if clicking on events or room labels
    }
    
    setIsDragging(true);
    const x = e.pageX - containerRef.current.offsetLeft;
    const y = e.pageY - containerRef.current.offsetTop;
    setDragStart({
      x,
      y,
      scrollLeft: containerRef.current.scrollLeft,
      scrollTop: containerRef.current.scrollTop
    });
    
    if (containerRef.current) {
      containerRef.current.style.cursor = 'grabbing';
      // Prevent text selection during drag
      containerRef.current.style.userSelect = 'none';
      // Also prevent text selection on the document body
      document.body.style.userSelect = 'none';
    }
    
    // Only prevent default when we're actually starting a drag
    e.preventDefault();
  }, [isDragEnabled]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();
    
    const currentTime = Date.now();
    
    // Throttle updates for better performance
    if (currentTime - lastThrottledMove.current < THROTTLE_INTERVAL) {
      return;
    }
    lastThrottledMove.current = currentTime;
    
    const x = e.pageX - containerRef.current.offsetLeft;
    const y = e.pageY - containerRef.current.offsetTop;
    
    const walkX = (x - dragStart.x) * 2; // Multiply by 2 for faster scrolling
    const walkY = (y - dragStart.y) * 2; // Multiply by 2 for faster scrolling
    const newScrollLeft = dragStart.scrollLeft - walkX;
    const newScrollTop = dragStart.scrollTop - walkY;
    
    // Clamp scroll position to prevent overscrolling
    const clampedPosition = clampScrollPosition(newScrollLeft, newScrollTop);
    containerRef.current.scrollLeft = clampedPosition.scrollLeft;
    containerRef.current.scrollTop = clampedPosition.scrollTop;
    
    
    // Notify parent of scroll position change
    if (onScrollPositionChange) {
      onScrollPositionChange({
        left: clampedPosition.scrollLeft,
        top: clampedPosition.scrollTop
      });
    }
  }, [isDragging, dragStart, clampScrollPosition, onScrollPositionChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    if (containerRef.current) {
      containerRef.current.style.cursor = isDragEnabled ? 'grab' : 'default';
      // Restore text selection
      containerRef.current.style.userSelect = '';
    }
    // Restore text selection on document body
    document.body.style.userSelect = '';
  }, [isDragEnabled]);

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
    if (containerRef.current) {
      containerRef.current.style.cursor = isDragEnabled ? 'grab' : 'default';
      // Restore text selection
      containerRef.current.style.userSelect = '';
    }
    // Restore text selection on document body
    document.body.style.userSelect = '';
  }, [isDragEnabled]);

  // Handle wheel events for normal scrolling
  const handleWheel = useCallback((e: WheelEvent) => {
    if (!containerRef.current) return;
    // If holding Shift or Ctrl, allow higher-level handlers (zoom/ppm) to take over
    if ((e as WheelEvent).shiftKey || (e as WheelEvent).ctrlKey) {
      return;
    }
    
    // Allow normal wheel scrolling
    e.preventDefault();
    
    const container = containerRef.current;
    const { scrollLeft, scrollTop } = container;
    
    // Calculate new scroll position
    const newScrollLeft = scrollLeft + e.deltaX;
    const newScrollTop = scrollTop + e.deltaY;
    
    // Clamp scroll position
    const clampedPosition = clampScrollPosition(newScrollLeft, newScrollTop);
    container.scrollLeft = clampedPosition.scrollLeft;
    container.scrollTop = clampedPosition.scrollTop;
    
    // Notify parent of scroll position change
    if (onScrollPositionChange) {
      onScrollPositionChange({
        left: clampedPosition.scrollLeft,
        top: clampedPosition.scrollTop
      });
    }
  }, [clampScrollPosition, onScrollPositionChange]);

  // Touch support for mobile devices
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!containerRef.current) return;
    
    const target = e.target as HTMLElement;
    if (target.closest('[data-event]') || target.closest('[data-room-label]')) {
      return;
    }
    
    // Check if this is a single touch (not multi-touch)
    if (e.touches.length !== 1) {
      return;
    }
    
    setIsDragging(true);
    const touch = e.touches[0];
    setDragStart({
      x: touch.pageX - containerRef.current.offsetLeft,
      y: touch.pageY - containerRef.current.offsetTop,
      scrollLeft: containerRef.current.scrollLeft,
      scrollTop: containerRef.current.scrollTop
    });
    
    // Add momentum scrolling class for iOS
    if (containerRef.current) {
      containerRef.current.classList.add('momentum-scrolling');
    }
    
    e.preventDefault();
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    // Only prevent default if we have a single touch
    if (e.touches.length === 1) {
      e.preventDefault();
    }
    
    const currentTime = Date.now();
    
    // Throttle updates for better performance
    if (currentTime - lastThrottledMove.current < THROTTLE_INTERVAL) {
      return;
    }
    lastThrottledMove.current = currentTime;
    
    const touch = e.touches[0];
    const x = touch.pageX - containerRef.current.offsetLeft;
    const y = touch.pageY - containerRef.current.offsetTop;
    
    // Reduce sensitivity for touch to prevent jittery scrolling
    const walkX = (x - dragStart.x) * 1.5;
    const walkY = (y - dragStart.y) * 1.5;
    const newScrollLeft = dragStart.scrollLeft - walkX;
    const newScrollTop = dragStart.scrollTop - walkY;
    
    // Clamp scroll position to prevent overscrolling
    const clampedPosition = clampScrollPosition(newScrollLeft, newScrollTop);
    containerRef.current.scrollLeft = clampedPosition.scrollLeft;
    containerRef.current.scrollTop = clampedPosition.scrollTop;
    
    
    // Notify parent of scroll position change
    if (onScrollPositionChange) {
      onScrollPositionChange({
        left: clampedPosition.scrollLeft,
        top: clampedPosition.scrollTop
      });
    }
  }, [isDragging, dragStart, clampScrollPosition, onScrollPositionChange]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    
    // Remove momentum scrolling class after a delay to allow for momentum
    if (containerRef.current) {
      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.classList.remove('momentum-scrolling');
        }
      }, 100);
    }
    
  }, []);

  const handleTouchCancel = useCallback(() => {
    setIsDragging(false);
    
    // Remove momentum scrolling class immediately on cancel
    if (containerRef.current) {
      containerRef.current.classList.remove('momentum-scrolling');
    }
    
  }, []);

  // Cleanup effect to restore text selection if component unmounts while dragging
  useEffect(() => {
    return () => {
      // Restore text selection on cleanup
      document.body.style.userSelect = '';
    };
  }, []);

  // Add wheel event listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);

  return (
    <div className="relative ">
      
      {/* The actual scrollable container */}
      <div 
        ref={containerRef} 
        className={`${className} ${isDragging ? 'dragging' : ''}`}
        style={{ 
          cursor: isDragEnabled ? 'grab' : 'default',
          ...style
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
      >
        {children}
      </div>
    </div>
  );
});

DraggableGridContainer.displayName = 'DraggableGridContainer';

export default DraggableGridContainer;
