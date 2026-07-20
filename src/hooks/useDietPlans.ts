import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import * as service from '@/services/dietPlans.service';
import type { NewDietPlan } from '@/services/dietPlans.service';

const recentDietKey = (userId: string | undefined) => ['diet_plan_recent', userId] as const;

export function useRecentDietPlan() {
  const { user } = useAuth();
  return useQuery({
    queryKey: recentDietKey(user?.id),
    queryFn: () => service.getMostRecentDietPlan(user!.id),
    enabled: !!user,
  });
}

export function useCreateDietPlan() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewDietPlan) => service.createDietPlan(user!.id, input),
    onSuccess: (plan) => {
      queryClient.setQueryData(recentDietKey(user?.id), plan);
    },
  });
}
