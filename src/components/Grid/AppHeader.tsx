import React from 'react';
import DatePickerComponent from './DatePickerComponent';
import MenuPanel from '../MenuPanel/MenuPanel';
import AcademicCalendarInfo from './AcademicCalendarInfo';

import QuarterCount from './QuarterCount';
import { Database } from '../../types/supabase';
import { NotificationBell } from './NotificationBell';

type Event = Database['public']['Tables']['events']['Row'];

interface AppHeaderProps {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  isLoading: boolean;
  events: Event[] | undefined;
}

export default function AppHeader({ 
  selectedDate, 
  setSelectedDate, 
  isLoading, 
  events 
}: AppHeaderProps) {
  return (
    <div className="fixed top-4 left-4 right-4 z-[9999] opacity-0 hover:opacity-100 transition-opacity duration-300">
      {/* Desktop Layout - md and up */}
      <div className="hidden md:block">
        {/* CSS Grid Layout - 2 rows, 7 columns with content-based sizing */}
        <div className="grid gap-2 p-4" style={{ 
          gridTemplateColumns: 'auto auto auto auto auto auto 1fr',
          gridTemplateRows: 'auto min-content'
        }}>
          {/* Row 1: Today button, Previous arrow, DatePicker, Next arrow, AcademicCalendarInfo, CurrentFilterLink, MenuPanel */}
          <div className="flex items-center justify-center">
            <button
              onClick={() => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                setSelectedDate(today);
              }}
              disabled={isLoading}
              className={`h-8 px-2 py-1 text-xs font-medium rounded-xl backdrop-blur-sm border transition-all duration-200 shadow-lg hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] transform hover:scale-105 ${
                isLoading 
                  ? 'opacity-50 cursor-not-allowed border-gray-300/50 dark:border-gray-600/50 bg-gray-100/80 dark:bg-gray-700/80 text-gray-500 dark:text-gray-300' 
                  : 'border-gray-300/50 dark:border-gray-600/50 bg-gray-100/80 dark:bg-gray-700/80 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/80 dark:hover:bg-gray-600/80'
              }`}
              aria-label="Go to today"
            >
              Today
            </button>
          </div>
          
          <div className="flex items-center justify-center">
            <button
              onClick={() => {
                const newDate = new Date(selectedDate);
                newDate.setDate(newDate.getDate()-1);
                newDate.setHours(0, 0, 0, 0);
                setSelectedDate(newDate);
              }}
              disabled={isLoading}
              className={`h-10 w-10 p-2 rounded-lg transition-all duration-200 flex items-center justify-center bg-gray-100/80 dark:bg-gray-700/80 backdrop-blur-sm border border-gray-300/50 dark:border-gray-600/50 shadow-lg hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] ${
                isLoading 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-gray-200/80 dark:hover:bg-gray-600/80 hover:scale-105'
              }`}
              aria-label="Previous day"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
          
          <div className="flex items-center justify-center">
            <DatePickerComponent 
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              isLoading={isLoading}
            />
          </div>
          
          <div className="flex items-center justify-center">
            <button
              onClick={() => {
                const newDate = new Date(selectedDate);
                newDate.setDate(newDate.getDate() + 1);
                newDate.setHours(0, 0, 0, 0);
                setSelectedDate(newDate);
              }}
              disabled={isLoading}
              className={`h-10 w-10 p-2 rounded-lg transition-all duration-200 flex items-center justify-center bg-gray-100/80 dark:bg-gray-700/80 backdrop-blur-sm border border-gray-300/50 dark:border-gray-600/50 shadow-lg hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] ${
                isLoading 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-gray-200/80 dark:hover:bg-gray-600/80 hover:scale-105'
              }`}
              aria-label="Next day"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          
          <div className="flex items-center justify-center">
            <AcademicCalendarInfo />
          </div>
          
          <div className="flex items-center justify-center">
            <QuarterCount />
          </div>
          
          <div className="flex items-center justify-end gap-2">
            <NotificationBell />
            <MenuPanel selectedDate={selectedDate} events={events} />
          </div>
          
          {/* Row 2: Empty, Empty, Empty, Empty, Empty, Empty, Empty */}
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
      </div>



      {/* Mobile Layout - below md */}
      <div className="md:hidden">
        {/* Mobile CSS Grid Layout - 2 rows, 7 columns with content-based sizing */}
        <div className="grid gap-2 p-3" style={{ 
          gridTemplateColumns: 'auto auto auto auto auto auto 1fr',
          gridTemplateRows: 'auto min-content'
        }}>
          {/* Row 1: Today button, Previous arrow, DatePicker, Next arrow, AcademicCalendarInfo, CurrentFilterLink, MenuPanel */}
          <div className="flex items-center justify-center">
            <button
              onClick={() => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                setSelectedDate(today);
              }}
              disabled={isLoading}
              className={`h-8 px-2 py-1 text-xs font-medium rounded-xl backdrop-blur-sm border transition-all duration-200 shadow-lg hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] transform hover:scale-105 ${
                isLoading 
                  ? 'opacity-50 cursor-not-allowed border-gray-300/50 dark:border-gray-600/50 bg-gray-100/80 dark:bg-gray-700/80 text-gray-500 dark:text-gray-300' 
                  : 'border-gray-300/50 dark:border-gray-600/50 bg-gray-100/80 dark:bg-gray-700/80 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/80 dark:hover:bg-gray-600/80'
              }`}
              aria-label="Go to today"
            >
              Today
            </button>
          </div>
          
          <div className="flex items-center justify-center">
            <button
              onClick={() => {
                const newDate = new Date(selectedDate);
                newDate.setDate(newDate.getDate()-1);
                newDate.setHours(0, 0, 0, 0);
                setSelectedDate(newDate);
              }}
              disabled={isLoading}
              className={`h-7 w-7 p-1 rounded-lg transition-all duration-200 flex items-center justify-center bg-gray-100/80 dark:bg-gray-700/80 backdrop-blur-sm border border-gray-300/50 dark:border-gray-600/50 shadow-lg hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] ${
                isLoading 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-gray-200/80 dark:hover:bg-gray-600/80 hover:scale-105'
              }`}
              aria-label="Previous day"
            >
              <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
          
          <div className="flex items-center justify-center">
            <DatePickerComponent 
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              isLoading={isLoading}
            />
          </div>
          
          <div className="flex items-center justify-center">
            <button
              onClick={() => {
                const newDate = new Date(selectedDate);
                newDate.setDate(newDate.getDate() + 1);
                newDate.setHours(0, 0, 0, 0);
                setSelectedDate(newDate);
              }}
              disabled={isLoading}
              className={`h-7 w-7 p-1 rounded-lg transition-all duration-200 flex items-center justify-center bg-gray-100/80 dark:bg-gray-700/80 backdrop-blur-sm border border-gray-300/50 dark:border-gray-600/50 shadow-lg hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] ${
                isLoading 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-gray-200/80 dark:hover:bg-gray-600/80 hover:scale-105'
              }`}
              aria-label="Next day"
            >
              <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          
          <div className="flex items-center justify-center">
            {false && <AcademicCalendarInfo />}
          </div>
          
          <div className="flex items-center justify-center">
            <QuarterCount />
          </div>
          
          <div className="flex items-center justify-end gap-2">
            <MenuPanel selectedDate={selectedDate} events={events} />
          </div>
          
          {/* Row 2: Empty, Empty, Empty, Empty, Empty, Empty, Empty */}
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
      </div>
    </div>
  );
}


