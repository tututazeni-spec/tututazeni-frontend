// components/onboarding/AssignTeamMemberModal.tsx
// Atribui (ou remove) o gestor directo, o buddy ou o RH responsável de um
// plano de integração. PATCH /onboarding/:id/team — só ADMIN/RH.
// Só lista quem pode ocupar o papel (GET /onboarding/:id/team-candidates):
// gestor directo = mesmo departamento do colaborador, RH responsável = perfil
// RH, buddy/mentor = qualquer colaborador.

'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useToast } from '@/providers/ToastProvider';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { STALE_TIME } from '@/lib/queryClient';
import type { DirectoryUser } from '@/components/users/types';
import type { TeamRole } from './TeamMemberCard';

export const TEAM_FIELD: Record<
  TeamRole,
  'managerId' | 'buddyId' | 'hrResponsibleId'
> = {
  manager: 'managerId',
  buddy: 'buddyId',
  hr: 'hrResponsibleId',
};

export interface AssignTeamMemberModalProps {
  planId: number;
  role: TeamRole;
  label: string;
  /** Pessoa actualmente atribuída (para oferecer "Remover"). */
  hasPerson: boolean;
  onClose: () => void;
}

export function AssignTeamMemberModal({
  planId,
  role,
  label,
  hasPerson,
  onClose,
}: AssignTeamMemberModalProps) {
  const notify = useToast();
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const debounced = useDebounce(search);
  const params = { role, search: debounced || undefined };
  const { data, isLoading: loading } = useApiQuery<DirectoryUser[]>(
    [...queryKeys.onboarding.all, 'team-candidates', planId, role, debounced],
    `/onboarding/${planId}/team-candidates`,
    { params, staleTime: STALE_TIME.DYNAMIC },
  );
  const users = (data ?? []).filter((u) => u != null && u.id != null);
  const RULE: Record<TeamRole, string> = {
    manager: 'Só aparecem colaboradores do mesmo departamento.',
    hr: 'Só aparecem utilizadores do RH.',
    buddy: 'Podes escolher qualquer colaborador.',
  };

  const save = useApiMutation(
    (userId: number | null) =>
      apiClient.patch(`/onboarding/${planId}/team`, {
        [TEAM_FIELD[role]]: userId,
      }),
    {
      invalidateKeys: [queryKeys.onboarding.all],
      onSuccess: (_d, userId) => {
        notify({
          title: userId === null ? `${label} removido` : `${label} atribuído`,
          intent: 'success',
        });
        onClose();
      },
      onError: (e) =>
        setError(e.message || 'Erro ao guardar. Tente novamente.'),
    },
  );

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title={`Atribuir ${label.toLowerCase()}`}
        description={`${RULE[role]} Pesquisa pelo nome ou email.`}
        className="max-w-md max-h-[90vh] overflow-y-auto"
      >
        <div className="mt-5 space-y-3">
          {error && (
            <div className="flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
              <AlertCircle size={16} strokeWidth={1.75} />
              {error}
            </div>
          )}
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
            placeholder="Pesquisar por nome ou email…"
            autoComplete="off"
          />
          <div className="max-h-56 overflow-y-auto rounded-card border border-border bg-surface">
            {loading && (
              <div className="px-3 py-2 text-sm text-ink-muted">
                A pesquisar…
              </div>
            )}
            {!loading && users.length === 0 && (
              <EmptyState
                variant="inline"
                title={
                  role === 'manager'
                    ? 'Nenhum colaborador do mesmo departamento'
                    : role === 'hr'
                      ? 'Nenhum utilizador do RH encontrado'
                      : 'Nenhum colaborador encontrado'
                }
              />
            )}
            {users.map((u) => (
              <Button
                key={u.id}
                intent="ghost"
                disabled={save.isPending}
                onClick={() => {
                  setError('');
                  save.mutate(u.id);
                }}
                className="h-auto w-full justify-start gap-2 rounded-none px-3 py-2 text-left"
              >
                <Avatar
                  name={u.fullName}
                  url={u.avatarUrl ?? undefined}
                  size="sm"
                />
                <span className="min-w-0">
                  <span className="block truncate text-sm text-ink">
                    {u.fullName}
                  </span>
                  <span className="block truncate text-xs text-ink-faint">
                    {u.department?.name ?? u.email ?? '—'}
                  </span>
                </span>
              </Button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-4">
          {hasPerson ? (
            <Button
              intent="danger"
              disabled={save.isPending}
              onClick={() => {
                setError('');
                save.mutate(null);
              }}
            >
              Remover
            </Button>
          ) : (
            <span />
          )}
          <Button intent="ghost" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
