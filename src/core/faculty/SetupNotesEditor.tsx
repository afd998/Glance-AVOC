import React, { useState } from 'react';
import { Database } from '../../types/supabase';
import { useFacultyUpdates, useCreateFacultyUpdate, useUpdateFacultyUpdate, useDeleteFacultyUpdate } from './hooks/useFacultyUpdates';
import { useAuth } from '../../contexts/AuthContext';
import { getEventThemeColors } from '../../utils/eventUtils';
import { UserAvatar } from '../../components/ui/avatar';

type Event = Database['public']['Tables']['events']['Row'];
type FacultyMember = Database['public']['Tables']['faculty']['Row'];

interface SetupNotesEditorProps {
  event: Event;
  facultyMember: FacultyMember | null | undefined;
}

export default function SetupNotesEditor({ event, facultyMember }: SetupNotesEditorProps) {
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingUpdateId, setEditingUpdateId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const { user } = useAuth();
  
  // Get theme colors based on event type
  const themeColors = getEventThemeColors(event);

  // Fetch faculty updates if we have a faculty member
  const { data: facultyUpdates, isLoading } = useFacultyUpdates(facultyMember?.id || 0);
  const createFacultyUpdate = useCreateFacultyUpdate();
  const updateFacultyUpdate = useUpdateFacultyUpdate();
  const deleteFacultyUpdate = useDeleteFacultyUpdate();

  const handleAddNote = async () => {
    if (!facultyMember?.id || !newNote.trim()) {
      console.log('Missing faculty ID or note content:', { facultyId: facultyMember?.id, noteContent: newNote });
      return;
    }
    
    console.log('Attempting to create faculty update:', { facultyId: facultyMember.id, content: newNote.trim() });
    
    try {
      await createFacultyUpdate.mutateAsync({
        facultyId: facultyMember.id,
        content: newNote.trim()
      });
      setNewNote('');
      setIsAddingNote(false);
    } catch (error) {
      console.error('Error adding faculty update:', error);
    }
  };

  const handleCancel = () => {
    setNewNote('');
    setIsAddingNote(false);
  };

  const handleEditNote = (update: any) => {
    setEditingUpdateId(update.id);
    setEditingContent(update.content);
  };

  const handleSaveEdit = async () => {
    if (!editingUpdateId || !editingContent.trim()) return;
    
    try {
      await updateFacultyUpdate.mutateAsync({
        updateId: editingUpdateId,
        content: editingContent.trim()
      });
      setEditingUpdateId(null);
      setEditingContent('');
    } catch (error) {
      console.error('Error updating faculty update:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingUpdateId(null);
    setEditingContent('');
  };

  const handleDeleteNote = async (updateId: number) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    
    try {
      await deleteFacultyUpdate.mutateAsync({ updateId });
    } catch (error) {
      console.error('Error deleting faculty update:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!facultyMember) {
    return (
      <div className={`${themeColors[3]} rounded-lg shadow-lg p-6`}>
        <h3 className="text-xl font-semibold text-black mb-4">Setup History</h3>
        <p className="text-black opacity-70">No faculty member assigned to this session.</p>
      </div>
    );
  }

  return (
    <div className={`${themeColors[3]} rounded-lg shadow-lg p-2`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-black">Setup History</h3>
        {!isAddingNote && (
          <button
            onClick={() => setIsAddingNote(true)}
            className={`p-2 border-2 ${themeColors[6]} ${themeColors.text10} rounded-full hover:${themeColors[8]} hover:${themeColors.text1} transition-all duration-200 hover:scale-105`}
            title="Add note"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}
      </div>

      {/* Add New Note Form */}
      {isAddingNote && (
        <div className={`mb-6 p-4 ${themeColors[4]} rounded-lg border`}>
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Enter a new setup note..."
            className={`w-full h-24 p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${themeColors[3]} text-black mb-3`}
          />
          <div className="flex gap-2">
            <button
              onClick={handleAddNote}
              disabled={!newNote.trim() || createFacultyUpdate.isPending}
              className={`px-3 py-1.5 ${themeColors[8]} ${themeColors.text1} text-sm rounded-md hover:${themeColors[6]} transition-colors disabled:opacity-50 font-medium`}
            >
              {createFacultyUpdate.isPending ? 'Adding...' : 'Add Note'}
            </button>
            <button
              onClick={handleCancel}
              disabled={createFacultyUpdate.isPending}
              className={`px-3 py-1.5 ${themeColors[7]} ${themeColors.text10} text-sm rounded-md hover:${themeColors[6]} transition-colors disabled:opacity-50 font-medium`}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Faculty Updates List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-black opacity-70 mt-2">Loading notes...</p>
          </div>
        ) : facultyUpdates && facultyUpdates.length > 0 ? (
          facultyUpdates.map((update) => (
            <div 
              key={update.id} 
              className={`p-4 ${themeColors[4]} rounded-lg border`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  {update.author ? (
                    <UserAvatar userId={update.author} size="sm" />
                  ) : (
                    <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs font-medium">
                      ?
                    </div>
                  )}
                  <span className="text-xs text-black opacity-70">
                    {formatDate(update.created_at)}
                  </span>
                </div>
                {update.author && update.author === user?.id && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditNote(update)}
                      className={`p-1 ${themeColors.text10} hover:text-blue-600 transition-colors`}
                      title="Edit note"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteNote(update.id)}
                      className={`p-1 ${themeColors.text10} hover:text-red-600 transition-colors`}
                      title="Delete note"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              {editingUpdateId === update.id ? (
                <div className="space-y-3">
                  <textarea
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    className={`w-full h-24 p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${themeColors[3]} text-black`}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveEdit}
                      disabled={!editingContent.trim() || updateFacultyUpdate.isPending}
                      className={`px-3 py-1 ${themeColors[8]} ${themeColors.text1} text-sm rounded hover:${themeColors[6]} transition-colors disabled:opacity-50`}
                    >
                      {updateFacultyUpdate.isPending ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      disabled={updateFacultyUpdate.isPending}
                      className={`px-3 py-1 ${themeColors[7]} ${themeColors.text10} text-sm rounded hover:${themeColors[6]} transition-colors disabled:opacity-50`}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
                <p className="text-black whitespace-pre-wrap">
                  {update.content}
                </p>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-black opacity-70 italic">No setup notes available.</p>
            <p className="text-sm text-black opacity-50 mt-1">
              Click "Add Note" to create the first note for this faculty member.
            </p>
          </div>
          )}
        </div>
    </div>
  );
} 