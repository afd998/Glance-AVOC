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
    console.log('🔐 signInWithOtp: Starting with email:', email);
    
    try {
      console.log('🔐 signInWithOtp: Calling Supabase auth.signInWithOtp...');
      
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false, // Don't create new users automatically
        },
      });
      
      console.log('🔐 signInWithOtp: Supabase response:', { 
        hasData: !!data, 
        hasError: !!error,
        errorMessage: error?.message,
        errorStatus: error?.status,
        errorName: error?.name
      });
      
      if (error) {
        console.error('🔐 signInWithOtp: Supabase OTP error:', {
          message: error.message,
          status: error.status,
          name: error.name,
          stack: error.stack
        });
        
        // Provide more specific error messages
        if (error.message.includes('User not found') || error.message.includes('Invalid login credentials')) {
          console.error('🔐 signInWithOtp: User not found in database');
          return { 
            error: { 
              message: 'User not in database. Contact support for access.' 
            } 
          };
        }
        
        if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
          console.error('🔐 signInWithOtp: 500 error detected - likely database issue');
          return { 
            error: { 
              message: 'Authentication service temporarily unavailable. Please try again in a few minutes.' 
            } 
          };
        }
        
        return { error };
      }
      
      console.log('🔐 signInWithOtp: Success - OTP sent to existing user');
      return { error: null };
    } catch (err) {
      console.error('🔐 signInWithOtp: Unexpected error:', {
        error: err,
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined
      });
      return { 
        error: { 
          message: 'An unexpected error occurred. Please try again.' 
        } 
      };
    }
  };

  const verifyOtp = async (email: string, token: string) => {
    console.log('🔐 verifyOtp: Starting with email:', email, 'token length:', token.length);
    
    try {
      console.log('🔐 verifyOtp: Calling Supabase auth.verifyOtp...');
      
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      });
      
      console.log('🔐 verifyOtp: Supabase response:', { 
        hasData: !!data, 
        hasSession: !!data?.session,
        hasUser: !!data?.session?.user,
        hasError: !!error,
        errorMessage: error?.message
      });
      
      if (!error && data.session) {
        console.log('🔐 verifyOtp: Session created successfully:', {
          userId: data.session.user.id,
          userEmail: data.session.user.email,
          sessionExpiresAt: data.session.expires_at
        });
        
        // Update the session state immediately
        setSession(data.session);
        setUser(data.session.user);
      }
      
      if (error) {
        console.error('🔐 verifyOtp: Supabase error:', {
          message: error.message,
          status: error.status,
          name: error.name
        });
      }
      
      return { error, session: data.session };
    } catch (err) {
      console.error('🔐 verifyOtp: Unexpected error:', {
        error: err,
        message: err instanceof Error ? err.message : 'Unknown error'
      });
      return { error: err, session: null };
    }
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};