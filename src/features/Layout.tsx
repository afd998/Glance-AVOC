import React, { ReactNode, useEffect } from 'react';
import { useBackground } from './ThemeModal/useBackground';
import { useRain } from '../contexts/RainContext';
import { useSnow } from '../contexts/SnowContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { useHeader } from '../contexts/HeaderContext';
import RainOverlay from './ThemeModal/components/RainOverlay';
import LeavesOverlay from './ThemeModal/components/LeavesOverlay';
import SnowOverlay from './ThemeModal/components/SnowOverlay';
import { AppSidebar } from '../components/app-sidebar';
import { SidebarInset, SidebarTrigger } from '../components/ui/sidebar';
import { NotificationBell } from './notifications/NotificationBell';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { currentBackground } = useBackground();
  const { isRainEnabled } = useRain();
  const { isSnowEnabled } = useSnow();
  const location = useLocation();
  const navigate = useNavigate();
  const { headerContent } = useHeader();
  // Extract date from pathname (format: /YYYY-MM-DD)
  const dateMatch = location.pathname.match(/^\/(\d{4}-\d{2}-\d{2})/);
  const date = dateMatch ? dateMatch[1] : null;
  
  // Get page title based on current route
  const getPageTitle = () => {
    if (location.pathname === '/faculty') {
      return 'Faculty List';
    }
    return '';
  };

  // Format the selected date for display
  const formatSelectedDate = (): string => {
    if (!date) return '';
    
    const [year, month, day] = date.split('-').map(Number);
    const selectedDate = new Date(year, month - 1, day);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    };
    return selectedDate.toLocaleDateString('en-US', options);
  };

  // Navigate to previous day
  const goToPreviousDay = () => {
    if (date) {
      const [year, month, day] = date.split('-').map(Number);
      const currentDate = new Date(year, month - 1, day);
      currentDate.setDate(currentDate.getDate() - 1);
      const newDate = currentDate.toISOString().split('T')[0];
      navigate(`/${newDate}`);
    }
  };

  // Navigate to next day
  const goToNextDay = () => {
    if (date) {
      const [year, month, day] = date.split('-').map(Number);
      const currentDate = new Date(year, month - 1, day);
      currentDate.setDate(currentDate.getDate() + 1);
      const newDate = currentDate.toISOString().split('T')[0];
      navigate(`/${newDate}`);
    }
  };
  
  // Debug: Log the current background
  console.log('Layout - currentBackground:', currentBackground);
  
  // Debug: Log route and header info
  console.log('Layout Debug:', {
    pathname: location.pathname,
    headerContent: !!headerContent,
    getPageTitle: getPageTitle()
  });
  
  // Debug: Test if image loads
  useEffect(() => {
    if (currentBackground && currentBackground !== 'offwhite') {
      const img = new Image();
      img.onload = () => console.log('Background image loaded successfully:', currentBackground);
      img.onerror = () => console.error('Background image failed to load:', currentBackground);
      img.src = `/${currentBackground}`;
    }
  }, [currentBackground]);
  
  // MASTER KILL SWITCH - Set to false to completely disable ALL weather effects for GPU testing
  const ENABLE_ALL_WEATHER_EFFECTS = false;
  
  // Toggle for AVOC HOME text overlay
  const showAvocHomeText = false; // Set to true to enable the giant AVOC HOME text
  
  return (
    <div className="min-h-screen w-full flex relative" style={{ zIndex: 2 }}>
      {/* Background image - moved here to prevent re-rendering during navigation */}
      {currentBackground !== 'none' && (
        <div
          className="fixed inset-0"
          style={{
            zIndex: 0,
            backgroundImage: currentBackground && currentBackground !== 'offwhite' ? `url('/${currentBackground}')` : 'none',
            backgroundSize: currentBackground === 'jaobscenter.jpeg' ? "cover" : currentBackground === 'offwhite' ? "auto" : "120% 120%",
            backgroundRepeat: currentBackground === 'offwhite' ? "repeat" : "no-repeat",
            backgroundPosition: "center center",
            backgroundAttachment: "fixed",
            backgroundColor: currentBackground === 'offwhite' ? "#f8f9fa" : currentBackground && currentBackground !== 'offwhite' ? "#333333" : "#000000",
            filter: currentBackground
              ? currentBackground === 'halloween.png'
                ? "blur(4px)"
                : currentBackground === 'jaobscenter.jpeg'
                ? "none"
                : currentBackground === 'offwhite'
                ? "none"
                : "blur(8px)"
              : "none",
            transform: "translateZ(0)",
            width: "100vw",
            height: "100vh"
          }}
          id="parallax-background"
          data-debug-background={currentBackground}
        />
      )}
      
      {/* Center Light Effect - disable when using default theme background */}
      {currentBackground !== 'none' && (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            zIndex: 1,
            background: 'radial-gradient(circle at center, rgba(255, 255, 255, 1.0) 0%, rgba(255, 255, 250, 0.9) 20%, rgba(255, 250, 240, 0.7) 40%, rgba(255, 240, 220, 0.5) 60%, transparent 80%)',
            mixBlendMode: 'screen'
          }}
        />
      )}
      
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
      
      {/* Sidebar */}
      <AppSidebar />
      
      {/* Main content area */}
      <SidebarInset className="flex-1 min-h-screen w-full z-3 overflow-x-hidden">
        <header className="flex h-12 shrink-0 items-center transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b border-sidebar-border bg-background">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1 h-8 w-8" />
            {headerContent || (getPageTitle() && (
              <h1 className="text-lg font-semibold text-foreground">
                {getPageTitle()}
              </h1>
            ))}
            {/* Date Navigation - only show when date param exists */}
            {date && (
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={goToPreviousDay}
                  className="h-8 w-8 p-1 rounded-md transition-all duration-200 flex items-center justify-center bg-muted hover:bg-muted/80 border border-border shadow-sm hover:shadow-md"
                  aria-label="Previous day"
                >
                  <svg className="w-4 h-4 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h1 className="text-lg font-semibold text-foreground min-w-[100px] text-center">
                  {formatSelectedDate()}
                </h1>
                <button
                  onClick={goToNextDay}
                  className="h-8 w-8 p-1 rounded-md transition-all duration-200 flex items-center justify-center bg-muted hover:bg-muted/80 border border-border shadow-sm hover:shadow-md"
                  aria-label="Next day"
                >
                  <svg className="w-4 h-4 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2 px-4">
            <NotificationBell />
          </div>
        </header>
        <main className="flex-1 w-full p-2 ">
          {children}
        </main>
      </SidebarInset>
    </div>
  );
};

export default Layout;

