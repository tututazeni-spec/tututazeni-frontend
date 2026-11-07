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
      apiClient.post<{ inviteId: string; emailSent: boolean }>(
        '/instructor-invites',
        body,
      ),
    {
      invalidateKeys: [KEY],
      onSuccess: (res) =>
        res.emailSent
          ? notify({
              title: 'Convite enviado',
              description: 'O instrutor recebeu um link de uso único por email.',
              intent: 'success',
            })
          : notify({
              title: 'Convite criado, mas o email não foi enviado',
              description: 'Use "Reenviar" na linha do convite para tentar de novo.',
              intent: 'danger',
            }),
    },
  );
  const resend = useApiMutation(
    (id: string) =>
      apiClient.post<{ inviteId: string; emailSent: boolean }>(
        `/instructor-invites/${id}/resend`,
      ),
    {
      invalidateKeys: [KEY],
      onSuccess: (res) =>
        res.emailSent
          ? notify({ title: 'Convite reenviado', intent: 'success' })
          : notify({
              title: 'Novo convite criado, mas o email não foi enviado',
              description:
                'O servidor de email não respondeu. Tente "Reenviar" mais tarde.',
              intent: 'danger',
            }),
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

  const resetDevices = useApiMutation(
    (userId: number) =>
      apiClient.post(`/instructor-invites/users/${userId}/devices/reset`),
    {
      invalidateKeys: [KEY],
      onSuccess: () =>
        notify({
          title: 'Dispositivo reposto',
          description: 'No próximo acesso o instrutor confirma o dispositivo por código.',
          intent: 'success',
        }),
      onError,
    },
  );

  return { list, create, resend, revoke, extend, deactivate, resetDevices };
}
