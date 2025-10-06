import React, { useState } from 'react';
import { Database } from '../../types/supabase';
import { getEventThemeColors, getEventThemeHexColors } from '../../utils/eventUtils';
import { useFacultySetup, useFacultySetups, useUpdateFacultySetupAttributesBySetupId } from './hooks/useFacultySetup';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { useCreateFacultySetup, useDeleteFacultySetup } from './hooks/useFacultySetup';
import { useUpdateFacultySetupDevicesBySetupId } from './hooks/useFacultySetup';
import { useUpdateFacultySetupNotesBySetupId } from './hooks/useFacultySetup';
import { Plus, Trash2, Laptop, Tablet, X, ChevronUp } from 'lucide-react';
import BYODOSSelector from './BYODOSSelector';
import PanelModal from './PanelModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFacultyByods } from './hooks/useFacultyByods';
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Item, ItemHeader, ItemContent, ItemTitle, ItemMedia, ItemActions } from "@/components/ui/item";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupControl,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { Switch } from "@/components/ui/switch";

type Event = Database['public']['Tables']['events']['Row'];
type FacultyMember = Database['public']['Tables']['faculty']['Row'];

interface SessionSetupsProps {
  event: Event;
  facultyMember: FacultyMember;
  primaryInstructorName: string;
}

export default function SessionSetups({
  event,
  facultyMember,
  primaryInstructorName
}: SessionSetupsProps) {
  
  
  // Get all setups for this faculty
  const { data: setups = [], isLoading: isLoadingSetup } = useFacultySetups(facultyMember?.id || 0);
  const [activeSetupId, setActiveSetupId] = useState<string | null>(null);
  const setup = setups.find(s => s.id === activeSetupId) ?? setups[0];
  console.log(setup);
  const updateFacultySetupAttributes = useUpdateFacultySetupAttributesBySetupId();
  const updateDevices = useUpdateFacultySetupDevicesBySetupId();
  const updateNotes = useUpdateFacultySetupNotesBySetupId();

  // Local panel modal state (moved here to avoid prop drilling)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPanel, setEditingPanel] = useState<'left' | 'right' | null>(null);

  // BYOD selection dialog state
  const [isByodDialogOpen, setIsByodDialogOpen] = useState(false);
  const [byodTarget, setByodTarget] = useState<'left' | 'right' | null>(null);
  const { data: byods = [] } = useFacultyByods(facultyMember?.id || 0);

  const handleSelectByod = (value: string) => {
    if (!setup?.id || !byodTarget) return;
    const byodId = Number(value);
    if (Number.isNaN(byodId)) {
      setIsByodDialogOpen(false);
      setByodTarget(null);
      return;
    }
    updateDevices.mutate({
      setupId: setup.id,
      leftDeviceId: byodTarget === 'left' ? byodId : undefined,
      rightDeviceId: byodTarget === 'right' ? byodId : undefined,
      facultyId: facultyMember?.id,
    }, {
      onSettled: () => {
        setIsByodDialogOpen(false);
        setByodTarget(null);
      }
    });
  };

  const renderByodIcon = (os?: string | null) => {
    const v = (os || '').toUpperCase();
    if (v === 'MAC' || v === 'PC') return <Laptop className="w-3.5 h-3.5" />;
    if (v === 'IPAD') return <Tablet className="w-3.5 h-3.5" />;
    return null;
  };

  // Notes editing state
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState<string>("");

  React.useEffect(() => {
    if (setup && !isEditingNotes) {
      setNotesDraft((setup.notes as any) ?? "");
    }
  }, [setup, isEditingNotes]);

  const panelOptions = [
    { id: 'ROOM_PC', label: 'Room PC', image: '/panel-images/ROOM_PC.png' },
    { id: 'DOC_CAM', label: 'Document Camera', image: '/panel-images/DOC_CAM.png' },
    { id: 'LAPTOP_1', label: 'Laptop 1', image: '/panel-images/LAPTOP_1.png' },
    { id: 'LAPTOP_2', label: 'Laptop 2', image: '/panel-images/LAPTOP_2.png' },
    { id: 'LAPTOP_3', label: 'Laptop 3', image: '/panel-images/LAPTOP_3.png' },
    { id: 'PC_EXT', label: 'PC Extension', image: '/panel-images/PC_EXT.png' },
  ];

  const openLocalPanelModal = (panel: 'left' | 'right') => {
    setEditingPanel(panel);
    setIsModalOpen(true);
  };

  const closeLocalModal = () => {
    setIsModalOpen(false);
    setEditingPanel(null);
  };

  const selectPanelImage = (imageId: string) => {
    if (!editingPanel || !facultyMember?.id) return;
    const current = setups.find(s => s.id === (activeSetupId ?? '')) ?? setups[0];
    if (!current) return;

    const updatedAttributes = {
      uses_mic: current.uses_mic ?? false,
      left_source: editingPanel === 'left' ? imageId : (current.left_source ?? ''),
      right_source: editingPanel === 'right' ? imageId : (current.right_source ?? ''),
    } as { uses_mic: boolean; left_source: string; right_source: string };

    updateFacultySetupAttributes.mutate({
      setupId: current.id,
      attributes: updatedAttributes,
      facultyId: facultyMember.id,
    });

    closeLocalModal();
  };
  
  // Scroll position preservation for each tab
  const [scrollPositions, setScrollPositions] = useState<Record<string, number>>({});
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!activeSetupId && setups.length > 0) setActiveSetupId(setups[0].id);
  }, [setups, activeSetupId]);
  
  // Handle tab change with scroll position preservation
  const handleTabChange = (newSetupId: string) => {
    // Save current scroll position
    if (activeSetupId && contentRef.current) {
      setScrollPositions(prev => ({
        ...prev,
        [activeSetupId]: contentRef.current?.scrollTop || 0
      }));
    }
    
    // Change to new tab
    setActiveSetupId(newSetupId);
  };
  
  // Restore scroll position when tab becomes active
  React.useEffect(() => {
    if (activeSetupId && contentRef.current && scrollPositions[activeSetupId] !== undefined) {
      contentRef.current.scrollTop = scrollPositions[activeSetupId];
    }
  }, [activeSetupId, scrollPositions]);

  // Create new setup state
  const [isCreating, setIsCreating] = useState(false);
  const createSetup = useCreateFacultySetup();
  const deleteSetup = useDeleteFacultySetup();
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<{ name: string }>({
    defaultValues: { name: '' }
  });
  const onCreate = (values: { name: string }) => {
    if (!facultyMember?.id) return;
    createSetup.mutate({ facultyId: facultyMember.id, name: values.name }, {
      onSuccess: (created) => {
        reset();
        setIsCreating(false);
        setActiveSetupId(created.id);
      }
    });
  };
  
  // Get theme colors based on event type
  const themeColors = getEventThemeColors(event);
  const themeHexColors = getEventThemeHexColors(event);

  // Check if either panel is a laptop (LAPTOP_1, LAPTOP_2, or LAPTOP_3)
  const isLaptopPanel = (panel: string | null) => {
    return panel === 'LAPTOP_1' || panel === 'LAPTOP_2' || panel === 'LAPTOP_3';
  };


  if (isLoadingSetup) {
    return (
      <div className="backdrop-blur-sm border border-white/10 dark:border-white/5 rounded-lg p-3 sm:p-4 shadow-lg" style={{ background: `linear-gradient(135deg, ${themeHexColors[1]}BB, ${themeHexColors[2]}99)` }}>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <Card className="p-0 overflow-hidden" >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-base sm:text-lg ">Setups</CardTitle>
            <CardDescription className="/70">Configure panels and options for this instructor</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {!isCreating ? (
              <Button size="icon" variant="default" onClick={() => setIsCreating(true)} title="Create setup">
                <Plus className="w-4 h-4" />
              </Button>
            ) : (
              <form onSubmit={handleSubmit(onCreate)} className="flex items-center gap-2">
                <Input placeholder="Setup name" {...register('name', { required: true })} className="h-9" />
                <Button type="submit" disabled={isSubmitting || createSetup.isPending} size="sm">Save</Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => { reset(); setIsCreating(false); }}>Cancel</Button>
              </form>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        {/* Tabs over setups (header + content must be children of Tabs) */}
        <Tabs value={activeSetupId ?? undefined} onValueChange={handleTabChange} className="w-full">
          <div className="flex items-center justify-between mb-3 gap-2">
            <TabsList className="flex gap-1">
              {setups.map((s) => (
                <div key={s.id} className="relative">
                  <TabsTrigger
                    value={s.id}
                    className={activeSetupId === s.id ? 'pr-8' : undefined}
                  >
                    {(s as any).name || `Setup ${new Date(s.created_at).toLocaleDateString()}`}
                  </TabsTrigger>
                  {activeSetupId === s.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                      title="Delete setup"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const current = setups.find(x => x.id === s.id);
                        if (!current) return;
                        if (!confirm('Delete this setup?')) return;
                        deleteSetup.mutate({ setupId: current.id }, {
                          onSuccess: () => {
                            const remaining = setups.filter(x => x.id !== current.id);
                            setActiveSetupId(remaining[0]?.id ?? null);
                          }
                        });
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </TabsList>
          </div>

          {/* Tab Content */}
          {setups.map((setup) => (
            <TabsContent key={setup.id} value={setup.id} className="mt-0">
              <div ref={contentRef} className="space-y-4 px-1 py-1 overflow-y-auto">
        {/* Panels */}
        <Item variant="outline" className="mt-6">
          <ItemHeader>
            <ItemTitle className="">Panels</ItemTitle>
          </ItemHeader>
          <ItemContent className="pt-2">
            <div className="flex gap-3 sm:gap-4">
            <div className="flex-1">
              <p className="text-xs sm:text-sm  mb-2">Left Panel</p>
              <Button
                onClick={() => openLocalPanelModal('left')}
                className="w-full h-24 sm:h-32 rounded-lg border border-white/10 dark:border-white/5 flex items-center justify-center transition-colors cursor-pointer backdrop-blur-sm shadow-lg hover:shadow-xl" 
                title="Click to change panel setup"
                variant="outline"
              >
                {setup?.left_source ? (
                  <img 
                    src={`/panel-images/${setup.left_source}.png`}
                    alt={`Left panel setup for ${primaryInstructorName}`}
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      console.error('Error loading left panel image:', setup.left_source, 'Full path:', `/panel-images/${setup.left_source}.png`);
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class=\"\">Failed to load: ${setup.left_source}.png</span>`;
                    }}
                  />
                ) : (
                  <span className="">No source</span>
                )}
              </Button>
              {setup?.left_source && setup.left_source !== 'DOC_CAM' ? (
                <>
                  <p className="text-xs  text-center mt-2 font-medium">
                    {setup.left_source.replace(/_/g, ' ')}
                  </p>
                  <div className="w-full relative mt-2 h-12">
                    <div className="absolute left-1/2 -translate-x-1/2 -top-2">
                      <ChevronUp className="w-4 h-4 " />
                    </div>
                    <div className="absolute left-1/2 -translate-x-1/2 h-12 border-l-2 border-dashed border-black/50"></div>
                    {setup?.left_device && (setup.left_source === 'ROOM_PC' || setup.left_source === 'PC_EXT') && (
                      <div className="absolute right-1/2 pr-2 top-1/2 -translate-y-1/2">
                        <span className="text-xs ">Mirroring 360</span>
                      </div>
                    )}
                  </div>
                  <div className="w-full flex justify-center mt-2">
                    {setup?.left_device ? (
                      <Badge className="cursor-default flex items-center gap-1 pr-1" variant="secondary" title={byods.find(b => b.id === setup.left_device)?.name || 'BYOD'}>
                        {renderByodIcon(byods.find(b => b.id === setup.left_device)?.os)}
                        <span>{byods.find(b => b.id === setup.left_device)?.name || 'BYOD'}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="ml-1 h-5 w-5 p-0 rounded hover:bg-black/10"
                          title="Remove device"
                          onClick={() => {
                            if (!setup?.id) return;
                            updateDevices.mutate({ setupId: setup.id, leftDeviceId: null, facultyId: facultyMember?.id });
                          }}
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </Badge>
                    ) : (
                      <Button
                        type="button"
                        aria-label="Select BYOD for left panel"
                        onClick={() => { setByodTarget('left'); setIsByodDialogOpen(true); }}
                        variant="outline"
                        size="icon"
                        className="w-8 h-8 rounded-full border-2 border-dashed border-black/50 /70 hover:bg-black/5 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-xs  text-center mt-2 font-medium">
                  {setup?.left_source ? setup.left_source.replace(/_/g, ' ') : 'No source'}
                </p>
              )}
            </div>

            <div className="flex-1">
              <p className="text-xs sm:text-sm  mb-2">Right Panel</p>
              <Button
                onClick={() => openLocalPanelModal('right')}
                className="w-full h-24 sm:h-32 rounded-lg border border-white/10 dark:border-white/5 flex items-center justify-center transition-colors cursor-pointer backdrop-blur-sm shadow-lg hover:shadow-xl"
                title="Click to change panel setup"
                variant="outline"
              >
                {setup?.right_source ? (
                  <img 
                    src={`/panel-images/${setup.right_source}.png`}
                    alt={`Right panel setup for ${primaryInstructorName}`}
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      console.error('Error loading right panel image:', setup.right_source, 'Full path:', `/panel-images/${setup.right_source}.png`);
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class=\"\">Failed to load: ${setup.right_source}.png</span>`;
                    }}
                  />
                ) : (
                  <span className="">No source</span>
                )}
              </Button>
              {setup?.right_source && setup.right_source !== 'DOC_CAM' ? (
                <>
                  <p className="text-xs  text-center mt-2 font-medium">
                    {setup.right_source.replace(/_/g, ' ')}
                  </p>
                  <div className="w-full relative mt-2 h-12">
                    <div className="absolute left-1/2 -translate-x-1/2 -top-2">
                      <ChevronUp className="w-4 h-4 " />
                    </div>
                    <div className="absolute left-1/2 -translate-x-1/2 h-12 border-l-2 border-dashed border-black/50"></div>
                    {setup?.right_device && (setup.right_source === 'ROOM_PC' || setup.right_source === 'PC_EXT') && (
                      <div className="absolute right-1/2 pr-2 top-1/2 -translate-y-1/2">
                        <span className="text-xs ">Mirroring 360</span>
                      </div>
                    )}
                  </div>
                  <div className="w-full flex justify-center mt-2">
                    {setup?.right_device ? (
                      <Badge className="cursor-default flex items-center gap-1 pr-1" variant="secondary" title={byods.find(b => b.id === setup.right_device)?.name || 'BYOD'}>
                        {renderByodIcon(byods.find(b => b.id === setup.right_device)?.os)}
                        <span>{byods.find(b => b.id === setup.right_device)?.name || 'BYOD'}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="ml-1 h-5 w-5 p-0 rounded hover:bg-black/10"
                          title="Remove device"
                          onClick={() => {
                            if (!setup?.id) return;
                            updateDevices.mutate({ setupId: setup.id, rightDeviceId: null, facultyId: facultyMember?.id });
                          }}
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </Badge>
                    ) : (
                      <Button
                        type="button"
                        aria-label="Select BYOD for right panel"
                        onClick={() => { setByodTarget('right'); setIsByodDialogOpen(true); }}
                        variant="outline"
                        size="icon"
                        className="w-8 h-8 rounded-full border-2 border-dashed border-black/50 /70 hover:bg-black/5 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-xs  text-center mt-2 font-medium">
                  {setup?.right_source ? setup.right_source.replace(/_/g, ' ') : 'No source'}
                </p>
              )}
            </div>
            </div>
          </ItemContent>
        </Item>
        
        {/* Uses Microphone */}
        <Item variant="outline" className="items-center">
          <ItemMedia variant="image">
            <img src="/lapel.png" alt="Lapel microphone" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle className="">Uses Microphone</ItemTitle>
          </ItemContent>
          <ItemActions>
            <Switch
              checked={Boolean(setup?.uses_mic)}
              onCheckedChange={(checked) => {
                if (updateFacultySetupAttributes.isPending || !setup) return;
                updateFacultySetupAttributes.mutate({
                  setupId: setup.id,
                  attributes: {
                    uses_mic: Boolean(checked),
                    left_source: setup.left_source ?? '',
                    right_source: setup.right_source ?? ''
                  },
                  facultyId: facultyMember.id,
                });
              }}
              disabled={updateFacultySetupAttributes.isPending || isLoadingSetup}
              aria-label="Toggle microphone usage"
            />
          </ItemActions>
        </Item>

        {/* Notes */}
        <div className="mt-6">
          <h4 className="text-base sm:text-lg font-medium  mb-3">Notes</h4>
          {!isEditingNotes ? (
            <InputGroup>
              <InputGroupControl multiline className="text-sm  whitespace-pre-wrap min-h-8 bg-white/20 dark:bg-black/10">
                {setup?.notes ? String(setup.notes) : <span className="/60">No notes</span>}
              </InputGroupControl>
              <InputGroupAddon align="inline-end">
                <InputGroupButton size="xs" variant="outline" onClick={() => setIsEditingNotes(true)}>
                  Edit
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          ) : (
            <InputGroup className=''>
              <InputGroupAddon align="block-start" >
                <InputGroupText className="">Editing notes</InputGroupText>
              </InputGroupAddon>
              <InputGroupTextarea
                className="min-h-[120px]"
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                placeholder="Enter notes for this setup"
              />
              <InputGroupAddon align="block-end" className="">
                <InputGroupButton
                 variant="default"
                  size="sm"
                  onClick={() => {
                    if (!setup?.id) return;
                    updateNotes.mutate(
                      { setupId: setup.id, notes: notesDraft, facultyId: facultyMember?.id },
                      {
                        onSuccess: () => setIsEditingNotes(false),
                        onError: () => setIsEditingNotes(false),
                      }
                    );
                  }}
                  disabled={updateNotes.isPending}
                >
                  Save
                </InputGroupButton>
                <InputGroupButton
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsEditingNotes(false);
                    setNotesDraft(String(setup?.notes ?? ''));
                  }}
                >
                  Cancel
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          )}
        </div>

            </div>
          </TabsContent>
        ))}
      </Tabs>
      </CardContent>

      <CardFooter className="justify-between pt-0">
        <div className="text-xs /70">
          {setup?.updated_at ? `Last updated: ${new Date(setup.updated_at).toLocaleString()}` : 'Never updated'}
        </div>
      </CardFooter>
      {/* Panel Selection Modal (scoped to this component) */}
      <PanelModal
        isModalOpen={isModalOpen}
        editingPanel={editingPanel}
        panelOptions={panelOptions}
        onClose={closeLocalModal}
        onSelectPanel={selectPanelImage}
      />
      {/* BYOD Selection Dialog */}
      <Dialog open={isByodDialogOpen} onOpenChange={setIsByodDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {byodTarget === 'left' ? 'Select BYOD for Left Panel' : byodTarget === 'right' ? 'Select BYOD for Right Panel' : 'Select BYOD Device'}
            </DialogTitle>
          </DialogHeader>
          <div>
            <Select onValueChange={handleSelectByod}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={byods.length ? 'Choose a device' : 'No BYOD devices available'} />
              </SelectTrigger>
              {(
                <SelectContent>
                  {byods.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      {(d.name || 'Unnamed Device') + (d.os ? ` (${d.os})` : '')}
                    </SelectItem>
                  ))}
                </SelectContent>
              )}
            </Select>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
