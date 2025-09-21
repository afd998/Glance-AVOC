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
}

interface EdgeHighlight {
  top: boolean;
  bottom: boolean;
  left: boolean;
  right: boolean;
}

interface DragStart {
  x: number;
  y: number;
  scrollLeft: number;
  scrollTop: number;
}

const THROTTLE_INTERVAL = 16; // ~60fps
const EDGE_HIGHLIGHT_THROTTLE = 50; // Update edge highlights less frequently

const DraggableGridContainer = forwardRef<HTMLDivElement, DraggableGridContainerProps>(({
  children,
  className = '',
  style = {},
  startHour,
  endHour,
  pixelsPerMinute,
  actualRowCount,
  isDragEnabled,
  onScrollPositionChange
}, ref) => {
  const gridContainerRef = useRef<HTMLDivElement>(null);
  
  // Expose the ref to parent components
  useImperativeHandle(ref, () => gridContainerRef.current!, []);
  
  const containerRef = gridContainerRef;
  
  // Drag-to-scroll functionality
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<DragStart>({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
  const [edgeHighlight, setEdgeHighlight] = useState<EdgeHighlight>({ 
    top: false, 
    bottom: false, 
    left: false, 
    right: false 
  });
  
  // Throttling for performance
  const lastThrottledMove = useRef(0);
  const lastEdgeHighlightUpdate = useRef(0);

  // Helper function to clamp scroll values within boundaries
  const clampScrollPosition = useCallback((scrollLeft: number, scrollTop: number) => {
    if (!containerRef.current) return { scrollLeft, scrollTop };
    
    const container = containerRef.current;
    const { clientWidth, clientHeight } = container;
    
    // Calculate the actual content dimensions
    const actualContentWidth = (endHour - startHour) * 60 * pixelsPerMinute;
    const actualContentHeight = (actualRowCount * 96) + 32; // 32px for TimeGrid
    
    // Calculate maximum scroll positions
    const maxScrollLeft = Math.max(0, actualContentWidth - clientWidth);
    const maxScrollTop = Math.max(0, actualContentHeight - clientHeight);
    
    // Clamp the values
    return {
      scrollLeft: Math.max(0, Math.min(scrollLeft, maxScrollLeft)),
      scrollTop: Math.max(0, Math.min(scrollTop, maxScrollTop))
    };
  }, [endHour, startHour, pixelsPerMinute, actualRowCount]);

  // Function to check and update edge highlighting
  const updateEdgeHighlight = useCallback(() => {
    if (!containerRef.current || !isDragging) return;
    
    const currentTime = Date.now();
    
    // Throttle edge highlight updates for better performance
    if (currentTime - lastEdgeHighlightUpdate.current < EDGE_HIGHLIGHT_THROTTLE) {
      return;
    }
    lastEdgeHighlightUpdate.current = currentTime;
    
    const container = containerRef.current;
    const { scrollLeft, scrollTop, clientWidth, clientHeight } = container;
    
    // Calculate the actual content dimensions
    const actualContentWidth = (endHour - startHour) * 60 * pixelsPerMinute;
    const actualContentHeight = (actualRowCount * 96) + 32; // 32px for TimeGrid
    
    // Add tolerance for edge detection
    const tolerance = 20;
    const maxScrollLeft = Math.max(0, actualContentWidth - clientWidth);
    const maxScrollTop = Math.max(0, actualContentHeight - clientHeight);
    
    // Edge detection
    const newEdgeHighlight = {
      top: scrollTop <= tolerance,
      bottom: scrollTop >= maxScrollTop - tolerance,
      left: scrollLeft <= tolerance,
      right: scrollLeft >= maxScrollLeft - tolerance
    };
    
    // Check if we hit any edge
    const hitAnyEdge = newEdgeHighlight.top || newEdgeHighlight.bottom || newEdgeHighlight.left || newEdgeHighlight.right;
    
    if (hitAnyEdge) {
      setEdgeHighlight(newEdgeHighlight);
    } else {
      // Clear highlights immediately when not hitting any edge
      setEdgeHighlight({ top: false, bottom: false, left: false, right: false });
    }
  }, [isDragging, endHour, startHour, pixelsPerMinute, actualRowCount]);

  // Drag-to-scroll handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    
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
    
    // Prevent default text selection behavior
    e.preventDefault();
  }, []);

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
    
    // Update edge highlighting after scroll (throttled)
    updateEdgeHighlight();
    
    // Notify parent of scroll position change
    if (onScrollPositionChange) {
      onScrollPositionChange({
        left: clampedPosition.scrollLeft,
        top: clampedPosition.scrollTop
      });
    }
  }, [isDragging, dragStart, clampScrollPosition, updateEdgeHighlight, onScrollPositionChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    if (containerRef.current) {
      containerRef.current.style.cursor = isDragEnabled ? 'grab' : 'default';
      // Restore text selection
      containerRef.current.style.userSelect = '';
    }
    // Restore text selection on document body
    document.body.style.userSelect = '';
    // Clear edge highlights immediately when dragging stops
    setEdgeHighlight({ top: false, bottom: false, left: false, right: false });
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
    // Clear edge highlights immediately when dragging stops
    setEdgeHighlight({ top: false, bottom: false, left: false, right: false });
  }, [isDragEnabled]);

  // Touch support for mobile devices
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!containerRef.current) return;
    
    const target = e.target as HTMLElement;
    if (target.closest('[data-event]') || target.closest('[data-room-label]')) {
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
    
    e.preventDefault();
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();
    
    const currentTime = Date.now();
    
    // Throttle updates for better performance
    if (currentTime - lastThrottledMove.current < THROTTLE_INTERVAL) {
      return;
    }
    lastThrottledMove.current = currentTime;
    
    const touch = e.touches[0];
    const x = touch.pageX - containerRef.current.offsetLeft;
    const y = touch.pageY - containerRef.current.offsetTop;
    
    const walkX = (x - dragStart.x) * 2;
    const walkY = (y - dragStart.y) * 2;
    const newScrollLeft = dragStart.scrollLeft - walkX;
    const newScrollTop = dragStart.scrollTop - walkY;
    
    // Clamp scroll position to prevent overscrolling
    const clampedPosition = clampScrollPosition(newScrollLeft, newScrollTop);
    containerRef.current.scrollLeft = clampedPosition.scrollLeft;
    containerRef.current.scrollTop = clampedPosition.scrollTop;
    
    // Update edge highlighting after scroll (throttled)
    updateEdgeHighlight();
    
    // Notify parent of scroll position change
    if (onScrollPositionChange) {
      onScrollPositionChange({
        left: clampedPosition.scrollLeft,
        top: clampedPosition.scrollTop
      });
    }
  }, [isDragging, dragStart, clampScrollPosition, updateEdgeHighlight, onScrollPositionChange]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    // Clear edge highlights immediately when dragging stops
    setEdgeHighlight({ top: false, bottom: false, left: false, right: false });
  }, []);

  // Cleanup effect to restore text selection if component unmounts while dragging
  useEffect(() => {
    return () => {
      // Restore text selection on cleanup
      document.body.style.userSelect = '';
    };
  }, []);

  return (
    <div className="relative">
      {/* Edge highlighting overlays - positioned outside the scrollable container */}
      {edgeHighlight.top && (
        <div className="absolute -top-20 -left-20 -right-20 h-20 z-[100] pointer-events-none edge-highlight"
             style={{
               boxShadow: '0 0 30px rgba(255, 255, 255, 0.8), 0 0 60px rgba(255, 255, 255, 0.4)',
               background: 'rgba(255, 255, 255, 0.1)'
             }} />
      )}
      {edgeHighlight.bottom && (
        <div className="absolute -bottom-20 -left-20 -right-20 h-20 z-[100] pointer-events-none edge-highlight"
             style={{
               boxShadow: '0 0 30px rgba(255, 255, 255, 0.8), 0 0 60px rgba(255, 255, 255, 0.4)',
               background: 'rgba(255, 255, 255, 0.1)'
             }} />
      )}
      {edgeHighlight.left && (
        <div className="absolute -top-4 -left-20 -bottom-4 w-20 z-[100] pointer-events-none edge-highlight"
             style={{
               boxShadow: '0 0 30px rgba(255, 255, 255, 0.8), 0 0 60px rgba(255, 255, 255, 0.4)',
               background: 'rgba(255, 255, 255, 0.1)'
             }} />
      )}
      {edgeHighlight.right && (
        <div className="absolute -top-4 -right-20 -bottom-4 w-20 z-[100] pointer-events-none edge-highlight"
             style={{
               boxShadow: '0 0 30px rgba(255, 255, 255, 0.8), 0 0 60px rgba(255, 255, 255, 0.4)',
               background: 'rgba(255, 255, 255, 0.1)'
             }} />
      )}
      
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
      >
        {children}
      </div>
    </div>
  );
});

DraggableGridContainer.displayName = 'DraggableGridContainer';

export default DraggableGridContainer;
