import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import PresetManager from './PresetManager';

interface FilterRoomsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FilterRoomsModal: React.FC<FilterRoomsModalProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="">
            Filter Events
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <PresetManager />
        </div>
        
        <DialogFooter>
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FilterRoomsModal; 