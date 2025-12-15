// Supabase client configuration
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
// Support both old and new env var names for backwards compatibility
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Validate environment variables at boot
function validateSupabaseConfig(): void {
  const errors: string[] = [];

  if (!SUPABASE_URL) {
    errors.push('VITE_SUPABASE_URL is not set in .env');
  } else if (!SUPABASE_URL.startsWith('https://') || !SUPABASE_URL.includes('.supabase.co')) {
    errors.push(`VITE_SUPABASE_URL appears invalid: ${SUPABASE_URL}`);
  }

  if (!SUPABASE_ANON_KEY) {
    errors.push('VITE_SUPABASE_ANON_KEY is not set in .env');
  } else if (!SUPABASE_ANON_KEY.startsWith('eyJ')) {
    // Valid Supabase anon keys are JWTs that start with "eyJ"
    console.error(
      '❌ VITE_SUPABASE_ANON_KEY is not a valid Supabase JWT anon key.\n' +
      'Expected format: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...\n' +
      'Current value starts with: ' + SUPABASE_ANON_KEY.substring(0, 20) + '...\n\n' +
      'To fix this:\n' +
      '1. Go to https://supabase.com/dashboard\n' +
      '2. Select your project\n' +
      '3. Go to Settings → API\n' +
      '4. Copy the "anon public" key (starts with eyJ...)\n' +
      '5. Update your .env file: VITE_SUPABASE_ANON_KEY="eyJ..."\n' +
      '6. Restart the dev server'
    );
    errors.push('Invalid Supabase anon key format. See console for instructions.');
  }

  if (errors.length > 0) {
    console.error('🚨 Supabase Configuration Errors:\n' + errors.join('\n'));
    // Don't throw - let the app continue but auth will fail gracefully
  }
}

// Validate on module load
validateSupabaseConfig();

// Create the Supabase client
export const supabase: SupabaseClient<Database> = createClient<Database>(
  SUPABASE_URL || '',
  SUPABASE_ANON_KEY || '',
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

// Helper to check if the client is properly configured
export function isSupabaseConfigured(): boolean {
  return !!(SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_ANON_KEY.startsWith('eyJ'));
}

// Helper to test connection (call this on app init if needed)
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    if (!isSupabaseConfigured()) {
      console.error('Supabase is not properly configured');
      return false;
    }
    const { error } = await supabase.auth.getSession();
    if (error) {
      console.error('Supabase connection test failed:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase connection test error:', err);
    return false;
  }
}