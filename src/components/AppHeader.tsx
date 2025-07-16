import React from 'react';
import DatePickerComponent from './Grid/DatePickerComponent';
import FilterPanel from './MenuPanel/FilterPanel';
import AcademicCalendarInfo from './Grid/AcademicCalendarInfo';
import CurrentFilterLink from './Grid/CurrentFilterLink';
import QuarterCount from './Grid/QuarterCount';
import { Database } from '../types/supabase';

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
    <div className="">
      {/* Desktop Layout - md and up */}
      <div className="hidden md:block">
        {/* CSS Grid Layout - 2 rows, 7 columns with content-based sizing */}
        <div className="grid gap-0 mb-3" style={{ 
          gridTemplateColumns: 'auto auto auto auto auto auto 1fr',
          gridTemplateRows: 'auto min-content'
        }}>
          {/* Row 1: Today button, Previous arrow, DatePicker, Next arrow, AcademicCalendarInfo, CurrentFilterLink, FilterPanel */}
          <div className="flex items-center justify-center">
            <button
              onClick={() => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                setSelectedDate(today);
              }}
              disabled={isLoading}
              className={`h-8 px-2 py-1 text-xs font-medium rounded-lg transition-all duration-200 ${
                isLoading 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-400 to-blue-500 text-white hover:from-blue-500 hover:to-blue-600 dark:from-blue-500 dark:to-blue-600 dark:hover:from-blue-600 dark:hover:to-blue-700 shadow-sm hover:shadow-md transform hover:scale-102'
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
              className={`h-12 w-12 p-2 rounded-lg transition-all duration-200 flex items-center justify-center ${
                isLoading 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-gray-200 dark:hover:bg-gray-700 hover:shadow-sm'
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
              className={`h-12 w-12 p-2 rounded-lg transition-all duration-200 flex items-center justify-center ${
                isLoading 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-gray-200 dark:hover:bg-gray-700 hover:shadow-sm'
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
            <CurrentFilterLink />
          </div>
          
          <div className="flex items-center justify-end">
            <FilterPanel selectedDate={selectedDate} events={events} />
          </div>
          
          {/* Row 2: Empty, Empty, QuarterCount, Empty, Empty, Empty, Empty */}
          <div></div>
          <div></div>
          <div className="flex items-center justify-center">
            <QuarterCount />
          </div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
      </div>

      {/* Mobile Layout - below md */}
      <div className="md:hidden">
        {/* Mobile CSS Grid Layout - 2 rows, 7 columns with content-based sizing */}
        <div className="grid gap-0 mb-3" style={{ 
          gridTemplateColumns: 'auto auto auto auto auto auto 1fr',
          gridTemplateRows: 'auto min-content'
        }}>
          {/* Row 1: Today button, Previous arrow, DatePicker, Next arrow, AcademicCalendarInfo, CurrentFilterLink, FilterPanel */}
          <div className="flex items-center justify-center">
            <button
              onClick={() => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                setSelectedDate(today);
              }}
              disabled={isLoading}
              className={`h-8 px-2 py-1 text-xs font-medium rounded-lg transition-all duration-200 ${
                isLoading 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-400 to-blue-500 text-white hover:from-blue-500 hover:to-blue-600 dark:from-blue-500 dark:to-blue-600 dark:hover:from-blue-600 dark:hover:to-blue-700 shadow-sm hover:shadow-md transform hover:scale-102'
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
              className={`h-8 w-8 p-1 rounded-lg transition-all duration-200 flex items-center justify-center ${
                isLoading 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-gray-200 dark:hover:bg-gray-700 hover:shadow-sm'
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
              className={`h-8 w-8 p-1 rounded-lg transition-all duration-200 flex items-center justify-center ${
                isLoading 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-gray-200 dark:hover:bg-gray-700 hover:shadow-sm'
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
            {false && <CurrentFilterLink />}
          </div>
          
          <div className="flex items-center justify-end">
            <FilterPanel selectedDate={selectedDate} events={events} />
          </div>
          
          {/* Row 2: Empty, Empty, QuarterCount, Empty, Empty, Empty, Empty */}
          <div></div>
          <div></div>
          <div className="flex items-center justify-center">
            {false && <QuarterCount />}
          </div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
      </div>
    </div>
  );
} 