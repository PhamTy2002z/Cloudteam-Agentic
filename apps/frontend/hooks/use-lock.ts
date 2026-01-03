'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useLock(projectId: string) {
  return useQuery({
    queryKey: ['lock', projectId],
    queryFn: () => api.getLock(projectId),
    enabled: !!projectId,
    refetchInterval: 10000,
  });
}

export function useAcquireLock(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ lockedBy, reason }: { lockedBy: string; reason?: string }) =>
      api.acquireLock(projectId, lockedBy, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lock', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useReleaseLock(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.releaseLock(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lock', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
