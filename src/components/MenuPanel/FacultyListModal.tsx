import React, { useEffect, useState } from 'react';
import { useAllFaculty } from '../../hooks/useFaculty';
import { useTheme } from '../../contexts/ThemeContext';
import { Database } from '../../types/supabase';
import Fuse, { IFuseOptions } from 'fuse.js';
import { useNavigate, useParams } from 'react-router-dom';

interface FacultyListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FacultyMember = Database['public']['Tables']['faculty']['Row'];

const FUSE_OPTIONS: IFuseOptions<FacultyMember> = {
  keys: [
    { name: 'kelloggdirectory_name', weight: 0.6 },
    { name: 'kelloggdirectory_title', weight: 0.2 },
    { name: 'kelloggdirectory_subtitle', weight: 0.1 },
    { name: 'kelloggdirectory_bio', weight: 0.1 },
    { name: 'twentyfivelive_name', weight: 0.2 },
  ],
  threshold: 0.4,
  includeScore: true,
  minMatchCharLength: 2,
  ignoreLocation: true,
};

const FacultyListModal: React.FC<FacultyListModalProps> = ({ isOpen, onClose }) => {
  const { isDarkMode } = useTheme();
  const { data: faculty, isLoading, error } = useAllFaculty();
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [filteredFaculty, setFilteredFaculty] = useState<FacultyMember[] | null>(null);
  const navigate = useNavigate();
  const { date } = useParams();

  useEffect(() => {
    if (!faculty) {
      setFilteredFaculty(null);
      return;
    }
    if (!searchQuery) {
      setFilteredFaculty(faculty);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    setTimeout(() => {
      const fuse = new Fuse(faculty, FUSE_OPTIONS);
      const results = fuse.search(searchQuery);
      setFilteredFaculty(results.map((res: any) => res.item));
      setIsSearching(false);
    }, 0);
  }, [faculty, searchQuery]);

  const handleSearch = (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    setSearchQuery(search.trim());
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]"
      onClick={onClose}
    >
      <div 
        className={`max-w-5xl w-full mx-4 max-h-[90vh] rounded-lg shadow-xl ${
          isDarkMode ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-900'
        }`}
        onClick={e => e.stopPropagation()}
      >
                 {/* Sticky Header + Search */}
         <div className="sticky top-0 z-10 bg-inherit rounded-t-lg overflow-hidden" style={{background: isDarkMode ? '#1f2937' : '#f9fafb'}}>
           <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
             <h2 className="text-2xl font-semibold">Faculty List</h2>
             <button
               onClick={onClose}
               className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
             >
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
               </svg>
             </button>
           </div>
           <form className="px-6 pt-4 pb-2 border-b border-gray-200 dark:border-gray-700 bg-inherit flex gap-2 items-center" style={{background: isDarkMode ? '#1f2937' : '#f9fafb'}} onSubmit={handleSearch}>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search faculty (name, title, bio, etc)"
              className={`w-full px-4 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') handleSearch(e); }}
            />
            <button
              type="submit"
              className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSearching}
              aria-label="Search"
            >
              {isSearching ? (
                <svg className="animate-spin h-5 w-5 mx-auto" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              ) : (
                <svg className="h-5 w-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
                </svg>
              )}
            </button>
          </form>
        </div>
                 {/* Scrollable Faculty List */}
         <div className="p-6 pt-2 overflow-y-auto" style={{maxHeight: '60vh'}}>
           {isLoading && <div>Loading faculty...</div>}
           {error && <div className="text-red-600">Error loading faculty.</div>}
           {isSearching ? (
             <div className="flex justify-center items-center py-8">
               <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24">
                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
               </svg>
             </div>
           ) : filteredFaculty !== null ? (
             filteredFaculty.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {filteredFaculty.map((f: FacultyMember) => (
                   <div
                     key={f.id}
                     className="bg-white dark:bg-gray-700 rounded-lg shadow p-4 flex flex-col items-center hover:ring-2 hover:ring-purple-400 hover:scale-105 transition-transform transition-shadow duration-150 cursor-pointer"
                     onClick={() => navigate(`/${date}/faculty/${f.id}`)}
                   >
                     {f.kelloggdirectory_image_url && (
                       <div className="relative mb-2">
                         <img
                           src={f.kelloggdirectory_image_url}
                           alt={f.kelloggdirectory_name || 'Faculty'}
                           className="w-24 h-24 rounded-full object-cover filter grayscale opacity-80"
                         />
                         <div className="absolute inset-0 rounded-full bg-[#886ec4] mix-blend-overlay opacity-30"></div>
                       </div>
                     )}
                     <div className="text-lg font-semibold text-center mb-1">{f.kelloggdirectory_name || f.twentyfivelive_name || 'Unknown'}</div>
                     <div className="text-sm text-gray-600 dark:text-gray-300 text-center mb-1">{f.kelloggdirectory_title}</div>
                     <div className="text-xs text-gray-500 dark:text-gray-400 text-center mb-2">{f.kelloggdirectory_subtitle}</div>
                     {f.kelloggdirectory_bio_url && (
                       <a
                         href={f.kelloggdirectory_bio_url}
                         target="_blank"
                         rel="noopener noreferrer"
                         className="text-blue-600 dark:text-blue-400 text-xs underline mt-1"
                         onClick={e => e.stopPropagation()}
                       >
                         View Bio
                       </a>
                     )}
                   </div>
                 ))}
               </div>
             ) : (
               <div>No faculty found.</div>
             )
           ) : null}
         </div>
      </div>
    </div>
  );
};

export default FacultyListModal;