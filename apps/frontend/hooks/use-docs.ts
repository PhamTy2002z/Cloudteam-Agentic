'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useDocs(projectId: string) {
  return useQuery({
    queryKey: ['docs', projectId],
    queryFn: () => api.getDocs(projectId),
    enabled: !!projectId,
  });
}

export function useDoc(projectId: string, fileName: string) {
  return useQuery({
    queryKey: ['docs', projectId, fileName],
    queryFn: () => api.getDoc(projectId, fileName),
    enabled: !!projectId && !!fileName,
  });
}

export function useUpdateDoc(projectId: string, fileName: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) => api.updateDoc(projectId, fileName, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['docs', projectId] });
      queryClient.invalidateQueries({ queryKey: ['docs', projectId, fileName] });
    },
  });
}

export function useSyncDocs(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.syncDocs(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['docs', projectId] });
    },
  });
}

export function usePushDoc(projectId: string, fileName: string) {
  return useMutation({
    mutationFn: () => api.pushDoc(projectId, fileName),
  });
}
