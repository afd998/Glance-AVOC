import React, { useState, useEffect } from 'react';
import FilterRoomsModal from '../features/Schedule/components/FilterRoomsModal';
import useModalStore from '../stores/modalStore';
import { Database } from '../types/supabase';
import { Button } from './ui/button';
import { Menu as MenuIcon } from 'lucide-react';

interface MenuPanelProps {
  selectedDate?: Date;
  events?: Database['public']['Tables']['events']['Row'][] | undefined;
  onModalClose?: () => void;
  onModalOpen?: () => void;
}

const MenuPanel: React.FC<MenuPanelProps> = ({ selectedDate = new Date(), events = [], onModalClose, onModalOpen }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const { isFilterRoomsModalOpen, closeFilterRoomsModal } = useModalStore();
  


  // Handle menu open animation
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure the element is rendered before animation starts
      const timer = setTimeout(() => setIsAnimating(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
    }
  }, [isOpen]);

  return (
    <>
      {/* Modern Menu Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          variant="ghost"
         
          aria-label="Open menu"
        >
          <MenuIcon className="w-5 h-5" />
        </Button>
      )}
      {/* Menu Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/25 z-9998 animate-in fade-in duration-300"
            onClick={() => {
              setIsAnimating(false);
              setTimeout(() => setIsOpen(false), 150);
            }}
          />
          {/* Menu Panel */}
          <div 
            style={{
              zIndex: 9999,
              transform: isAnimating ? 'translateX(0) scale(1)' : 'translateX(100%) scale(0.95)',
              transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              transformOrigin: 'right center'
            }} 
            className="fixed top-0 right-0 h-screen w-80"
          >
            <div className="p-6 h-full flex flex-col">
              {/* Header */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Menu</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  All navigation options have been moved to the sidebar for better organization.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Filter Rooms Modal */}
      <FilterRoomsModal
        isOpen={isFilterRoomsModalOpen}
        onClose={() => {
          closeFilterRoomsModal();
          onModalClose?.();
        }}
      />
    </>
  );
};

export default MenuPanel; 