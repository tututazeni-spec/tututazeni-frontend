// hooks/useLibraryItem.ts
// Extraído de app/(platform)/library/[id]/page.tsx.

'use client';

import { useState, useEffect } from 'react';
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import type { ItemDetail } from '@/components/library/types';

export function useLibraryItem(id: string) {
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState('');
  const [newComment, setNewComment] = useState('');

  const {
    data: item,
    isLoading: loading,
    error: queryError,
  } = useApiQuery<ItemDetail>(
    queryKeys.library.item(id),
    `/library/items/${id}`,
    { enabled: !!id, staleTime: STALE_TIME.DYNAMIC },
  );
  const error = queryError?.message ?? '';

  // Regista visualização (best-effort) uma vez por id.
  useEffect(() => {
    if (id)
      void apiClient.post(`/library/items/${id}/view`, {}).catch(() => {});
  }, [id]);

  const downloadMut = useApiMutation(
    () =>
      apiClient.post<{ fileUrl?: string }>(`/library/items/${id}/download`, {}),
    {
      onSuccess: (json) => {
        if (json.fileUrl) window.open(json.fileUrl, '_blank');
      },
      onError: (e) => alert(e.message || 'Erro inesperado'),
    },
  );
  const download = () => downloadMut.mutate(undefined);

  const rateMut = useApiMutation(
    () =>
      apiClient.post(`/library/items/${id}/rate`, {
        score,
        ...(comment && { comment }),
      }),
    {
      invalidateKeys: [queryKeys.library.item(id)],
      onSuccess: () => {
        setScore(0);
        setComment('');
      },
      onError: (e) => alert(e.message || 'Erro inesperado'),
    },
  );

  const commentMut = useApiMutation(
    () =>
      apiClient.post(`/library/items/${id}/comments`, { content: newComment }),
    {
      invalidateKeys: [queryKeys.library.item(id)],
      onSuccess: () => setNewComment(''),
      onError: (e) => alert(e.message || 'Erro inesperado'),
    },
  );
  const saving = rateMut.isPending || commentMut.isPending;

  function submitRating(e: React.FormEvent) {
    e.preventDefault();
    if (!score) {
      alert('Selecciona uma pontuação');
      return;
    }
    rateMut.mutate(undefined);
  }

  function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;
    commentMut.mutate(undefined);
  }

  return {
    item,
    loading,
    error,
    score,
    setScore,
    comment,
    setComment,
    newComment,
    setNewComment,
    download,
    submitRating,
    submitComment,
    saving,
  };
}
