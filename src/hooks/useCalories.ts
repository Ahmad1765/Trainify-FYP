import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import * as caloriesService from '@/services/calories.service';
import type { NewCalorieEntry } from '@/services/calories.service';

const caloriesKey = (userId: string | undefined) => ['calorie_entries', userId] as const;

export function useCalorieEntries() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // One-time import of legacy localStorage entries, then refetch.
  useEffect(() => {
    if (!user) return;
    caloriesService
      .importLegacyCalorieEntries(user.id)
      .then((n) => {
        if (n > 0) queryClient.invalidateQueries({ queryKey: caloriesKey(user.id) });
      })
      .catch(() => {
        /* import is best-effort; never block the page on it */
      });
  }, [user, queryClient]);

  return useQuery({
    queryKey: caloriesKey(user?.id),
    queryFn: () => caloriesService.listCalorieEntries(user!.id),
    enabled: !!user,
  });
}

export function useCreateCalorieEntry() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (entry: NewCalorieEntry) => caloriesService.createCalorieEntry(user!.id, entry),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: caloriesKey(user?.id) });
    },
  });
}

export function useDeleteCalorieEntry() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => caloriesService.deleteCalorieEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: caloriesKey(user?.id) });
    },
  });
}
