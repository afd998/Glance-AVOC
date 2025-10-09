import React from 'react';
import { useParams } from 'react-router-dom';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAcademicCalendar } from '../hooks/useAcademicCalendar';
import { GraduationCap } from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../../components/ui/popover';

const AcademicCalendarInfo: React.FC = () => {
  const { isDarkMode } = useTheme();
  const { date } = useParams<{ date: string }>();

  // Get selected date from URL params
  const getSelectedDate = (): Date => {
    if (!date) {
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
    }
    
    const [year, month, day] = date.split('-').map(Number);
    const parsedDate = new Date(year, month - 1, day, 12, 0, 0);
    return isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
  };

  const selectedDate = getSelectedDate();
  const { data: calendarItems = [], error } = useAcademicCalendar(selectedDate);

  if (error) {
    return (
      <Badge variant="destructive" className="text-xs">
        Error: {error.message || 'Failed to fetch academic calendar'}
      </Badge>
    );
  }

  if (calendarItems.length === 0) {
    return null;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Badge 
          variant="default" 
          className="text-xs font-medium cursor-pointer hover:scale-105 transition-all duration-300 flex items-center gap-1"
        >
          <GraduationCap className="w-3 h-3" />
          {calendarItems.length} item{calendarItems.length !== 1 ? 's' : ''}
        </Badge>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="center">
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Academic Calendar</h4>
          <div className="space-y-1">
            {calendarItems.map((item) => (
              <div key={item.id} className="text-sm">
                {item.label || 'No label'}
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default AcademicCalendarInfo; 