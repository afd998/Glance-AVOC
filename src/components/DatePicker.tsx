import { Calendar } from "@/components/ui/calendar"
import { Calendar as CalendarIcon } from "lucide-react"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function DatePicker() {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Calendar</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Calendar">
              <CalendarIcon />
              <span>Calendar</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="group-data-[collapsible=icon]:hidden">
          <Calendar 
            className="w-full [&_[role=gridcell].bg-accent]:bg-sidebar-primary [&_[role=gridcell].bg-accent]:text-sidebar-primary-foreground [&_[role=gridcell]]:w-[33px] [&_[role=gridcell]]:h-[33px] [&_table]:w-full [&_thead]:border-b [&_thead]:border-sidebar-border [&_tbody]:space-y-1" 
          />
        </div>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
