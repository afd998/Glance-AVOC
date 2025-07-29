import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/supabase'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY!

// Debug: Check if environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase configuration error:');
  console.error('REACT_APP_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.error('REACT_APP_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'X-Client-Info': 'glance-app',
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  },
  db: {
    schema: 'public'
  }
})

// Debug: Test the connection
console.log('🔧 DEBUG: Supabase client created');
console.log('🔧 DEBUG: Supabase URL:', supabaseUrl);
console.log('🔧 DEBUG: Supabase Key (first 10 chars):', supabaseAnonKey ? supabaseAnonKey.substring(0, 10) + '...' : 'Missing'); 