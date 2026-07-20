import { supabase } from './supabase';
import { getAuthErrorMessage } from '@/lib/authErrors';

/**
 * Every auth call the app makes goes through here.
 *
 * Pages must not touch `supabase.auth` directly — that separation is what stops
 * the old bug where LoginPage and RegisterPage each stood up their own auth
 * client and drifted from the shared context.
 */

/** Rethrows Supabase failures with a message that is safe to show a user. */
function rethrow(error: unknown): never {
  throw new Error(getAuthErrorMessage(error));
}

export async function signUp(email: string, password: string, displayName: string) {
  if (!email || !password || !displayName) throw new Error('All fields are required.');
  if (password.length < 6) throw new Error('Password should be at least 6 characters long.');

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    // Read by the on_auth_user_created trigger to seed public.profiles.
    options: { data: { display_name: displayName } },
  });
  if (error) rethrow(error);

  // With "Confirm email" enabled, signUp returns a user but no session. The
  // caller needs to distinguish that from a completed signup.
  return { needsEmailConfirmation: !data.session };
}

export async function signIn(email: string, password: string) {
  if (!email || !password) throw new Error('Please enter both email and password.');

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) rethrow(error);
}

/**
 * Which social providers the project has enabled, fetched once and cached.
 *
 * signInWithOAuth does NOT error when a provider is disabled — it returns a
 * redirect URL, and the browser lands on Supabase's /authorize endpoint which
 * renders a raw JSON error page. Checking first turns that dead end into a
 * clear message and keeps the user in the app.
 */
let enabledProvidersPromise: Promise<Record<string, boolean>> | null = null;

async function isProviderEnabled(provider: string): Promise<boolean> {
  if (!enabledProvidersPromise) {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    enabledProvidersPromise = fetch(`${url}/auth/v1/settings`, {
      headers: { apikey: anonKey },
    })
      .then((r) => r.json())
      .then((s) => s?.external ?? {})
      .catch(() => ({})); // network failure: don't block the attempt
  }
  const external = await enabledProvidersPromise;
  // Empty map (fetch failed) → assume enabled and let the real flow decide.
  return Object.keys(external).length === 0 ? true : external[provider] === true;
}

export async function signInWithGoogle() {
  if (!(await isProviderEnabled('google'))) {
    throw new Error(
      'Google sign-in is not enabled for this app yet. Please use email and password.',
    );
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/dashboard` },
  });
  if (error) rethrow(error);
  // Success navigates away to Google; nothing after this runs.
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) rethrow(error);
}

export async function resetPassword(email: string) {
  if (!email) throw new Error('Please enter your email address.');

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/login`,
  });
  if (error) rethrow(error);
}

export async function updatePassword(password: string) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) rethrow(error);
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) rethrow(error);
  return data.session;
}
