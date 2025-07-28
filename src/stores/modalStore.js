import { create } from 'zustand';

const useModalStore = create((set) => ({
  // Filter rooms modal state
  isFilterRoomsModalOpen: false,
  
  // Actions
  openFilterRoomsModal: () => set({ isFilterRoomsModalOpen: true }),
  closeFilterRoomsModal: () => set({ isFilterRoomsModalOpen: false }),
}));

export default useModalStore; 