// hooks/useInstructorInvites.ts
// Convites de instrutores externos (ADMIN/RH): lista e ações sobre /instructor-invites.

'use client';

import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/providers/ToastProvider';
import { useApiMutation, useApiQuery } from './useApiQuery';

export type InviteStatus = 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED';

export interface InstructorInvite {
  id: string;
  userId: number;
  email: string;
  fullName: string;
  status: InviteStatus;
  expiresAt: string;
  accessExpiresAt: string | null;
  createdAt: string;
}

export interface NewInstructorInvite {
  email: string;
  fullName: string;
  accessDays: number;
}

const KEY = ['instructor-invites'] as const;

export function useInstructorInvites() {
  const notify = useToast();
  const list = useApiQuery<InstructorInvite[]>(KEY, '/instructor-invites');

  const onError = () =>
    notify({
      title: 'Não foi possível concluir a ação',
      description: 'Tente novamente dentro de instantes.',
      intent: 'danger',
    });

  const create = useApiMutation(
    (body: NewInstructorInvite) =>
      apiClient.post<{ inviteId: string }>('/instructor-invites', body),
    {
      invalidateKeys: [KEY],
      onSuccess: () =>
        notify({
          title: 'Convite enviado',
          description: 'O instrutor recebeu um link de uso único por email.',
          intent: 'success',
        }),
    },
  );
  const resend = useApiMutation(
    (id: string) => apiClient.post(`/instructor-invites/${id}/resend`),
    {
      invalidateKeys: [KEY],
      onSuccess: () => notify({ title: 'Convite reenviado', intent: 'success' }),
      onError,
    },
  );
  const revoke = useApiMutation(
    (id: string) => apiClient.post(`/instructor-invites/${id}/revoke`),
    {
      invalidateKeys: [KEY],
      onSuccess: () => notify({ title: 'Convite revogado', intent: 'success' }),
      onError,
    },
  );
  const extend = useApiMutation(
    (v: { userId: number; accessDays: number }) =>
      apiClient.patch(`/instructor-invites/users/${v.userId}/extend`, {
        accessDays: v.accessDays,
      }),
    {
      invalidateKeys: [KEY],
      onSuccess: () => notify({ title: 'Acesso prolongado', intent: 'success' }),
      onError,
    },
  );
  const deactivate = useApiMutation(
    (userId: number) =>
      apiClient.post(`/instructor-invites/users/${userId}/deactivate`),
    {
      invalidateKeys: [KEY],
      onSuccess: () => notify({ title: 'Acesso desativado', intent: 'success' }),
      onError,
    },
  );

  return { list, create, resend, revoke, extend, deactivate };
}
