import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Cache client instance
let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseCredentials(): { url: string | null; key: string | null } {
  // Check process.env first
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (envUrl && envKey && !envUrl.includes('your-project-id')) {
    return { url: envUrl, key: envKey };
  }

  // Check client-side custom storage
  if (typeof window !== 'undefined') {
    const customUrl = localStorage.getItem('supabase_custom_url');
    const customKey = localStorage.getItem('supabase_custom_key');
    if (customUrl && customKey) {
      return { url: customUrl, key: customKey };
    }
  }

  return { url: null, key: null };
}

export function getSupabase(): SupabaseClient | null {
  const { url, key } = getSupabaseCredentials();

  if (!url || !key) {
    return null;
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient(url, key);
  }

  return supabaseInstance;
}

export function resetSupabaseClient(): void {
  supabaseInstance = null;
}
