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
  
  // MASTER KILL SWITCH - Set to false to completely disable ALL weather effects for GPU testing
  const ENABLE_ALL_WEATHER_EFFECTS = false;
  
  // Toggle for AVOC HOME text overlay
  const showAvocHomeText = false; // Set to true to enable the giant AVOC HOME text
  
  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Background image - moved here to prevent re-rendering during navigation */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage: currentBackground && currentBackground !== 'offwhite' ? `url('/${currentBackground}')` : 'none',
          backgroundSize: currentBackground === 'jaobscenter.jpeg' ? "cover" : currentBackground === 'offwhite' ? "auto" : "120% 120%",
          backgroundRepeat: currentBackground === 'offwhite' ? "repeat" : "no-repeat",
          backgroundPosition: "center center",
          backgroundAttachment: "fixed",
          backgroundColor: "#000000",
          filter: currentBackground
            ? currentBackground === 'halloween.png'
              ? "blur(4px)"
              : currentBackground === 'jaobscenter.jpeg'
              ? "none"
              : currentBackground === 'offwhite'
              ? "none"
              : "blur(8px)"
            : "none",
          transform: "translateZ(0)"
        }}
        id="parallax-background"
      />
      
      {/* Center Light Effect */}
      <div
        className="fixed inset-0 -z-5 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, rgba(255, 255, 255, 1.0) 0%, rgba(255, 255, 250, 0.9) 20%, rgba(255, 250, 240, 0.7) 40%, rgba(255, 240, 220, 0.5) 60%, transparent 80%)',
          mixBlendMode: 'screen'
        }}
      />
      
      {/* Rain Overlay */}
      {ENABLE_ALL_WEATHER_EFFECTS && <RainOverlay isEnabled={isRainEnabled} />}

      {/* Leaves Overlay */}
      {ENABLE_ALL_WEATHER_EFFECTS && <LeavesOverlay />}
      
      {/* Snow Overlay */}
      {ENABLE_ALL_WEATHER_EFFECTS && <SnowOverlay isEnabled={isSnowEnabled} />}
      
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

