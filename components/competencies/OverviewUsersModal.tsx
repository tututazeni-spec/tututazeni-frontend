// components/competencies/OverviewUsersModal.tsx
// Visão Geral → clique numa competência (maior lacuna ou Top competências):
// lista os utilizadores com lacuna e os utilizadores que a têm avaliada.
// Consome GET /competencies/overview/:id/users (ADMIN/RH/GESTOR).

'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { NativeSelect } from '@/components/ui/NativeSelect';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { LEVEL_LABELS } from './constants';
import type { OverviewCompetencyUser, OverviewCompetencyUsers } from './types';

export interface OverviewUsersModalProps {
  competencyId: number;
  competencyName: string;
  /** 'gap' = só utilizadores com lacuna; 'top' = só utilizadores com a competência. */
  mode: 'gap' | 'top';
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
  mode,
  onClose,
}: OverviewUsersModalProps) {
  const [department, setDepartment] = useState('');
  const deptParams = { limit: 200 };
  const allDepartments = useApiQuery<{ data: { id: number; name: string }[] }>(
    queryKeys.departments.list(deptParams),
    '/departments',
    { params: deptParams, staleTime: STALE_TIME.SEMI_STATIC },
  );
  const { data, isLoading, error } = useApiQuery<OverviewCompetencyUsers>(
    queryKeys.competencies.overviewUsers(competencyId),
    `/competencies/overview/${competencyId}/users`,
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const source = data
    ? mode === 'gap'
      ? data.withGap
      : data.withCompetency
    : [];
  // Todos os departamentos da organização; os dos utilizadores listados
  // entram também (caso o perfil não tenha acesso a GET /departments).
  const departments = Array.from(
    new Set([
      ...(allDepartments.data?.data ?? []).map((d) => d.name),
      ...source.map((u) => u.department).filter((d): d is string => !!d),
    ]),
  ).sort((a, b) => a.localeCompare(b, 'pt'));
  const visible = department
    ? source.filter((u) => u.department === department)
    : source;

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title={competencyName}
        description={
          mode === 'gap'
            ? 'Utilizadores com lacuna nesta competência'
            : 'Utilizadores com esta competência'
        }
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
            <NativeSelect
              aria-label="Filtrar por departamento"
              density="sm"
              className="mt-4"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            >
              <option value="">Todos os departamentos</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </NativeSelect>
            <UserList
              title={
                mode === 'gap'
                  ? 'Utilizadores com lacuna'
                  : 'Utilizadores com a competência'
              }
              users={visible}
              emptyText={
                mode === 'gap'
                  ? 'Nenhum utilizador abaixo do nível alvo.'
                  : 'Nenhum utilizador tem esta competência avaliada.'
              }
              showGap={mode === 'gap'}
            />
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
