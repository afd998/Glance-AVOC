"use client"

import * as React from "react"
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
  Users,
  UserCheck,
  Bell,
  Palette,
  Filter,
  Calendar,
  ZoomIn,
  ClipboardList,
} from "lucide-react"
import { useNavigate, useParams, useLocation } from "react-router-dom"

import { NavUser } from "./nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "./ui/sidebar"
import { Slider } from "./ui/slider"
import { Badge } from "./ui/badge"
import DatePicker from "react-datepicker"
import { useTheme } from "../contexts/ThemeContext"
import { useBackground } from "../features/ThemeModal/useBackground"
import NotificationsModal from "../features/notifications/NotificationsModal"
import BackgroundSelectorModal from "../features/ThemeModal/BackgroundSelectorModal"
import { useAuth } from "../contexts/AuthContext"
import useModalStore from "../stores/modalStore"
import FilterRoomsModal from "../features/Schedule/components/FilterRoomsModal"
import { useZoom } from "../contexts/ZoomContext";
import { usePixelMetrics } from "../contexts/PixelMetricsContext";
import { useProfile } from "../core/User/useProfile";
import * as ReactQuery from '@tanstack/react-query'

// Navigation data for the sidebar
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Faculty",
      url: "#",
      icon: Users,
      isActive: true,
      items: [
        {
          title: "Faculty List",
          url: "#",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const navigate = useNavigate();
  const { date } = useParams();
  const location = useLocation();
  const { isDarkMode } = useTheme();
  const { currentBackground } = useBackground();
  const { openFilterRoomsModal, isFilterRoomsModalOpen, closeFilterRoomsModal } = useModalStore();
  const { user } = useAuth();
  const { pageZoom, setPageZoom } = useZoom();
  const { basePixelsPerMinute, setBasePixelsPerMinute, baseRowHeightPx, setBaseRowHeightPx, pixelsPerMinute, rowHeightPx } = usePixelMetrics();
  const { updateZoom, updatePixelsPerMin, updateRowHeight, currentFilter } = useProfile();
  const queryClient = ReactQuery.useQueryClient();
  const profileKey = React.useMemo(() => ['profile', user?.id], [user?.id]);
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  
  // Check if we're on the home page (/{date} route) with 100% zoom
  const isHomePage = React.useMemo(() => {
    const match = location.pathname.match(/^\/\d{4}-\d{2}-\d{2}$/) !== null;
    console.log('[Sidebar] isHomePage check:', { pathname: location.pathname, match });
    return match;
  }, [location.pathname]);
  
  const isAt100PercentZoom = pageZoom === 1;
  
  const shouldShowEventAssignmentsButton = isHomePage && isAt100PercentZoom;
  
  // Debug logging
  React.useEffect(() => {
    console.log('[Sidebar] Event Assignments Button Debug:', {
      pathname: location.pathname,
      isHomePage,
      pageZoom,
      isAt100PercentZoom,
      shouldShowEventAssignmentsButton
    });
  }, [location.pathname, isHomePage, pageZoom, isAt100PercentZoom, shouldShowEventAssignmentsButton]);
  
  // Selected date is driven by the URL param when present
  const selectedDate = React.useMemo(() => {
    if (!date) return new Date();
    const [y, m, d] = date.split("-").map(Number);
    if (!y || !m || !d) return new Date();
    return new Date(y, m - 1, d);
  }, [date]);
  
  const formatDateForPath = React.useCallback((d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);
  
  // Modal state management
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
  const [isBackgroundSelectorOpen, setIsBackgroundSelectorOpen] = React.useState(false);
  
  // Create navigation data with proper URLs
  const navigationData = React.useMemo(() => ({
    ...data,
    user: {
      ...data.user,
      id: user?.id,
      name: user?.user_metadata?.full_name || user?.email || "User",
      email: user?.email || "user@example.com",
    },
    navMain: [],
    projects: [],
  }), [date, user]);

  // Dynamic class to target the specific numeric day class (e.g., react-datepicker__day--024)
  const urlDayNumericClass = React.useMemo(() => {
    const dd = String(selectedDate.getDate()).padStart(3, "0");
    return `react-datepicker__day--${dd}`;
  }, [selectedDate]);
  const calendarScopeClass = React.useMemo(() => {
    const dd = String(selectedDate.getDate()).padStart(3, "0");
    return `url-day-${dd}`;
  }, [selectedDate]);

  return (
    <>
      <Sidebar collapsible="icon" {...props}>
        <SidebarHeader>
          <div className="flex flex-col items-center justify-center p-2 gap-2">
            <button
              onClick={() => navigate('/')}
              className="h-12 w-12 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8 p-4 group-data-[collapsible=icon]:p-2 rounded-full transition-all duration-200 flex flex-col items-center justify-center backdrop-blur-sm border border-purple-400/50 shadow-lg hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] hover:scale-105 active:scale-95 bg-primary"
              aria-label="Go to home"
            >
              <span className="text-sm group-data-[collapsible=icon]:text-[10px] text-white text-center leading-tight font-medium">
                AVOC
              </span>
              <span className="text-[10px] group-data-[collapsible=icon]:text-[6px] text-white text-center leading-tight font-medium">
                HOME
              </span>
            </button>
            
            {/* Calendar icon - only visible when collapsed */}
            <button
              onClick={() => {
                // Trigger sidebar expansion by removing the collapsed state
                const sidebarElement = document.querySelector('[data-sidebar="sidebar"]');
                if (sidebarElement) {
                  sidebarElement.removeAttribute('data-state');
                  // Also trigger the sidebar toggle if there's a toggle button
                  const toggleButton = document.querySelector('[data-sidebar="trigger"]');
                  if (toggleButton) {
                    (toggleButton as HTMLElement).click();
                  }
                }
              }}
              className="group-data-[collapsible=icon]:flex hidden w-full h-8 rounded-md transition-colors hover:bg-accent hover:text-accent-foreground flex items-center justify-center"
              aria-label="Open calendar"
            >
              <Calendar className="h-4 w-4" />
            </button>
            
            {/* Faculty icon - only visible when collapsed */}
            <button
              onClick={() => navigate('/faculty')}
              className="group-data-[collapsible=icon]:flex hidden w-full h-8 rounded-md transition-colors hover:bg-accent hover:text-accent-foreground flex items-center justify-center"
              aria-label="Faculty List"
            >
              <Users className="h-4 w-4" />
            </button>
            
            {/* Session Assignments icon - only visible when collapsed */}
            <button
              onClick={() => navigate('/sessionassignments')}
              className="group-data-[collapsible=icon]:flex hidden w-full h-8 rounded-md transition-colors hover:bg-accent hover:text-accent-foreground flex items-center justify-center"
              aria-label="Session Assignments"
            >
              <ClipboardList className="h-4 w-4" />
            </button>
            
          </div>
        </SidebarHeader>
        <SidebarContent>
          {/* Date Picker */}
          <SidebarGroup className="px-0 group-data-[collapsible=icon]:hidden py-4">
            <SidebarGroupLabel className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Calendar
            </SidebarGroupLabel>
            <SidebarGroupContent className="px-3">
              <div className="w-full">
                <DatePicker
                  selected={selectedDate}
                  onChange={(date) => {
                    if (date) {
                      const formattedDate = formatDateForPath(date);
                      navigate(`/${formattedDate}`);
                    }
                  }}
                  inline
                  calendarClassName="!w-full !border-0 !shadow-none bg-transparent"
                  dayClassName={(date) => {
                    const dayNum = String(date.getDate()).padStart(3, "0");
                    const baseClasses = "react-datepicker__day";
                    const isSelected = date.toDateString() === selectedDate.toDateString();
                    const isToday = date.toDateString() === new Date().toDateString();
                    
                    let classes = baseClasses;
                    if (isSelected) classes += " react-datepicker__day--selected";
                    if (isToday) classes += " react-datepicker__day--today";
                    if (urlDayNumericClass === `react-datepicker__day--${dayNum}`) {
                      classes += " bg-blue-500 text-white";
                    }
                    
                    return classes;
                  }}
                />
              </div>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator className="group-data-[collapsible=icon]:hidden" />

          {/* View Controls */}
          <SidebarGroup className="px-0 group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              View
            </SidebarGroupLabel>
            <SidebarGroupContent className="px-3">
              <div className="space-y-4">
                {/* Filter Rooms Button */}
                <div className="space-y-2">
                  <SidebarMenuButton 
                    onClick={openFilterRoomsModal}
                    className="w-full justify-start"
                  >
                    <Filter className="h-4 w-4" />
                    <span>Filter Rooms</span>
                    {currentFilter && (
                      <Badge variant="outline" className="ml-auto text-xs">
                        {currentFilter}
                      </Badge>
                    )}
                  </SidebarMenuButton>
                </div>
                {/* Page Zoom */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <ZoomIn className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Zoom</span>
                  </div>
                  <Slider
                    value={[pageZoom]}
                    min={0.5}
                    max={2}
                    step={0.1}
                    onValueChange={(v) => setPageZoom(v[0])}
                    onValueCommit={(v) => {
                      const val = v[0];
                      console.log('[Sidebar] onValueCommit zoom ->', val);
                      // optimistic update: update cache's zoom
                      queryClient.setQueryData(profileKey, (old: any) => old ? { ...old, zoom: val } : old);
                      updateZoom(val);
                    }}
                    className="w-full"
                    aria-label="Page zoom"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>50%</span>
                    <span className="font-medium">{Math.round(pageZoom * 100)}%</span>
                    <span>200%</span>
                  </div>
                </div>

                {/* Pixels per Minute */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Pixels/min</span>
                    <span className="text-xs tabular-nums text-muted-foreground">{pixelsPerMinute.toFixed(2)}</span>
                  </div>
                  <Slider
                    value={[basePixelsPerMinute]}
                    min={0.5}
                    max={4}
                    step={0.1}
                    onValueChange={(v) => setBasePixelsPerMinute(v[0])}
                    onValueCommit={(v) => {
                      const val = v[0];
                      console.log('[Sidebar] onValueCommit pixels_per_min ->', val);
                      queryClient.setQueryData(profileKey, (old: any) => old ? { ...old, pixels_per_min: val } : old);
                      updatePixelsPerMin(val);
                    }}
                    className="w-full"
                    aria-label="Pixels per minute"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0.5</span>
                    <span>4.0</span>
                  </div>
                </div>

                {/* Row Height */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Row Height</span>
                    <span className="text-xs tabular-nums text-muted-foreground">{Math.round(rowHeightPx * pageZoom)}px</span>
                  </div>
                  <Slider
                    value={[baseRowHeightPx]}
                    min={80}
                    max={160}
                    step={2}
                    onValueChange={(v) => setBaseRowHeightPx(v[0])}
                    onValueCommit={(v) => {
                      const val = v[0];
                      console.log('[Sidebar] onValueCommit row_height ->', val);
                      queryClient.setQueryData(profileKey, (old: any) => old ? { ...old, row_height: val } : old);
                      updateRowHeight(val);
                    }}
                    className="w-full"
                    aria-label="Row height pixels"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>90px</span>
                    <span>160px</span>
                  </div>
                </div>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator className="group-data-[collapsible=icon]:hidden" />

          {/* Platform */}
          <SidebarGroup className="px-0 group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Platform
            </SidebarGroupLabel>
            <SidebarGroupContent className="px-3">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    onClick={() => navigate('/faculty')}
                    className="w-full justify-start"
                  >
                    <Users className="h-4 w-4" />
                    <span>Faculty List</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    onClick={() => navigate('/sessionassignments')}
                    className="w-full justify-start"
                  >
                    <ClipboardList className="h-4 w-4" />
                    <span>Session Assignments</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          
          <SidebarSeparator className="group-data-[collapsible=icon]:hidden" />
          
          {/* Quick Actions */}
          <SidebarGroup className="px-0 group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Quick Actions
            </SidebarGroupLabel>
            <SidebarGroupContent className="px-3">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    onClick={() => setIsNotificationsOpen(true)}
                    className="w-full justify-start"
                  >
                    <Bell className="h-4 w-4" />
                    <span>Notifications</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    onClick={() => setIsBackgroundSelectorOpen(true)}
                    className="w-full justify-start"
                  >
                    <Palette className="h-4 w-4" />
                    <span>Backgrounds</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={navigationData.user} />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      {/* Modals */}
      <NotificationsModal 
        isOpen={isNotificationsOpen} 
        onClose={() => setIsNotificationsOpen(false)} 
      />
      
      <BackgroundSelectorModal 
        isOpen={isBackgroundSelectorOpen} 
        onClose={() => setIsBackgroundSelectorOpen(false)} 
      />
      
      <FilterRoomsModal 
        isOpen={isFilterRoomsModalOpen} 
        onClose={closeFilterRoomsModal} 
      />
    </>
  );
}