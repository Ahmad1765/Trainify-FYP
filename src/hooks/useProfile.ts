import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import * as profilesService from '@/services/profiles.service';
import type { Profile } from '@/types/database.types';

export const profileKey = (userId: string | undefined) => ['profile', userId] as const;

export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: profileKey(user?.id),
    queryFn: () => profilesService.getProfile(user!.id),
    enabled: !!user,
    staleTime: 60_000,
  });
}

export function useUpdateProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patch: Parameters<typeof profilesService.updateProfile>[1]) =>
      profilesService.updateProfile(user!.id, patch),
    onSuccess: (updated: Profile) => {
      queryClient.setQueryData(profileKey(user?.id), updated);
    },
  });
}

export function useUploadAvatar() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const url = await profilesService.uploadAvatar(user!.id, file);
      return profilesService.updateProfile(user!.id, { avatar_url: url });
    },
    onSuccess: (updated: Profile) => {
      queryClient.setQueryData(profileKey(user?.id), updated);
    },
  });
}

/**
 * Best-available display name, in order of trustworthiness.
 * Falls back to the email local-part so the sidebar is never empty.
 */
export function displayNameOf(profile: Profile | null | undefined, email?: string | null) {
  return profile?.display_name?.trim() || email?.split('@')[0] || 'User';
}
