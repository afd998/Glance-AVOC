import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';

interface PanelOption {
  id: string;
  label: string;
  image: string;
}

interface PanelModalProps {
  isModalOpen: boolean;
  editingPanel: 'left' | 'right' | null;
  panelOptions: PanelOption[];
  onClose: () => void;
  onSelectPanel: (imageId: string) => void;
}

export default function PanelModal({ 
  isModalOpen, 
  editingPanel, 
  panelOptions, 
  onClose, 
  onSelectPanel 
}: PanelModalProps) {
  return (
    <Dialog open={isModalOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Select {editingPanel === 'left' ? 'Left' : 'Right'} Panel Setup
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {panelOptions.map((option) => (
            <Button
              key={option.id}
              variant="outline"
              onClick={() => onSelectPanel(option.id)}
              className="flex flex-col items-center p-4 h-auto rounded-lg hover:bg-accent/50 dark:hover:bg-accent/30 transition-colors"
            >
              <img 
                src={option.image} 
                alt={option.label}
                className="w-16 h-16 object-contain mb-2"
              />
              <span className="text-sm font-medium text-center">
                {option.label}
              </span>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
} 