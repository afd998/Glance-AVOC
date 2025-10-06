import React, { useState } from 'react';
import { useProfile } from '../../../core/User/useProfile';
import { useFilters, Filter } from '../hooks/useFilters';
import {
  Item,
  ItemGroup,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemMedia,
  ItemActions,
  ItemSeparator,
} from '../../../components/ui/item';
import { Switch } from '../../../components/ui/switch';
import { Label } from '../../../components/ui/label';
import { Check, Loader2 } from 'lucide-react';

const PresetManager: React.FC = () => {
  const { 
    currentFilter,
    updateCurrentFilter,
    autoHide,
    updateAutoHide
  } = useProfile();
  
  const { 
    filters,
 

    isLoading: loading,
    loadFilter,

    isLoadingFilter
  } = useFilters();
  
  // Track which filter is being loaded
  const [loadingFilterName, setLoadingFilterName] = useState<string | null>(null);

  const handleLoadFilter = async (filter: Filter) => {
    console.log('Starting to load filter:', filter.name);
    setLoadingFilterName(filter.name);
    try {
      // Add a minimum loading time to make spinner visible
      const [result] = await Promise.all([
        loadFilter(filter),
        new Promise(resolve => setTimeout(resolve, 500)) // Minimum 500ms loading time
      ]);
      
      // Turn off auto-hide if the selected filter is not "All Rooms"
      if (filter.name?.toLowerCase() !== 'all rooms' && autoHide) {
        updateAutoHide(false);
      }
      
      console.log('Filter loaded successfully:', filter.name);
    } catch (error) {
      console.error('Failed to load filter:', error);
    } finally {
      setLoadingFilterName(null);
      console.log('Loading state cleared for:', filter.name);
    }
  };



  const handleLoadMyEvents = async () => {
    console.log('Starting to load My Events filter');
    setLoadingFilterName('My Events');
    try {
      // Add a minimum loading time to make spinner visible
      const [result] = await Promise.all([
        updateCurrentFilter('My Events'),
        new Promise(resolve => setTimeout(resolve, 500)) // Minimum 500ms loading time
      ]);
      
      // Turn off auto-hide when "My Events" is selected
      if (autoHide) {
        updateAutoHide(false);
      }
      
      console.log('My Events filter loaded successfully');
    } catch (error) {
      console.error('Failed to set My Events filter:', error);
    } finally {
      setLoadingFilterName(null);
      console.log('Loading state cleared for My Events');
    }
  };

  // Debug logging
  console.log('PresetManager render - loadingFilterName:', loadingFilterName, 'currentFilter:', currentFilter);

  return (
    <div className="space-y-4">
      <ItemGroup className="max-h-80 overflow-y-auto">
        {/* My Events - Special built-in filter */}
        <Item 
          asChild
          className={`cursor-pointer transition-all duration-200 ${
            (loadingFilterName === 'My Events') || (!loadingFilterName && currentFilter === 'My Events')
              ? 'bg-primary/10 border-primary/20'
              : 'hover:bg-accent/50'
          } ${loadingFilterName ? 'opacity-75' : ''}`}
        >
          <button
            onClick={() => !loadingFilterName && handleLoadMyEvents()}
            disabled={!!loadingFilterName}
            className="w-full text-left"
          >
            <ItemMedia>
              {(loadingFilterName === 'My Events') || (!loadingFilterName && currentFilter === 'My Events') ? (
                loadingFilterName === 'My Events' ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : (
                  <Check className="h-4 w-4 text-primary" />
                )
              ) : null}
            </ItemMedia>
            <ItemContent>
              <ItemTitle className={
                (loadingFilterName === 'My Events') || (!loadingFilterName && currentFilter === 'My Events')
                  ? 'text-primary' 
                  : ''
              }>
                My Events
              </ItemTitle>
              <ItemDescription className={
                (loadingFilterName === 'My Events') || (!loadingFilterName && currentFilter === 'My Events')
                  ? 'text-primary/70' 
                  : ''
              }>
                Show only events assigned to me
              </ItemDescription>
            </ItemContent>
          </button>
        </Item>

        {loading ? (
          <Item className="justify-center">
            <ItemContent>
              <div className="flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Loading filters...</span>
              </div>
            </ItemContent>
          </Item>
        ) : filters.length === 0 ? (
          <Item className="justify-center">
            <ItemContent>
              <span className="text-sm text-muted-foreground">No filters saved yet</span>
            </ItemContent>
          </Item>
        ) : (
          filters.map((filter, index) => {
            const isCurrentFilter = currentFilter === filter.name;
            const isLoadingThisFilter = loadingFilterName === filter.name;
            const isSelected = isLoadingThisFilter || (!loadingFilterName && isCurrentFilter);
            
            return (
              <React.Fragment key={filter.id}>
                {index > 0 && <ItemSeparator />}
                <Item 
                  asChild
                  className={`cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'bg-primary/10 border-primary/20'
                      : 'hover:bg-accent/50'
                  } ${loadingFilterName ? 'opacity-75' : ''}`}
                >
                  <button
                    onClick={() => !loadingFilterName && handleLoadFilter(filter)}
                    disabled={!!loadingFilterName}
                    className="w-full text-left"
                  >
                    <ItemMedia>
                      {isSelected ? (
                        isLoadingThisFilter ? (
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        ) : (
                          <Check className="h-4 w-4 text-primary" />
                        )
                      ) : null}
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle className={isSelected ? 'text-primary' : ''}>
                        {filter.name}
                        {filter.isDefault && (
                          <span className="ml-2 text-xs text-muted-foreground">(Default)</span>
                        )}
                      </ItemTitle>
                      <ItemDescription className={isSelected ? 'text-primary/70' : ''}>
                        {filter.display.length} rooms
                      </ItemDescription>
                    </ItemContent>
                    
                    {/* Auto-hide toggle for All Rooms */}
                    {filter.name?.toLowerCase() === 'all rooms' && (
                      <ItemActions>
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`auto-hide-${filter.id}`} className="text-xs">
                            Hide empty
                          </Label>
                          <Switch
                            id={`auto-hide-${filter.id}`}
                            checked={autoHide}
                            onCheckedChange={updateAutoHide}
                            disabled={!isSelected}
                            size="sm"
                          />
                        </div>
                      </ItemActions>
                    )}
                  </button>
                </Item>
              </React.Fragment>
            );
          })
        )}
      </ItemGroup>

      {/* Loading indicator */}
      {loadingFilterName && (
        <div className="flex items-center justify-center py-2">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          <span className="text-sm text-muted-foreground">
            Loading {loadingFilterName}...
          </span>
        </div>
      )}
    </div>
  );
};

export default PresetManager; 