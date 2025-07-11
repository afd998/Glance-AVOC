import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithOtp: (email: string) => Promise<{ error: any }>;
  verifyOtp: (email: string, token: string) => Promise<{ error: any; session: Session | null }>;
  signOut: () => Promise<void>;
  ensureUserProfile: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to ensure user has a profile
  const ensureUserProfile = async (userId: string) => {
    console.log('ensureUserProfile: Starting for user:', userId);
    
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Profile check timeout')), 10000); // 10 second timeout
    });

    try {
      // Check if profile exists with timeout
      console.log('ensureUserProfile: Checking if profile exists...');
      const profileCheckPromise = supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

      const result = await Promise.race([
        profileCheckPromise,
        timeoutPromise
      ]) as { data: any; error: any };
      
      const { data: existingProfile, error: checkError } = result;

      console.log('ensureUserProfile: Check result:', { existingProfile, checkError });

      if (checkError && checkError.code === 'PGRST116') {
        // Profile doesn't exist, create one
        console.log('ensureUserProfile: Profile doesn\'t exist, creating...');
        const { error: createError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            name: null,
            room_filters: [],
            auto_hide: false,
            current_filter: null
          });

        if (createError) {
          console.error('Error creating user profile:', createError);
        } else {
          console.log('Created default profile for user:', userId);
        }
      } else if (checkError) {
        console.error('Error checking user profile:', checkError);
      } else {
        console.log('ensureUserProfile: Profile already exists');
      }
    } catch (error) {
      console.error('Error ensuring user profile:', error);
    }
    console.log('ensureUserProfile: Completed');
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithOtp = async (email: string) => {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true, // Allow new users to sign up
      },
    });
    
    return { error };
  };

  const verifyOtp = async (email: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    
    if (!error && data.session) {
      // Update the session state immediately
      setSession(data.session);
      setUser(data.session.user);
    }
    
    return { error, session: data.session };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    loading,
    signInWithOtp,
    verifyOtp,
    signOut,
    ensureUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};