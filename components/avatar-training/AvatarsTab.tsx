// components/avatar-training/AvatarsTab.tsx
// Gestão de avatares (docs/Avatar_Training.md §6). Um avatar só pode ser
// activado depois de testado (regra do backend). Criar/testar/activar/desactivar
// é ADMIN/RH; os restantes perfis só vêem os avatares activos.

'use client';

import { useState } from 'react';
import { Bot, Plus } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { QueryError } from '@/components/ui/QueryError';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Textarea } from '@/components/ui/Textarea';
import { ADMIN_ROLES, AVATAR_STATUS } from './constants';
import type { AvatarStatus, TrainingAvatar } from './types';

function CreateAvatarModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const notify = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState('pt');
  const create = useApiMutation(
    () =>
      apiClient.post('/avatar-training/avatars', {
        name: name.trim(),
        description: description.trim() || undefined,
        language: language.trim() || undefined,
      }),
    {
      onSuccess: () => {
        notify({ title: 'Avatar criado (em teste)', intent: 'success' });
        onCreated();
        onClose();
      },
      onError: (e) =>
        notify({
          title: 'Não foi possível criar o avatar',
          description: e.message,
          intent: 'danger',
        }),
    },
  );

  return (
    <Modal open onOpenChange={(o) => !o && onClose()}>
      <ModalContent
        title="Novo avatar"
        description="Fica em teste até ser testado e activado."
      >
        <div className="mt-4 space-y-3">
          <FormField label="Nome" htmlFor="av-name">
            <Input
              id="av-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </FormField>
          <FormField label="Descrição" htmlFor="av-desc">
            <Textarea
              id="av-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </FormField>
          <FormField label="Idioma" htmlFor="av-lang">
            <Input
              id="av-lang"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button intent="ghost" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              size="sm"
              loading={create.isPending}
              disabled={!name.trim()}
              onClick={() => create.mutate(undefined)}
            >
              Criar
            </Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}

export function AvatarsTab() {
  const role = useCurrentRole();
  const notify = useToast();
  const isAdmin = !!role && ADMIN_ROLES.includes(role);
  const [showCreate, setShowCreate] = useState(false);
  const key = queryKeys.avatarTraining.avatars();

  const { data, isLoading, error, refetch } = useApiQuery<TrainingAvatar[]>(
    key,
    '/avatar-training/avatars',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  const onError = (e: Error) =>
    notify({
      title: 'Não foi possível actualizar o avatar',
      description: e.message,
      intent: 'danger',
    });
  const test = useApiMutation(
    (id: number) => apiClient.post(`/avatar-training/avatars/${id}/test`),
    {
      invalidateKeys: [key],
      onSuccess: () => notify({ title: 'Teste registado', intent: 'success' }),
      onError,
    },
  );
  const setStatus = useApiMutation(
    (v: { id: number; status: AvatarStatus }) =>
      apiClient.post(`/avatar-training/avatars/${v.id}/status`, {
        status: v.status,
      }),
    { invalidateKeys: [key], onError },
  );

  if (error) return <QueryError error={error} onRetry={() => refetch()} />;
  if (isLoading || !data)
    return (
      <Skeleton
        rows={3}
        itemClassName="h-20 rounded-card bg-surface-sunken animate-pulse"
      />
    );

  return (
    <div className="space-y-4">
      {isAdmin && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus size={14} /> Novo avatar
          </Button>
        </div>
      )}

      {data.length === 0 ? (
        <EmptyState
          icon={Bot}
          title="Sem avatares"
          description="Ainda não existem instrutores virtuais disponíveis."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {data.map((a) => (
            <div
              key={a.id}
              className="rounded-card border border-border bg-surface p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate font-display text-sm font-semibold text-ink">
                    {a.name}
                  </div>
                  <div className="font-body text-xs text-ink-muted">
                    {a.language}
                    {a.specialty ? ` · ${a.specialty}` : ''}
                    {a.tone ? ` · ${a.tone}` : ''}
                  </div>
                </div>
                <StatusBadge value={a.status} map={AVATAR_STATUS} variant="dot" />
              </div>
              {a.description && (
                <p className="mt-2 line-clamp-2 font-body text-xs text-ink-muted">
                  {a.description}
                </p>
              )}
              {isAdmin && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    intent="secondary"
                    loading={test.isPending && test.variables === a.id}
                    onClick={() => test.mutate(a.id)}
                  >
                    Testar
                  </Button>
                  {a.status !== 'ACTIVE' ? (
                    <Button
                      size="sm"
                      disabled={!a.lastTestedAt}
                      title={
                        a.lastTestedAt
                          ? undefined
                          : 'É obrigatório testar o avatar antes de o activar'
                      }
                      onClick={() => setStatus.mutate({ id: a.id, status: 'ACTIVE' })}
                    >
                      Activar
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      intent="ghost"
                      onClick={() => setStatus.mutate({ id: a.id, status: 'INACTIVE' })}
                    >
                      Desactivar
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateAvatarModal
          onClose={() => setShowCreate(false)}
          onCreated={() => refetch()}
        />
      )}
    </div>
  );
}
