import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import * as service from '@/services/workoutPlans.service';
import type { DayKeyedPlan, NewWorkoutPlan } from '@/services/workoutPlans.service';

const recentPlanKey = (userId: string | undefined) => ['workout_plan_recent', userId] as const;

/** The user's most recent workout plan (the one the page shows). */
export function useRecentWorkoutPlan() {
  const { user } = useAuth();
  return useQuery({
    queryKey: recentPlanKey(user?.id),
    queryFn: () => service.getMostRecentPlan(user!.id),
    enabled: !!user,
  });
}

export function useCreateWorkoutPlan() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewWorkoutPlan) => service.createWorkoutPlan(user!.id, input),
    onSuccess: (plan) => {
      queryClient.setQueryData(recentPlanKey(user?.id), plan);
    },
  });
}

export function useUpdatePlanSchedule() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, plan }: { id: string; plan: DayKeyedPlan }) =>
      service.updatePlanSchedule(id, plan),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recentPlanKey(user?.id) });
    },
  });
}
