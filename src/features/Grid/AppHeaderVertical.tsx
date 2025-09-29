import React, { useState, useEffect } from 'react';
import DatePickerComponent from './DatePickerComponent';
import DatePickerVertical from './DatePickerVertical';
import AcademicCalendarInfo from './AcademicCalendarInfo';
import CurrentFilterLinkVertical from './CurrentFilterLinkVertical';
import FilterRoomsModal from '../MenuPanel/FilterRoomsModal';
import QuarterCountVertical from './QuarterCountVertical';
import useModalStore from '../../stores/modalStore';
import { Database } from '../../types/supabase';

type Event = Database['public']['Tables']['events']['Row'];

interface AppHeaderVerticalProps {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  isLoading: boolean;
  events: Event[] | undefined;
  isDragging?: boolean;
  onHoverChange?: (isHovered: boolean) => void; // Callback for hover state changes
}

export default function AppHeaderVertical({ 
  selectedDate, 
  setSelectedDate, 
  isLoading, 
  events,
  isDragging = false,
  onHoverChange
}: AppHeaderVerticalProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isFilterRoomsModalOpen, closeFilterRoomsModal } = useModalStore();

  return (
    <div
      className=" "
    >
      {/* Vertical Layout - Stack components vertically */}
      <div className="flex flex-col items-center justify-start h-full p-2 gap-2">
        {/* AVOC HOME Button */}
        <div className="flex items-center justify-center">
          <button
            onClick={() => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              setSelectedDate(today);
            }}
            disabled={isLoading}
            className={`h-12 w-12 p-4 rounded-full transition-all duration-200 flex flex-col items-center justify-center backdrop-blur-sm border border-purple-400/50 shadow-lg hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] ${
              isLoading
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:scale-105 active:scale-95'
            }`}
            style={{
              backgroundColor: 'rgba(133, 118, 163, 1.0)',
              borderColor: 'rgba(133, 118, 163, 0.8)'
            }}
            aria-label="Go to today"
          >
            <span className="text-sm text-white text-center leading-tight font-medium">
              AVOC
            </span>
            <span className="text-[10px] text-white text-center leading-tight font-medium">
              HOME
            </span>
          </button>
        </div>

        {/* Previous Day Button */}
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
            aria-label="Previous day"
          >
            <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* DatePicker - vertical orientation */}
        <div className="flex items-center justify-center">
          <DatePickerVertical
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            isLoading={isLoading}
            onCalendarOpen={() => setIsModalOpen(true)}
            onCalendarClose={() => setIsModalOpen(false)}
          />
        </div>

        {/* Next Day Button */}
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
            aria-label="Next day"
          >
            <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Academic Calendar Info */}
        <div className="flex items-center justify-center">
          <div className="flex items-center justify-center h-full">
            <AcademicCalendarInfo />
          </div>
        </div>

        {/* Quarter Count */}
        <div className="flex items-center justify-center">
          <div className="flex items-center justify-center h-full">
            <QuarterCountVertical />
          </div>
        </div>

        {/* Current Filter Link */}
        <div className="flex items-center justify-center">
          <div className="flex items-center justify-center h-full">
            <CurrentFilterLinkVertical onModalOpen={() => setIsModalOpen(true)} />
          </div>
        </div>

      </div>
      
      {/* Filter Rooms Modal */}
      <FilterRoomsModal
        isOpen={isFilterRoomsModalOpen}
        onClose={() => {
          closeFilterRoomsModal();
          setIsModalOpen(false);
        }}
      />
    </div>
  );
}
