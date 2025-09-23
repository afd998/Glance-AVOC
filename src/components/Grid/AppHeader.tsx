import React, { useState, useEffect } from 'react';
import DatePickerComponent from './DatePickerComponent';
import AcademicCalendarInfo from './AcademicCalendarInfo';
import CurrentFilterLink from './CurrentFilterLink';
import MenuPanel from '../MenuPanel/MenuPanel';
import { NotificationBell } from './NotificationBell';
import QuarterCount from './QuarterCount';
import { Database } from '../../types/supabase';

type Event = Database['public']['Tables']['events']['Row'];

interface AppHeaderProps {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  isLoading: boolean;
  events: Event[] | undefined;
  isDragging?: boolean;
  onHoverChange?: (isHovered: boolean) => void; // Callback for hover state changes
}

export default function AppHeader({ 
  selectedDate, 
  setSelectedDate, 
  isLoading, 
  events,
  isDragging = false,
  onHoverChange
}: AppHeaderProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Make the entire header invisible when not hovering (except when modal is open)
  const showHeader = isHovered || isModalOpen;

  // Notify parent component when hover state changes
  useEffect(() => {
    if (onHoverChange) {
      onHoverChange(showHeader);
    }
  }, [showHeader, onHoverChange]);

  return (
    <div
      className="fixed top-0 left-4 right-4 z-[9999]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Desktop Layout - md and up */}
      <div className="hidden md:block">
        {/* CSS Grid Layout - 1 row, 10 columns for spacing */}
        <div className="grid gap-2 p-4" style={{
          gridTemplateColumns: 'auto auto auto auto auto auto auto 1fr auto auto',
          gridTemplateRows: 'auto'
        }}>
          {/* Row 1: Today | Prev | DatePicker | Next | Academic | Quarter | CurrentFilterLink | big space | Bell | Menu */}
          <div className="flex items-center justify-center">
            <button
              onClick={() => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                setSelectedDate(today);
              }}
              disabled={isLoading}
              className={`text-xs px-3 py-1.5 rounded-full backdrop-blur-md border shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer relative overflow-hidden ${
                isLoading
                  ? 'opacity-50 cursor-not-allowed bg-white/5 border-white/10 text-black'
                  : 'bg-white/5 border-white/10 text-black hover:backdrop-blur-sm dark:border-white/20 dark:text-black dark:hover:bg-white/25'
              }`}
              style={{ opacity: showHeader ? 1 : 0, pointerEvents: showHeader ? 'auto' : 'none' }}
              aria-label="Go to today"
            >
              {/* Glassmorphic shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/5 to-transparent rounded-full"></div>
              <div className="relative z-10 font-medium opacity-75">
                Today
              </div>
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
              className={`h-10 w-10 p-2 rounded-lg transition-all duration-200 flex items-center justify-center bg-gray-100/40 dark:bg-gray-700/40 backdrop-blur-sm border border-gray-300/30 dark:border-gray-600/30 shadow-lg hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] ${
                isLoading
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-gray-200/50 dark:hover:bg-gray-600/50 hover:scale-105 active:scale-95'
              }`}
              style={{ opacity: showHeader ? 1 : 0, pointerEvents: showHeader ? 'auto' : 'none' }}
              aria-label="Previous day"
            >
              <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>

          {/* DatePicker - always visible */}
          <div className="flex items-center justify-center">
            <DatePickerComponent
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              isLoading={isLoading}
              onCalendarOpen={() => setIsModalOpen(true)}
              onCalendarClose={() => setIsModalOpen(false)}
            />
          </div>

          <div className="flex items-center justify-center">
            <button
              onClick={() => {
                const newDate = new Date(selectedDate);
                newDate.setDate(newDate.getDate()+1);
                newDate.setHours(0, 0, 0, 0);
                setSelectedDate(newDate);
              }}
              disabled={isLoading}
              className={`h-10 w-10 p-2 rounded-lg transition-all duration-200 flex items-center justify-center bg-gray-100/40 dark:bg-gray-700/40 backdrop-blur-sm border border-gray-300/30 dark:border-gray-600/30 shadow-lg hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] ${
                isLoading
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-gray-200/50 dark:hover:bg-gray-600/50 hover:scale-105 active:scale-95'
              }`}
              style={{ opacity: showHeader ? 1 : 0, pointerEvents: showHeader ? 'auto' : 'none' }}
              aria-label="Next day"
            >
              <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="flex items-center justify-center">
            <div style={{ opacity: showHeader ? 1 : 0, pointerEvents: showHeader ? 'auto' : 'none' }} className="flex items-center justify-center h-full">
              <AcademicCalendarInfo />
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div style={{ opacity: showHeader ? 1 : 0, pointerEvents: showHeader ? 'auto' : 'none' }} className="flex items-center justify-center h-full">
              <QuarterCount />
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div style={{ opacity: showHeader ? 1 : 0, pointerEvents: showHeader ? 'auto' : 'none' }} className="flex items-center justify-center h-full">
              <CurrentFilterLink onModalOpen={() => setIsModalOpen(true)} />
            </div>
          </div>

          {/* Big space */}
          <div className="flex items-center justify-center">
            {/* Big space column */}
          </div>

          <div className="flex items-center justify-center">
            <div style={{ opacity: showHeader ? 1 : 0, pointerEvents: showHeader ? 'auto' : 'none' }} className="flex items-center justify-center h-full">
              <NotificationBell />
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div style={{ opacity: showHeader ? 1 : 0, pointerEvents: showHeader ? 'auto' : 'none' }} className="flex items-center justify-center h-full">
              <MenuPanel selectedDate={selectedDate} events={events} onModalClose={() => setIsModalOpen(false)} onModalOpen={() => setIsModalOpen(true)} />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout - below md */}
      <div className="md:hidden">
        {/* CSS Grid Layout - 2 rows, 4 columns for mobile */}
        <div className="grid gap-2 p-4" style={{ 
          gridTemplateColumns: 'auto auto auto 1fr',
          gridTemplateRows: 'auto min-content'
        }}>
          {/* Row 1: Today button, Previous arrow, DatePicker, Next arrow, MenuPanel */}
          <div className="flex items-center justify-center">
            <button
              onClick={() => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                setSelectedDate(today);
              }}
              disabled={isLoading}
              className={`text-xs px-3 py-1.5 rounded-full backdrop-blur-md border shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer relative overflow-hidden ${
                isLoading
                  ? 'opacity-50 cursor-not-allowed bg-white/5 border-white/10 text-black'
                  : 'bg-white/5 border-white/10 text-black hover:backdrop-blur-sm dark:border-white/20 dark:text-black dark:hover:bg-white/25'
              }`}
              style={{ opacity: showHeader ? 1 : 0, pointerEvents: showHeader ? 'auto' : 'none' }}
              aria-label="Go to today"
            >
              {/* Glassmorphic shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/5 to-transparent rounded-full"></div>
              <div className="relative z-10 font-medium opacity-75">
                Today
              </div>
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
              className={`h-10 w-10 p-2 rounded-lg transition-all duration-200 flex items-center justify-center bg-gray-100/40 dark:bg-gray-700/40 backdrop-blur-sm border border-gray-300/30 dark:border-gray-600/30 shadow-lg hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] ${
                isLoading
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-gray-200/50 dark:hover:bg-gray-600/50 hover:scale-105 active:scale-95'
              }`}
              style={{ opacity: showHeader ? 1 : 0, pointerEvents: showHeader ? 'auto' : 'none' }}
              aria-label="Previous day"
            >
              <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
          
          {/* DatePicker - always visible */}
          <div className="flex items-center justify-center">
            <DatePickerComponent
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              isLoading={isLoading}
              onCalendarOpen={() => setIsModalOpen(true)}
              onCalendarClose={() => setIsModalOpen(false)}
            />
          </div>
          
          <div className="flex items-center justify-center">
            <button
              onClick={() => {
                const newDate = new Date(selectedDate);
                newDate.setDate(newDate.getDate()+1);
                newDate.setHours(0, 0, 0, 0);
                setSelectedDate(newDate);
              }}
              disabled={isLoading}
              className={`h-10 w-10 p-2 rounded-lg transition-all duration-200 flex items-center justify-center bg-gray-100/40 dark:bg-gray-700/40 backdrop-blur-sm border border-gray-300/30 dark:border-gray-600/30 shadow-lg hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] ${
                isLoading
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-gray-200/50 dark:hover:bg-gray-600/50 hover:scale-105 active:scale-95'
              }`}
              style={{ opacity: showHeader ? 1 : 0, pointerEvents: showHeader ? 'auto' : 'none' }}
              aria-label="Next day"
            >
              <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          
          {/* Row 2: MenuPanel, NotificationBell, QuarterCount */}
          <div className="flex items-center justify-center">
            <div style={{ opacity: showHeader ? 1 : 0, pointerEvents: showHeader ? 'auto' : 'none' }}>
              <MenuPanel selectedDate={selectedDate} events={events} onModalClose={() => setIsModalOpen(false)} onModalOpen={() => setIsModalOpen(true)} />
            </div>
          </div>
          
          <div className="flex items-center justify-center">
            <div style={{ opacity: showHeader ? 1 : 0, pointerEvents: showHeader ? 'auto' : 'none' }}>
              <NotificationBell />
            </div>
          </div>
          
          <div className="flex items-center justify-center">
            <div style={{ opacity: showHeader ? 1 : 0, pointerEvents: showHeader ? 'auto' : 'none' }} className="flex items-center justify-center h-full">
              <CurrentFilterLink onModalOpen={() => setIsModalOpen(true)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}