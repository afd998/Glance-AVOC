import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useBackground } from './useBackground';

import { Switch } from '../../components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';

interface BackgroundSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BackgroundSelectorModal: React.FC<BackgroundSelectorModalProps> = ({
  isOpen,
  onClose
}) => {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { currentBackground, setCurrentBackground, isUpdating } = useBackground();

  const backgroundOptions = [
    {
      id: 'none',
      name: 'No Image',
      preview: null, // Use default shadcn theme background
      description: 'Use default theme background (light/dark)'
    },
    {
      id: 'AVOC.JPEG',
      name: 'AVOC',
      preview: '/AVOC.JPEG',
      description: 'AVOC building background'
    },
    {
      id: 'Gies.avif',
      name: 'Gies',
      preview: '/Gies.avif',
      description: 'Gies College of Business background'
    },
    {
      id: 'dusk.jpg',
      name: 'Dusk',
      preview: '/dusk.jpg',
      description: 'Dusk background with optional rain effect'
    },
    {
      id: 'Vista.avif',
      name: 'Vista',
      preview: '/Vista.avif',
      description: 'Vista background'
    },
    {
      id: 'halloween.png',
      name: 'Halloween',
      preview: '/halloween.png',
      description: 'Halloween themed background'
    },
    {
      id: 'Ryan Fieldhouse.jpg',
      name: 'Ryan Fieldhouse',
      preview: '/Ryan Fieldhouse.jpg',
      description: 'Northwestern University Ryan Fieldhouse background'
    },
    {
      id: 'jaobscenter.jpeg',
      name: 'Jacobs Center',
      preview: '/jaobscenter.jpeg',
      description: 'Jacobs Center background'
    },
    {
      id: 'offwhite',
      name: 'Off White',
      preview: null, // No image preview for CSS background
      description: 'Clean off-white CSS background'
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md w-full max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Theme Settings</DialogTitle>
        </DialogHeader>

        {/* Content */}
        <div className="space-y-4">
          {/* Manual Light/Dark Toggle */}
          <div className="p-3 rounded-xl border bg-muted/50">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Dark Mode</div>
                <div className="text-xs text-muted-foreground">Manually set theme appearance</div>
              </div>
              <Switch checked={isDarkMode} onCheckedChange={toggleDarkMode} />
            </div>
          </div>

          <div>
            <h3 className="text-md font-medium mb-3">Theme</h3>
            <div className="grid grid-cols-2 gap-4 max-h-80 overflow-y-auto">
            {backgroundOptions.map((option) => (
              <div key={option.id}>
                <div
                  className={`relative cursor-pointer rounded-xl border-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${
                    currentBackground === option.id
                      ? 'border-primary bg-primary/10 shadow-primary/20 shadow-lg'
                      : 'border-border hover:border-border/70 bg-card hover:bg-accent/50'
                  }`}
                  onClick={() => {
                    setCurrentBackground(option.id);
                  }}
                >
                  {/* Preview Image */}
                  <div className="relative h-24 rounded-t-xl overflow-hidden">
                    {option.preview ? (
                      <>
                        <img
                          src={option.preview}
                          alt={option.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                        {/* Fallback if image fails to load */}
                        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 hidden">
                          <span className="text-xs opacity-60">Preview</span>
                        </div>
                      </>
                    ) : (
                      /* CSS Background Preview */
                      <div 
                        className="w-full h-full flex items-center justify-center bg-muted"
                      >
                        <div className="text-center">
                          <div className="text-lg font-medium text-muted-foreground mb-1">CSS</div>
                          <div className="text-xs text-muted-foreground">Background</div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Option Info */}
                  <div className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate">{option.name}</h3>
                        <p className="text-xs text-muted-foreground truncate">
                          {option.description}
                        </p>
                      </div>
                      {currentBackground === option.id && (
                        <div className="flex items-center justify-center w-5 h-5 bg-primary rounded-full shadow-lg shadow-primary/50 ml-2 shrink-0">
                          <svg className="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

          

                
             
              </div>
            ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 rounded-xl font-medium transition-all duration-200 hover:scale-[1.02] hover:shadow-lg bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Done
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BackgroundSelectorModal;
