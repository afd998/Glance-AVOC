import React, { ReactNode } from 'react';
import { useBackground } from '../hooks/useBackground';
import { useRain } from '../contexts/RainContext';
import { useSnow } from '../contexts/SnowContext';
import { useLocation } from 'react-router-dom';
import RainOverlay from './RainOverlay';
import LeavesOverlay from './LeavesOverlay';
import SnowOverlay from './SnowOverlay';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { currentBackground } = useBackground();
  const { isRainEnabled } = useRain();
  const { isSnowEnabled } = useSnow();
  
  // Toggle for AVOC HOME text overlay
  const showAvocHomeText = false; // Set to true to enable the giant AVOC HOME text
  
  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Background image - moved here to prevent re-rendering during navigation */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage: currentBackground ? `url('/${currentBackground}')` : 'none',
          backgroundSize: currentBackground === 'jaobscenter.jpeg' ? "cover" : "120% 120%",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center center",
          backgroundAttachment: "fixed",
          backgroundColor: "#ffffff",
          filter: currentBackground
            ? currentBackground === 'halloween.png'
              ? "blur(4px)"
              : currentBackground === 'jaobscenter.jpeg'
              ? "none"
              : "blur(8px)"
            : "none",
          transform: "translateZ(0)"
        }}
        id="parallax-background"
      />
      
      {/* Rain Overlay */}
      <RainOverlay isEnabled={isRainEnabled} />

      {/* Leaves Overlay */}
      <LeavesOverlay />
      
      {/* Snow Overlay */}
      <SnowOverlay isEnabled={isSnowEnabled} />
      
      {/* AVOC HOME Text Overlay */}
      {showAvocHomeText && (
        <div className="fixed inset-0 -z-5 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-[20rem] sm:text-[25rem] md:text-[30rem] lg:text-[35rem] xl:text-[40rem] font-black text-white/20 select-none" 
                 style={{ 
                   fontFamily: 'BebasNeue, sans-serif',
                   textShadow: '0 0 20px rgba(0,0,0,0.3), 0 0 40px rgba(0,0,0,0.2)',
                   lineHeight: '0.8',
                   letterSpacing: '0.2em',
                   fontWeight: '900'
                 }}>
              <div>AVOC</div>
              <div>HOME</div>
            </div>
          </div>
        </div>
      )}
      
      <main className="flex-1 min-h-screen">
        {children}
      </main>
    </div>
  );
};

export default Layout;

