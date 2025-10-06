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
} from "lucide-react"
import { useNavigate, useParams } from "react-router-dom"

import { NavMain } from "./nav-main"
import { NavProjects } from "./nav-projects"
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
import DatePicker from "react-datepicker"
import { useTheme } from "../contexts/ThemeContext"
import { useBackground } from "../features/ThemeModal/useBackground"
import NotificationsModal from "../features/notifications/NotificationsModal"
import BackgroundSelectorModal from "../features/ThemeModal/BackgroundSelectorModal"
import { useAuth } from "../contexts/AuthContext"
import useModalStore from "../stores/modalStore"
import FilterRoomsModal from "../features/Schedule/components/FilterRoomsModal"

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
  const { isDarkMode } = useTheme();
  const { currentBackground } = useBackground();
  const { openFilterRoomsModal, isFilterRoomsModalOpen, closeFilterRoomsModal } = useModalStore();
  const { user } = useAuth();
  
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
    navMain: [
      {
        title: "Faculty",
        url: "#",
        icon: Users,
        isActive: true,
        items: [
          {
            title: "Faculty List",
            url: `/faculty`,
          },
        ],
      },
    ],
  }), [date]);

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
          <div className="flex items-center justify-center p-2">
            <button
              onClick={() => navigate('/')}
              className="h-12 w-12 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8 p-4 group-data-[collapsible=icon]:p-2 rounded-full transition-all duration-200 flex flex-col items-center justify-center backdrop-blur-sm border border-purple-400/50 shadow-lg hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] hover:scale-105 active:scale-95"
              style={{
                backgroundColor: 'rgba(133, 118, 163, 1.0)',
                borderColor: 'rgba(133, 118, 163, 0.8)'
              }}
              aria-label="Go to home"
            >
              <span className="text-sm group-data-[collapsible=icon]:text-[10px] text-white text-center leading-tight font-medium">
                AVOC
              </span>
              <span className="text-[10px] group-data-[collapsible=icon]:text-[6px] text-white text-center leading-tight font-medium">
                HOME
              </span>
            </button>
          </div>
        </SidebarHeader>
        <SidebarContent>
          {/* Date Picker */}
          <SidebarGroup className="px-0 group-data-[collapsible=icon]:hidden py-4">
            <SidebarGroupContent className="min-h-[220px]">
              <DatePicker
                selected={selectedDate}
                highlightDates={[selectedDate]}
                dayClassName={(d: Date) => {
                  const yyyy = d.getFullYear();
                  const mm = String(d.getMonth() + 1).padStart(2, "0");
                  const dd = String(d.getDate()).padStart(2, "0");
                  const dayKey = `${yyyy}-${mm}-${dd}`;
                  const classes: string[] = [];

                  // URL-selected day
                  if (dayKey === formatDateForPath(selectedDate)) {
                    classes.push("rdp-current-url-day");
                  }

                  // Today (now) text color marker
                  const now = new Date();
                  const nowKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
                  if (dayKey === nowKey) {
                    classes.push("rdp-today-text");
                  }

                  return classes.join(" ");
                }}
                onChange={(date: Date | null) => {
                  if (date) {
                    navigate(`/${formatDateForPath(date)}`);
                  }
                }}
                calendarClassName={calendarScopeClass}
                inline
              />
              {/* Dynamic CSS rule to scope primary background to the exact numeric day class for the URL date */}
              <style>{
                `.${calendarScopeClass} .${urlDayNumericClass}:not(.react-datepicker__day--outside-month){background:hsl(var(--primary)) !important;color:hsl(var(--primary-foreground)) !important;}`
              }</style>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarSeparator className="mx-0" />

          {/* Current Filter Link - right under calendar */}
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={openFilterRoomsModal}>
                  <Filter />
                  <span>Room Filter</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
          <SidebarSeparator className="mx-0" />

          <NavMain items={navigationData.navMain} />
          
          {/* Management Tools Section */}
          <SidebarGroup>
            <SidebarGroupLabel>Management Tools</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => navigate('/sessionassignments')}>
                  <UserCheck />
                  <span>Session Assignments</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setIsNotificationsOpen(true)}>
                  <Bell />
                  <span>Scheduled Notifications</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>

          {/* Quick Actions Section */}
          <SidebarGroup>
            <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setIsBackgroundSelectorOpen(true)}>
                  <Palette />
                  <span>Theme Settings</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {isDarkMode ? 'Dark' : 'Light'} • {currentBackground ? currentBackground.replace(/\.(avif|jpeg|jpg|png)$/i, '') : 'Loading...'}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>

          {/* <NavProjects projects={data.projects} /> */}
        </SidebarContent>
        <SidebarFooter>
          {user && (
            <NavUser user={{
              name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
              email: user.email || '',
              avatar: user.user_metadata?.avatar_url || ''
            }} />
          )}
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
  )
}
