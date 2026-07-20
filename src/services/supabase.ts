import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Fail loudly at startup rather than letting every query fail later with an
// opaque "Failed to fetch" against an undefined URL.
if (!url || !anonKey) {
  throw new Error(
    'Supabase is not configured. Copy .env.example to .env and set ' +
      'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then restart the dev server ' +
      '(Vite only reads .env at startup).',
  );
}

// A common mistake is pasting the REST endpoint from the dashboard. supabase-js
// appends /rest/v1, /auth/v1 etc. itself, so keeping the suffix would produce
// requests to /rest/v1/rest/v1/... that 404 in confusing ways.
if (/\/rest\/v1\/?$/.test(url)) {
  throw new Error(
    `VITE_SUPABASE_URL should be the base project URL, not the REST endpoint. ` +
      `Use ${url.replace(/\/rest\/v1\/?$/, '')} instead.`,
  );
}

export const supabase = createClient<Database>(url, anonKey, {
  auth: {
    // Persist across reloads and keep the token fresh. detectSessionInUrl is
    // required for the OAuth redirect to be picked up when Google returns.
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
