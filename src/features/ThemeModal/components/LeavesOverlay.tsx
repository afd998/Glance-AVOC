import React, { useEffect, useRef } from 'react';
import { useBackground } from '../useBackground';
import { useLeaves } from '../../../contexts/LeavesContext';

interface LeavesOverlayProps {
  isEnabled?: boolean;
}

const LeavesOverlay: React.FC<LeavesOverlayProps> = ({
  isEnabled = true
}) => {
  const { currentBackground } = useBackground();
  const { isLeavesEnabled } = useLeaves();

  // Only show leaves when Halloween background is selected and leaves are enabled
  const shouldShowLeaves = isEnabled && isLeavesEnabled && currentBackground === 'halloween.png';

  const leavesContainerRef = useRef<HTMLDivElement>(null);

  const makeLeavesFall = () => {
    if (!leavesContainerRef.current) return;

    // Clear out everything
    leavesContainerRef.current.innerHTML = '';

    // Create the leaves container with the proper ID
    const leavesDiv = document.createElement('div');
    leavesDiv.id = 'leaves';

    // Create 30 leaves using <i> elements as specified in the CSS
    for (let i = 0; i < 30; i++) {
      const leaf = document.createElement('i');
      
      // Randomize starting positions across the entire top of the screen
      const startX = Math.random() * window.innerWidth;
      const startY = -50 - Math.random() * 100; // Start above viewport
      
      leaf.style.left = startX + 'px';
      leaf.style.top = startY + 'px';
      
      leavesDiv.appendChild(leaf);
    }

    leavesContainerRef.current.appendChild(leavesDiv);
  };

  useEffect(() => {
    if (shouldShowLeaves) {
      makeLeavesFall();
    }
  }, [shouldShowLeaves]);

  if (!shouldShowLeaves) return null;

  return (
    <div
      id="leaves-container"
      ref={leavesContainerRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 9999 }}
    ></div>
  );
};

export default LeavesOverlay;
