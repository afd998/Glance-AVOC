import React, { ReactNode, useEffect } from 'react';
import { useBackground } from './ThemeModal/useBackground';
import { useRain } from '../contexts/RainContext';
import { useSnow } from '../contexts/SnowContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { useHeader, BreadcrumbItem } from '../contexts/HeaderContext';
import RainOverlay from './ThemeModal/components/RainOverlay';
import LeavesOverlay from './ThemeModal/components/LeavesOverlay';
import SnowOverlay from './ThemeModal/components/SnowOverlay';
import { AppSidebar } from '../components/app-sidebar';
import { SidebarInset, SidebarTrigger } from '../components/ui/sidebar';
import { NotificationBell } from './notifications/NotificationBell';
import { Home, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem as BreadcrumbItemComponent,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '../components/ui/breadcrumb';
import { Button } from '../components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { ZoomProvider, useZoom } from '../contexts/ZoomContext';
import { PixelMetricsProvider, usePixelMetrics } from '../contexts/PixelMetricsContext';
import { useProfile } from '../core/User/useProfile';

interface LayoutProps {
  children: ReactNode;
}

// Function to fetch faculty by ID
const fetchFacultyById = async (facultyId: string) => {
  const { data, error } = await supabase
    .from('faculty')
    .select('*')
    .eq('id', Number(facultyId))
    .single();
  if (error) throw error;
  return data;
};

const LayoutContent: React.FC<LayoutProps> = ({ children }) => {
  const { currentBackground } = useBackground();
  const { isRainEnabled } = useRain();
  const { isSnowEnabled } = useSnow();
  const { pageZoom, setPageZoom } = useZoom();
  const { basePixelsPerMinute, setBasePixelsPerMinute, baseRowHeightPx, setBaseRowHeightPx } = usePixelMetrics();
  const { zoom, pixelsPerMin, rowHeightPx } = useProfile();
  const location = useLocation();
  const navigate = useNavigate();
  const { breadcrumbs, setBreadcrumbs } = useHeader();
  // Extract date from pathname (format: /YYYY-MM-DD)
  const dateMatch = location.pathname.match(/^\/(\d{4}-\d{2}-\d{2})/);
  const date = dateMatch ? dateMatch[1] : null;

  // Check if we're on a faculty profile page and get faculty data
  const facultyId = location.pathname.match(/^\/faculty\/(\d+)$/)?.[1];
  const { data: facultyMember } = useQuery({
    queryKey: ['faculty', facultyId],
    queryFn: () => fetchFacultyById(facultyId!),
    enabled: !!facultyId,
  });

  // Generate breadcrumbs based on current route
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbItems: BreadcrumbItem[] = [
      { label: 'Home', href: '/' }
    ];

    if (pathSegments.length === 0) {
      return [{ label: 'Home', isCurrentPage: true }];
    }

    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;
      
      let label = segment;
      
      // Customize labels for known routes
      if (segment === 'faculty') {
        label = 'Faculty List';
      } else if (segment === 'session-assignments') {
        label = 'Session Assignments';
      } else if (segment === 'user-profile') {
        label = 'User Profile';
      } else if (segment === 'about') {
        label = 'About';
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(segment)) {
        // Format date segments with navigation buttons
        const [year, month, day] = segment.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        const dateLabel = date.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        });
        
        // Create custom content with date and navigation buttons
        label = dateLabel;
      } else if (/^\d+$/.test(segment) && pathSegments[index - 1] === 'faculty') {
        // This is a faculty ID - use the faculty name if available
        if (facultyMember) {
          label = facultyMember.kelloggdirectory_name || facultyMember.twentyfivelive_name || `Faculty ${segment}`;
        } else {
          label = `Faculty ${segment}`;
        }
      }

      breadcrumbItems.push({
        label,
        href: isLast ? undefined : currentPath,
        isCurrentPage: isLast
      });
    });

    return breadcrumbItems;
  };

  // Update breadcrumbs when route changes or faculty data loads
  useEffect(() => {
    const newBreadcrumbs = generateBreadcrumbs();
    setBreadcrumbs(newBreadcrumbs);
  }, [location.pathname, setBreadcrumbs, facultyMember]);

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
    breadcrumbs: breadcrumbs.length
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

  // Initialize UI metrics from profile on first load
  useEffect(() => {
    if (typeof zoom === 'number' && zoom > 0 && zoom !== pageZoom) {
      setPageZoom(zoom);
    }
    if (typeof pixelsPerMin === 'number' && pixelsPerMin > 0 && pixelsPerMin !== basePixelsPerMinute) {
      setBasePixelsPerMinute(pixelsPerMin);
    }
    if (typeof rowHeightPx === 'number' && rowHeightPx > 0 && rowHeightPx !== baseRowHeightPx) {
      setBaseRowHeightPx(rowHeightPx);
    }
  }, [zoom, pixelsPerMin, rowHeightPx]);
  
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
      
      {/* Main content area - no transform scaling to preserve layout/sticky/absolute behavior */}
      <SidebarInset 
        className="flex-1 h-screen w-full z-3 overflow-x-hidden flex flex-col"
      >
        <header className="flex h-12 shrink-0 items-center transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b border-sidebar-border bg-background">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1 h-8 w-8" />
            <Breadcrumb>
              <BreadcrumbList className="h-8 gap-2 rounded-md border px-3 text-sm">
                {breadcrumbs.map((item, index) => (
                  <React.Fragment key={index}>
                    {index > 0 && <BreadcrumbSeparator />}
                    <BreadcrumbItemComponent>
                      {index === 0 && item.label === 'Home' ? (
                        <BreadcrumbLink 
                          onClick={() => navigate(item.href || '/')}
                          className="cursor-pointer"
                        >
                          <Home className="size-4" />
                          <span className="sr-only">Home</span>
                        </BreadcrumbLink>
                      ) : item.isCurrentPage && /^\d{4}-\d{2}-\d{2}$/.test(location.pathname.split('/').pop() || '') ? (
                        // Date breadcrumb with navigation buttons
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={goToPreviousDay}
                            variant="outline"
                            size="sm"
                            className="h-6 w-6 p-0"
                            aria-label="Previous day"
                          >
                            <ChevronLeft className="w-3 h-3" />
                          </Button>
                          <BreadcrumbPage>{item.label}</BreadcrumbPage>
                          <Button
                            onClick={goToNextDay}
                            variant="outline"
                            size="sm"
                            className="h-6 w-6 p-0"
                            aria-label="Next day"
                          >
                            <ChevronRight className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : item.isCurrentPage ? (
                        <BreadcrumbPage>{item.label}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink 
                          onClick={() => navigate(item.href || '#')}
                          className="cursor-pointer"
                        >
                          {item.label}
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItemComponent>
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2 px-4">
            <NotificationBell />
          </div>
        </header>
        <main className="flex-1 w-full p-2 overflow-y-auto min-h-0">
          {children}
        </main>
      </SidebarInset>
    </div>
  );
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <ZoomProvider>
      <PixelMetricsProvider>
        <LayoutContent>{children}</LayoutContent>
      </PixelMetricsProvider>
    </ZoomProvider>
  );
};

export default Layout;