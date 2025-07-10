import { useState } from 'react';
import { supabase } from '../lib/supabase';

export const useWhitelist = () => {
  const [isChecking, setIsChecking] = useState(false);

  const checkEmailWhitelisted = async (email: string): Promise<{ isWhitelisted: boolean; error?: string }> => {
    setIsChecking(true);
    
    try {
      // First, check if the email domain is northwestern.edu or a subdomain
      const domain = email.split('@')[1];
      if (!domain || !domain.endsWith('northwestern.edu')) {
        return { 
          isWhitelisted: false, 
          error: 'Only Northwestern email addresses are allowed' 
        };
      }

      // Check if the specific email is in the whitelist
      const { data, error } = await supabase
        .from('email_whitelist')
        .select('email')
        .eq('email', email.toLowerCase())
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Whitelist check error:', error);
        return { 
          isWhitelisted: false, 
          error: 'Error checking whitelist. Please try again.' 
        };
      }

      if (data) {
        return { isWhitelisted: true };
      } else {
        return { 
          isWhitelisted: false, 
          error: 'This email is not authorized to access the system. Please contact an administrator.' 
        };
      }
    } catch (err) {
      console.error('Whitelist check exception:', err);
      return { 
        isWhitelisted: false, 
        error: 'An unexpected error occurred. Please try again.' 
      };
    } finally {
      setIsChecking(false);
    }
  };

  return {
    checkEmailWhitelisted,
    isChecking
  };
}; 