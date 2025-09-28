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
      className="fixed inset-0 flex items-center justify-center z-[9999] backdrop-blur-sm"
      style={{
        background: isDarkMode 
          ? 'rgba(0, 0, 0, 0.4)'
          : 'rgba(255, 255, 255, 0.3)'
      }}
      onClick={onClose}
    >
      <div 
        className="max-w-5xl w-full mx-4 max-h-[90vh] rounded-2xl backdrop-blur-md border overflow-hidden"
        style={{
          background: isDarkMode 
            ? 'rgba(255, 255, 255, 0.05)'
            : 'rgba(255, 255, 255, 0.25)',
          borderColor: isDarkMode 
            ? 'rgba(255, 255, 255, 0.2)' 
            : 'rgba(255, 255, 255, 0.4)',
          boxShadow: isDarkMode 
            ? '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)'
            : '0 8px 32px rgba(31, 38, 135, 0.37), 0 0 0 1px rgba(255, 255, 255, 0.5)',
          color: isDarkMode ? '#ffffff' : '#1a1a1a'
        }}
        onClick={e => e.stopPropagation()}
      >
                 {/* Sticky Header + Search */}
         <div 
           className="sticky top-0 z-10 backdrop-blur-lg border-b overflow-hidden"
           style={{
             background: isDarkMode 
               ? 'rgba(255, 255, 255, 0.05)'
               : 'rgba(255, 255, 255, 0.3)',
             borderBottomColor: isDarkMode 
               ? 'rgba(255, 255, 255, 0.1)' 
               : 'rgba(255, 255, 255, 0.3)'
           }}
         >
           <div className="flex justify-between items-center p-6">
             <h2 
               className="text-2xl font-bold"
               style={{
                 color: isDarkMode ? '#ffffff' : '#1a1a1a',
                 textShadow: '0 0 20px rgba(255, 255, 255, 0.5)'
               }}
             >
               Faculty List
             </h2>
             <button
               onClick={onClose}
               className="rounded-full p-2 transition-all duration-300 backdrop-blur-sm border"
               style={{
                 background: isDarkMode 
                   ? 'rgba(255, 255, 255, 0.1)'
                   : 'rgba(255, 255, 255, 0.4)',
                 borderColor: isDarkMode 
                   ? 'rgba(255, 255, 255, 0.2)'
                   : 'rgba(255, 255, 255, 0.5)',
                 color: isDarkMode ? '#ffffff' : '#1a1a1a'
               }}
               onMouseEnter={e => {
                 e.currentTarget.style.transform = 'translateY(-1px) scale(1.05)';
                 e.currentTarget.style.background = isDarkMode 
                   ? 'rgba(255, 255, 255, 0.15)'
                   : 'rgba(255, 255, 255, 0.6)';
                 e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
               }}
               onMouseLeave={e => {
                 e.currentTarget.style.transform = 'translateY(0) scale(1)';
                 e.currentTarget.style.background = isDarkMode 
                   ? 'rgba(255, 255, 255, 0.1)'
                   : 'rgba(255, 255, 255, 0.4)';
                 e.currentTarget.style.boxShadow = 'none';
               }}
             >
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
               </svg>
             </button>
           </div>
           <form 
             className="px-6 pt-4 pb-6 flex gap-3 items-center backdrop-blur-sm border-b" 
             style={{
               borderBottomColor: isDarkMode 
                 ? 'rgba(255, 255, 255, 0.1)' 
                 : 'rgba(255, 255, 255, 0.3)',
               background: isDarkMode 
                 ? 'rgba(255, 255, 255, 0.02)'
                 : 'rgba(255, 255, 255, 0.1)'
             }} 
             onSubmit={handleSearch}
           >
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search faculty (name, title, bio, etc)"
              className="w-full px-4 py-3 rounded-xl border backdrop-blur-sm focus:outline-none transition-all duration-300"
              style={{
                background: isDarkMode 
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(255, 255, 255, 0.3)',
                borderColor: isDarkMode 
                  ? 'rgba(255, 255, 255, 0.15)'
                  : 'rgba(255, 255, 255, 0.4)',
                color: isDarkMode ? '#ffffff' : '#1a1a1a'
              }}
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') handleSearch(e); }}
              onFocus={e => {
                e.target.style.borderColor = isDarkMode 
                  ? 'rgba(139, 92, 246, 0.5)'
                  : 'rgba(139, 92, 246, 0.6)';
                e.target.style.boxShadow = '0 0 20px rgba(139, 92, 246, 0.3)';
                e.target.style.background = isDarkMode 
                  ? 'rgba(255, 255, 255, 0.12)'
                  : 'rgba(255, 255, 255, 0.5)';
              }}
              onBlur={e => {
                e.target.style.borderColor = isDarkMode 
                  ? 'rgba(255, 255, 255, 0.15)'
                  : 'rgba(255, 255, 255, 0.4)';
                e.target.style.boxShadow = 'none';
                e.target.style.background = isDarkMode 
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(255, 255, 255, 0.3)';
              }}
            />
            <button
              type="submit"
              className="px-4 py-3 rounded-xl border backdrop-blur-sm transition-all duration-300"
              style={{
                background: isDarkMode 
                  ? 'rgba(139, 92, 246, 0.2)'
                  : 'rgba(139, 92, 246, 0.3)',
                borderColor: isDarkMode 
                  ? 'rgba(139, 92, 246, 0.4)'
                  : 'rgba(139, 92, 246, 0.5)',
                color: isDarkMode ? '#ffffff' : '#1a1a1a'
              }}
              disabled={isSearching}
              aria-label="Search"
              onMouseEnter={e => {
                if (!isSearching) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.background = isDarkMode 
                    ? 'rgba(139, 92, 246, 0.3)'
                    : 'rgba(139, 92, 246, 0.4)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(139, 92, 246, 0.4)';
                }
              }}
              onMouseLeave={e => {
                if (!isSearching) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.background = isDarkMode 
                    ? 'rgba(139, 92, 246, 0.2)'
                    : 'rgba(139, 92, 246, 0.3)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
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
         <div 
           className="p-6 pt-4 overflow-y-auto backdrop-blur-sm"
           style={{
             maxHeight: '60vh',
             background: isDarkMode 
               ? 'rgba(255, 255, 255, 0.02)'
               : 'rgba(255, 255, 255, 0.1)'
           }}
         >
           {isLoading && (
             <div 
               className="text-center py-8"
               style={{ color: isDarkMode ? '#ffffff' : '#1a1a1a' }}
             >
               Loading faculty...
             </div>
           )}
           {error && (
             <div 
               className="text-center py-8"
               style={{ color: '#ef4444' }}
             >
               Error loading faculty.
             </div>
           )}
           {isSearching ? (
             <div className="flex justify-center items-center py-8">
               <svg 
                 className="animate-spin h-8 w-8" 
                 viewBox="0 0 24 24"
                 style={{ color: '#8b5cf6' }}
               >
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
                     className="p-5 flex flex-col items-center cursor-pointer transition-all duration-300 rounded-xl backdrop-blur-md border"
                     style={{
                       background: isDarkMode 
                         ? 'rgba(255, 255, 255, 0.05)'
                         : 'rgba(255, 255, 255, 0.25)',
                       borderColor: isDarkMode 
                         ? 'rgba(255, 255, 255, 0.1)'
                         : 'rgba(255, 255, 255, 0.3)',
                       boxShadow: isDarkMode 
                         ? '0 8px 32px rgba(0, 0, 0, 0.3)'
                         : '0 8px 32px rgba(31, 38, 135, 0.37)'
                     }}
                     onClick={() => navigate(`/${date}/faculty/${f.id}`)}
                     onMouseEnter={e => {
                       e.currentTarget.style.transform = 'translateY(-5px) scale(1.02)';
                       e.currentTarget.style.background = isDarkMode 
                         ? 'rgba(255, 255, 255, 0.08)'
                         : 'rgba(255, 255, 255, 0.35)';
                       e.currentTarget.style.borderColor = isDarkMode 
                         ? 'rgba(139, 92, 246, 0.4)'
                         : 'rgba(139, 92, 246, 0.5)';
                       e.currentTarget.style.boxShadow = isDarkMode 
                         ? '0 15px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(139, 92, 246, 0.3)'
                         : '0 15px 40px rgba(31, 38, 135, 0.5), 0 0 20px rgba(139, 92, 246, 0.4)';
                     }}
                     onMouseLeave={e => {
                       e.currentTarget.style.transform = 'translateY(0) scale(1)';
                       e.currentTarget.style.background = isDarkMode 
                         ? 'rgba(255, 255, 255, 0.05)'
                         : 'rgba(255, 255, 255, 0.25)';
                       e.currentTarget.style.borderColor = isDarkMode 
                         ? 'rgba(255, 255, 255, 0.1)'
                         : 'rgba(255, 255, 255, 0.3)';
                       e.currentTarget.style.boxShadow = isDarkMode 
                         ? '0 8px 32px rgba(0, 0, 0, 0.3)'
                         : '0 8px 32px rgba(31, 38, 135, 0.37)';
                     }}
                   >
                     {f.kelloggdirectory_image_url && (
                       <div className="relative mb-4">
                         <div 
                           className="w-24 h-24 rounded-full overflow-hidden border backdrop-blur-sm"
                           style={{
                             borderColor: isDarkMode 
                               ? 'rgba(255, 255, 255, 0.2)'
                               : 'rgba(255, 255, 255, 0.4)',
                             boxShadow: isDarkMode 
                               ? '0 4px 15px rgba(0, 0, 0, 0.3)'
                               : '0 4px 15px rgba(31, 38, 135, 0.3)'
                           }}
                         >
                           <img
                             src={f.kelloggdirectory_image_url}
                             alt={f.kelloggdirectory_name || 'Faculty'}
                             className="w-full h-full object-cover filter grayscale opacity-80"
                           />
                           <div className="absolute inset-0 rounded-full bg-[#8b5cf6] mix-blend-overlay opacity-30"></div>
                         </div>
                       </div>
                     )}
                     <div 
                       className="text-lg font-bold text-center mb-2"
                       style={{
                         color: isDarkMode ? '#ffffff' : '#1a1a1a',
                         textShadow: '0 0 10px rgba(255, 255, 255, 0.5)'
                       }}
                     >
                       {f.kelloggdirectory_name || f.twentyfivelive_name || 'Unknown'}
                     </div>
                     <div 
                       className="text-sm text-center mb-1"
                       style={{ 
                         color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(26, 26, 26, 0.8)'
                       }}
                     >
                       {f.kelloggdirectory_title}
                     </div>
                     <div 
                       className="text-xs text-center mb-3"
                       style={{ 
                         color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(26, 26, 26, 0.6)'
                       }}
                     >
                       {f.kelloggdirectory_subtitle}
                     </div>
                     {f.kelloggdirectory_bio_url && (
                       <a
                         href={f.kelloggdirectory_bio_url}
                         target="_blank"
                         rel="noopener noreferrer"
                         className="text-xs mt-1 px-3 py-1 rounded-full transition-all duration-300 backdrop-blur-sm border"
                         style={{
                           color: isDarkMode ? '#ffffff' : '#1a1a1a',
                           background: isDarkMode 
                             ? 'rgba(139, 92, 246, 0.2)'
                             : 'rgba(139, 92, 246, 0.3)',
                           borderColor: isDarkMode 
                             ? 'rgba(139, 92, 246, 0.4)'
                             : 'rgba(139, 92, 246, 0.5)',
                           textDecoration: 'none'
                         }}
                         onClick={e => e.stopPropagation()}
                         onMouseEnter={e => {
                           e.currentTarget.style.background = isDarkMode 
                             ? 'rgba(139, 92, 246, 0.3)'
                             : 'rgba(139, 92, 246, 0.4)';
                           e.currentTarget.style.transform = 'scale(1.05)';
                           e.currentTarget.style.boxShadow = '0 5px 15px rgba(139, 92, 246, 0.4)';
                         }}
                         onMouseLeave={e => {
                           e.currentTarget.style.background = isDarkMode 
                             ? 'rgba(139, 92, 246, 0.2)'
                             : 'rgba(139, 92, 246, 0.3)';
                           e.currentTarget.style.transform = 'scale(1)';
                           e.currentTarget.style.boxShadow = 'none';
                         }}
                       >
                         View Bio
                       </a>
                     )}
                   </div>
                 ))}
               </div>
             ) : (
               <div 
                 className="text-center py-8"
                 style={{ color: isDarkMode ? '#ffffff' : '#1a1a1a' }}
               >
                 No faculty found.
               </div>
             )
           ) : null}
         </div>
      </div>
    </div>
  );
};

export default FacultyListModal;