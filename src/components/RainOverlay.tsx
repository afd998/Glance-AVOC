import React, { useEffect, useRef } from 'react';
import { useBackground } from '../hooks/useBackground';

interface RainOverlayProps {
  isEnabled?: boolean;
}

const RainOverlay: React.FC<RainOverlayProps> = ({
  isEnabled = true
}) => {
  const { currentBackground } = useBackground();

  // Only show rain when dusk background is selected
  const shouldShowRain = isEnabled && currentBackground === 'dusk.jpg';
  const frontRowRef = useRef<HTMLDivElement>(null);
  const backRowRef = useRef<HTMLDivElement>(null);

    const makeItRain = () => {
    if (!frontRowRef.current || !backRowRef.current) return;

    // Clear out everything
    frontRowRef.current.innerHTML = '';
    backRowRef.current.innerHTML = '';

    let increment = 0;
    let drops = '';
    let backDrops = '';

    while (increment < 100) {
      // Couple random numbers to use for various randomizations
      // Random number between 98 and 1
      const randoHundo = Math.floor(Math.random() * (98 - 1 + 1) + 1);
      // Random number between 5 and 2
      const randoFiver = Math.floor(Math.random() * (5 - 2 + 1) + 2);
      // Increment
      increment += randoFiver;

      // Add in a new raindrop with various randomizations to certain CSS properties
      drops += `<div class="drop" style="left: ${increment}%; bottom: ${randoFiver + randoFiver - 1 + 100}%; animation-delay: 0.${randoHundo}s; animation-duration: 0.5${randoHundo}s;"><div class="stem" style="animation-delay: 0.${randoHundo}s; animation-duration: 0.5${randoHundo}s;"></div></div>`;
      backDrops += `<div class="drop" style="right: ${increment}%; bottom: ${randoFiver + randoFiver - 1 + 100}%; animation-delay: 0.${randoHundo}s; animation-duration: 0.5${randoHundo}s;"><div class="stem" style="animation-delay: 0.${randoHundo}s; animation-duration: 0.5${randoHundo}s;"></div></div>`;
    }

    frontRowRef.current.innerHTML = drops;
    backRowRef.current.innerHTML = backDrops;
  };

  useEffect(() => {
    if (shouldShowRain) {
      makeItRain();
    }
  }, [shouldShowRain]);

  if (!shouldShowRain) return null;

  return (
    <>
      <div
        className="rain front-row"
        ref={frontRowRef}
      ></div>
      <div
        className="rain back-row show-back-row"
        ref={backRowRef}
      ></div>
    </>
  );
};

export default RainOverlay;
