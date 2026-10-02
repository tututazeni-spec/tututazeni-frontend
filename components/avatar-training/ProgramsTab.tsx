// components/avatar-training/ProgramsTab.tsx
// Formações com Avatar (docs/Avatar_Training.md §2/§4): catálogo, criação,
// envio para revisão, publicação (ADMIN/RH) e arquivo. Os papéis espelham
// @Roles em src/avatar-training/avatar-training.controller.ts.

'use client';

import { useState } from 'react';
import { GraduationCap, Plus } from 'lucide-react';
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
import {
  ADMIN_ROLES,
  AUTHOR_ROLES,
  EXPERIENCE_LABEL,
  PROGRAM_STATUS,
} from './constants';
import type { AvatarProgram } from './types';

function CreateProgramModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const notify = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const create = useApiMutation(
    () =>
      apiClient.post('/avatar-training/programs', {
        title: title.trim(),
        description: description.trim() || undefined,
        category: category.trim() || undefined,
      }),
    {
      onSuccess: () => {
        notify({ title: 'Formação criada', intent: 'success' });
        onCreated();
        onClose();
      },
      onError: (e) =>
        notify({
          title: 'Não foi possível criar a formação',
          description: e.message,
          intent: 'danger',
        }),
    },
  );

  return (
    <Modal open onOpenChange={(o) => !o && onClose()}>
      <ModalContent
        title="Nova formação com avatar"
        description="Fica em rascunho até ser revista e publicada."
      >
        <div className="mt-4 space-y-3">
          <FormField label="Título" htmlFor="ap-title">
            <Input
              id="ap-title"
              value={title}
              maxLength={200}
              onChange={(e) => setTitle(e.target.value)}
            />
          </FormField>
          <FormField label="Descrição" htmlFor="ap-desc">
            <Textarea
              id="ap-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </FormField>
          <FormField label="Categoria" htmlFor="ap-cat">
            <Input
              id="ap-cat"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button intent="ghost" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              size="sm"
              loading={create.isPending}
              disabled={!title.trim()}
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

export function ProgramsTab() {
  const role = useCurrentRole();
  const notify = useToast();
  const isAuthor = !!role && AUTHOR_ROLES.includes(role);
  const isAdmin = !!role && ADMIN_ROLES.includes(role);
  const [showCreate, setShowCreate] = useState(false);

  const params = {};
  const key = queryKeys.avatarTraining.programs(params);
  const { data, isLoading, error, refetch } = useApiQuery<AvatarProgram[]>(
    key,
    '/avatar-training/programs',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const action = useApiMutation(
    (v: { id: number; verb: 'submit-review' | 'publish' | 'archive' }) =>
      apiClient.post(`/avatar-training/programs/${v.id}/${v.verb}`),
    {
      invalidateKeys: [key],
      onSuccess: () => notify({ title: 'Formação actualizada', intent: 'success' }),
      onError: (e) =>
        notify({
          title: 'Não foi possível actualizar',
          description: e.message,
          intent: 'danger',
        }),
    },
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
      {isAuthor && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus size={14} /> Nova formação
          </Button>
        </div>
      )}

      {data.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="Sem formações com avatar"
          description={
            isAuthor
              ? 'Crie a primeira formação para a poder atribuir a colaboradores.'
              : 'Ainda não existem formações publicadas para o seu perfil.'
          }
        />
      ) : (
        <div className="space-y-3">
          {data.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between gap-4 rounded-card border border-border bg-surface p-4"
            >
              <div className="min-w-0">
                <div className="truncate font-display text-sm font-semibold text-ink">
                  {p.title}
                </div>
                <div className="font-body text-xs text-ink-muted">
                  {p.code} · {EXPERIENCE_LABEL[p.experienceType]} · v{p.version}
                  {p._count ? ` · ${p._count.sessions} sessão(ões)` : ''}
                  {p.avatar ? ` · ${p.avatar.name}` : ''}
                  {p.course ? ` · curso: ${p.course.title}` : ''}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <StatusBadge value={p.status} map={PROGRAM_STATUS} variant="dot" />
                {isAuthor && p.status === 'DRAFT' && (
                  <Button
                    size="sm"
                    intent="secondary"
                    onClick={() => action.mutate({ id: p.id, verb: 'submit-review' })}
                  >
                    Submeter a revisão
                  </Button>
                )}
                {isAdmin && p.status === 'IN_REVIEW' && (
                  <Button
                    size="sm"
                    onClick={() => action.mutate({ id: p.id, verb: 'publish' })}
                  >
                    Publicar
                  </Button>
                )}
                {isAuthor && p.status !== 'ARCHIVED' && (
                  <Button
                    size="sm"
                    intent="ghost"
                    onClick={() => action.mutate({ id: p.id, verb: 'archive' })}
                  >
                    Arquivar
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateProgramModal
          onClose={() => setShowCreate(false)}
          onCreated={() => refetch()}
        />
      )}
    </div>
  );
}
