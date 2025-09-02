import React, { ReactNode } from 'react';
import { useBackground } from '../hooks/useBackground';
import { useRain } from '../contexts/RainContext';
import { useLocation } from 'react-router-dom';
import RainOverlay from './RainOverlay';
import LeavesOverlay from './LeavesOverlay';
import Footer from './Footer';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { currentBackground } = useBackground();
  const { isRainEnabled } = useRain();
  const location = useLocation();
  
  // Don't show footer on the landing page
  const showFooter = location.pathname !== '/auth';
  
  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Background image - moved here to prevent re-rendering during navigation */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage: currentBackground ? `url('/${currentBackground}')` : 'none',
          backgroundSize: "120% 120%",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center center",
          backgroundAttachment: "fixed",
          backgroundColor: "#000000",
          filter: currentBackground
            ? currentBackground === 'halloween.png'
              ? "blur(4px)"
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
      
      <main className="flex-1">
        {children}
      </main>
      {showFooter && <Footer />}
    </div>
  );
};

export default Layout;

