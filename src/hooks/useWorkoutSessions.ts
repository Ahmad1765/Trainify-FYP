import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import * as service from '@/services/workoutSessions.service';
import type { NewWorkoutSession } from '@/services/workoutSessions.service';

const sessionsKey = (userId: string | undefined) => ['workout_sessions', userId] as const;

export function useWorkoutSessions(limit = 100) {
  const { user } = useAuth();
  return useQuery({
    queryKey: sessionsKey(user?.id),
    queryFn: () => service.listWorkoutSessions(user!.id, limit),
    enabled: !!user,
  });
}

/** Sessions plus the derived stats the Dashboard and Profile display. */
export function useWorkoutStats() {
  const query = useWorkoutSessions();
  const stats = useMemo(
    () => service.computeStats(query.data ?? []),
    [query.data],
  );
  return { ...query, stats };
}

export function useCreateWorkoutSession() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (s: NewWorkoutSession) => service.createWorkoutSession(user!.id, s),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionsKey(user?.id) });
    },
  });
}
