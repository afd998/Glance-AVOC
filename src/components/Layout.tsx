import React, { ReactNode } from 'react';
import { useBackground } from '../hooks/useBackground';
import { useRain } from '../contexts/RainContext';
import RainOverlay from './RainOverlay';
import Footer from './Footer';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { currentBackground } = useBackground();
  const { isRainEnabled } = useRain();
  
  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Background image - moved here to prevent re-rendering during navigation */}
      <div 
        className="fixed inset-0 -z-10 bg-white dark:bg-gray-900"
        style={{
          backgroundImage: currentBackground ? `url('/${currentBackground}')` : 'none',
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          filter: currentBackground ? "blur(8px)" : "none",
          transform: "translateZ(0)"
        }}
        id="parallax-background"
      />
      
      {/* Rain Overlay */}
      <RainOverlay isEnabled={isRainEnabled} />
      
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;

