import { supabase } from './supabase';
import type { Database, Profile } from '@/types/database.types';

/** Editable profile columns, derived from the schema so it can't drift. */
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

/**
 * `profiles` is the source of truth for display name and avatar.
 *
 * Deliberately not `user.user_metadata`: that field is user-editable and shows
 * up in auth.jwt(), so treating it as authoritative is a habit worth avoiding
 * even where the value is only displayed.
 */

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateProfile(userId: string, patch: ProfileUpdate): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Uploads an avatar to `avatars/<uid>/<file>` and returns its public URL.
 *
 * The path prefix is not cosmetic: the storage policies authorize on the first
 * folder segment, so a file stored anywhere else is rejected.
 */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${userId}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, cacheControl: '3600' });

  if (uploadError) throw new Error(uploadError.message);

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  // Bust the CDN cache so a replaced avatar shows up immediately.
  return `${data.publicUrl}?v=${Date.now()}`;
}
