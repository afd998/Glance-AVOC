import React, { useEffect, useState } from 'react';
import { useAllFaculty } from '../core/faculty/hooks/useFaculty';
import { useTheme } from '../contexts/ThemeContext';
import { Database } from '../types/supabase';
import Fuse, { IFuseOptions } from 'fuse.js';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { ArrowLeft } from 'lucide-react';

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

const FacultyListPage: React.FC = () => {
  const { isDarkMode } = useTheme();
  const { data: faculty, isLoading, error } = useAllFaculty();
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [filteredFaculty, setFilteredFaculty] = useState<FacultyMember[] | null>(null);
  const navigate = useNavigate();

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
     
      {/* Content */}
      {/* Search Form */}
      <div className="p-6 border-b">
        <form 
          className="flex gap-3 items-center max-w-2xl" 
          onSubmit={handleSearch}
        >
          <Input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search faculty (name, title, bio, etc)"
            className="w-full"
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter') handleSearch(e); }}
          />
          <Button
            type="submit"
            variant="outline"
            disabled={isSearching}
            aria-label="Search"
          >
            {isSearching ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
              </svg>
            )}
          </Button>
        </form>
      </div>
      
      {/* Faculty Grid */}
      <div className="p-6">
          {isLoading && (
            <div 
              className="text-center py-8"
          
            >
              Loading faculty...
            </div>
          )}
          {error && (
            <div 
              className="text-center py-8"
            
            >
              Error loading faculty.
            </div>
          )}
          {isSearching ? (
            <div className="flex justify-center items-center py-8">
              <svg 
                className="animate-spin h-8 w-8" 
                viewBox="0 0 24 24"
              
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            </div>
          ) : filteredFaculty !== null ? (
            filteredFaculty.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredFaculty.map((f: FacultyMember) => (
                  <Card
                    key={f.id}
                    className=" cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg"
                    onClick={() => navigate(`/faculty/${f.id}`)}
                  >
                    <CardContent className="p-5 flex flex-col items-center">
                    {f.kelloggdirectory_image_url && (
                      <div className="relative mb-4">
                        <div 
                          className="w-24 h-24 rounded-full overflow-hidden border "
                         
                        >
                          <img
                            src={f.kelloggdirectory_image_url}
                            alt={f.kelloggdirectory_name || 'Faculty'}
                            className=  " w-full h-full object-cover filter grayscale opacity-80 "
                          />
                          <div className="absolute inset-0 rounded-full bg-[#8b5cf6] mix-blend-overlay opacity-30"></div>
                        </div>
                      </div>
                    )}
                      <div 
                        className="text-lg font-bold text-center mb-2"
                      
                      >
                        {(() => {
                          const fullName = f.kelloggdirectory_name || f.twentyfivelive_name || 'Unknown';
                          const nameParts = fullName.split(' ');
                          if (nameParts.length >= 2) {
                            const firstName = nameParts[0];
                            const lastName = nameParts.slice(1).join(' ');
                            return `${firstName} - ${lastName}`;
                          }
                          return fullName;
                        })()}
                      </div>
                    <div 
                      className="text-sm text-center mb-1"
                     
                    >
                      {f.kelloggdirectory_title}
                    </div>
                    <div 
                      className="text-xs text-center mb-3"
                    
                    >
                      {f.kelloggdirectory_subtitle}
                    </div>
                    {f.kelloggdirectory_bio_url && (
                      <a
                        href={f.kelloggdirectory_bio_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs mt-1 px-3 py-1 rounded-full transition-all duration-300 backdrop-blur-sm border"
                       
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
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div 
                className="text-center py-8"
               
              >
                No faculty found.
              </div>
            )
          ) : null}
      </div>
    </div>
  );
};

export default FacultyListPage;