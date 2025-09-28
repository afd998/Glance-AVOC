import React from 'react';
import { useUserProfiles } from '../hooks/useUserProfiles';
import Avatar from './Avatar';

interface UserSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (userId: string) => void;
  title: string;
}

export default function UserSelectionModal({ 
  isOpen, 
  onClose, 
  onSelectUser, 
  title 
}: UserSelectionModalProps) {
  const { profiles, isLoading } = useUserProfiles();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-4">Loading users...</div>
            ) : profiles && profiles.length > 0 ? (
              profiles.map((profile) => (
                <button
                  key={profile.id}
                  onClick={() => {
                    onSelectUser(profile.id);
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Avatar userId={profile.id} size="sm" />
                  <div className="text-left">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {profile.name || profile.id}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                No users found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 