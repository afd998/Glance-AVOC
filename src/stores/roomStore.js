import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useRoomStore = create(
  persist(
    (set, get) => ({
      // State
      selectedRooms: [],
      allRooms: [],
      notificationRooms: [], // Separate rooms for notifications
      
      // Actions
      setAllRooms: (rooms) => set({ allRooms: rooms }),
      
      setSelectedRooms: (rooms) => {
        
        set({ selectedRooms: rooms });
      },
      
      addRoom: (room) => {
        const { selectedRooms } = get();
        if (!selectedRooms.includes(room)) {
          
          set({ selectedRooms: [...selectedRooms, room] });
        }
      },
      
      removeRoom: (room) => {
        const { selectedRooms } = get();
        
        set({ selectedRooms: selectedRooms.filter(r => r !== room) });
      },
      
      toggleRoom: (room) => {
        const { selectedRooms } = get();
        
        
        
        
        if (selectedRooms.includes(room)) {
          
          get().removeRoom(room);
        } else {
          
          get().addRoom(room);
        }
        
        
      },
      
      selectAllRooms: () => {
        const { allRooms } = get();
        
        set({ selectedRooms: [...allRooms] });
      },
      
      clearAllRooms: () => {
        
        set({ selectedRooms: [] });
      },
      
      // Notification room actions
      setNotificationRooms: (rooms) => {
        
        set({ notificationRooms: rooms });
      },
      
      addNotificationRoom: (room) => {
        const { notificationRooms } = get();
        if (!notificationRooms.includes(room)) {
          
          set({ notificationRooms: [...notificationRooms, room] });
        }
      },
      
      removeNotificationRoom: (room) => {
        const { notificationRooms } = get();
        
        set({ notificationRooms: notificationRooms.filter(r => r !== room) });
      },
      
      toggleNotificationRoom: (room) => {
        const { notificationRooms } = get();
        
        
        if (notificationRooms.includes(room)) {
          
          get().removeNotificationRoom(room);
        } else {
          
          get().addNotificationRoom(room);
        }
      },
      
      selectAllNotificationRooms: () => {
        const { allRooms } = get();
        
        set({ notificationRooms: [...allRooms] });
      },
      
      clearAllNotificationRooms: () => {
        
        set({ notificationRooms: [] });
      },
      
      // Computed
      getSelectedRoomsCount: () => get().selectedRooms.length,
      getTotalRoomsCount: () => get().allRooms.length,
      getNotificationRoomsCount: () => get().notificationRooms.length,
    }),
    {
      name: 'room-store', // unique name for localStorage key
      partialize: (state) => ({ 
        selectedRooms: state.selectedRooms,
        notificationRooms: state.notificationRooms 
      }), // only persist these fields
    }
  )
);

export default useRoomStore; 
