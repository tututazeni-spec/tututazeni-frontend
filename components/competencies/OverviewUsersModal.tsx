// components/competencies/OverviewUsersModal.tsx
// Visão Geral → clique numa competência (maior lacuna ou Top competências):
// lista os utilizadores com lacuna e os utilizadores que a têm avaliada.
// Consome GET /competencies/overview/:id/users (ADMIN/RH/GESTOR).

'use client';

import { AlertCircle } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { LEVEL_LABELS } from './constants';
import type { OverviewCompetencyUser, OverviewCompetencyUsers } from './types';

export interface OverviewUsersModalProps {
  competencyId: number;
  competencyName: string;
  onClose: () => void;
}

function UserList({
  title,
  users,
  emptyText,
  showGap,
}: {
  title: string;
  users: OverviewCompetencyUser[];
  emptyText: string;
  showGap: boolean;
}) {
  return (
    <section className="mt-5">
      <h3 className="mb-2 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
        {title} ({users.length})
      </h3>
      {users.length === 0 ? (
        <p className="rounded-card border border-border px-3 py-3 font-body text-sm text-ink-muted">
          {emptyText}
        </p>
      ) : (
        <ul className="max-h-64 overflow-y-auto rounded-card border border-border">
          {users.map((u) => (
            <li
              key={u.userId}
              className="flex items-center gap-3 border-b border-border px-3 py-2 last:border-0"
            >
              <Avatar name={u.fullName} url={u.avatarUrl ?? undefined} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-body text-sm font-medium text-ink">
                  {u.fullName}
                </div>
                <div className="truncate font-body text-xs text-ink-faint">
                  {[u.position, u.department].filter(Boolean).join(' · ') ||
                    '—'}
                </div>
              </div>
              <div className="text-right font-body text-xs text-ink-muted">
                <div>
                  Nível {u.currentLevel} ({LEVEL_LABELS[u.currentLevel] ?? '—'})
                </div>
                {showGap && u.targetLevel != null && (
                  <div className="text-danger">Alvo {u.targetLevel}</div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function OverviewUsersModal({
  competencyId,
  competencyName,
  onClose,
}: OverviewUsersModalProps) {
  const { data, isLoading, error } = useApiQuery<OverviewCompetencyUsers>(
    queryKeys.competencies.overviewUsers(competencyId),
    `/competencies/overview/${competencyId}/users`,
    { staleTime: STALE_TIME.DYNAMIC },
  );

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title={competencyName}
        description="Utilizadores com lacuna e utilizadores com esta competência"
        className="max-h-[90vh] max-w-xl overflow-y-auto"
      >
        {isLoading ? (
          <div className="mt-5">
            <Skeleton rows={4} />
          </div>
        ) : error || !data ? (
          <div className="mt-5 flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
            <AlertCircle size={16} strokeWidth={1.75} />
            Não foi possível carregar os utilizadores.
          </div>
        ) : (
          <>
            <UserList
              title="Utilizadores com lacuna"
              users={data.withGap}
              emptyText="Nenhum utilizador abaixo do nível alvo."
              showGap
            />
            <UserList
              title="Utilizadores com a competência"
              users={data.withCompetency}
              emptyText="Nenhum utilizador tem esta competência avaliada."
              showGap={false}
            />
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
