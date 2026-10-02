// components/departments/HeadsView.tsx
// Separador "Responsáveis" (docs/modulo_departments.md Ponto 4) — gestão das
// pessoas que lideram os departamentos, agregado entre toda a organização
// (distinto do histórico por-departamento já mostrado em DetailView).

'use client';

import { useState } from 'react';
import { History, List as ListIcon, UserCog } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { ADMIN_ROLES } from '@/lib/roles';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
import { ChangeHeadModal } from './ChangeHeadModal';
import type { HeadHistoryRow, HeadRow } from './types';

type SubTab = 'current' | 'history';

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
  ARCHIVED: 'Arquivado',
};

function fmtDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString('pt-AO') : '—';
}

export function HeadsView() {
  const [subTab, setSubTab] = useState<SubTab>('current');
  const [changing, setChanging] = useState<HeadRow | null>(null);
  const role = useCurrentRole();
  const canManage = !!role && ADMIN_ROLES.includes(role);

  const {
    data: heads = [],
    isLoading: loadingHeads,
    error: headsError,
  } = useApiQuery<HeadRow[]>(queryKeys.departments.heads(), '/departments/heads', {
    staleTime: STALE_TIME.DYNAMIC,
    enabled: subTab === 'current',
  });

  const {
    data: history = [],
    isLoading: loadingHistory,
    error: historyError,
  } = useApiQuery<HeadHistoryRow[]>(
    queryKeys.departments.headsHistory(),
    '/departments/heads/history',
    { staleTime: STALE_TIME.DYNAMIC, enabled: subTab === 'history' },
  );

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setSubTab('current')}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
            subTab === 'current'
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border bg-white text-ink-muted hover:text-ink'
          }`}
        >
          <ListIcon size={14} strokeWidth={1.75} />
          Responsáveis actuais
        </button>
        <button
          type="button"
          onClick={() => setSubTab('history')}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
            subTab === 'history'
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border bg-white text-ink-muted hover:text-ink'
          }`}
        >
          <History size={14} strokeWidth={1.75} />
          Histórico
        </button>
      </div>

      {subTab === 'current' && (
        <>
          {loadingHeads ? (
            <Skeleton
              rows={6}
              wrapperClassName="space-y-2 animate-pulse"
              itemClassName="h-12 rounded-card bg-surface-sunken"
            />
          ) : headsError ? (
            <div className="text-sm text-danger">{headsError.message}</div>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Departamento</TableHeaderCell>
                  <TableHeaderCell>Responsável</TableHeaderCell>
                  <TableHeaderCell>Cargo</TableHeaderCell>
                  <TableHeaderCell>Substituto</TableHeaderCell>
                  <TableHeaderCell>Desde</TableHeaderCell>
                  <TableHeaderCell>Estado</TableHeaderCell>
                  <TableHeaderCell>Contacto</TableHeaderCell>
                  <TableHeaderCell>Colaboradores</TableHeaderCell>
                  <TableHeaderCell>Subdeptos</TableHeaderCell>
                  {canManage && <TableHeaderCell>Acções</TableHeaderCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {heads.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={canManage ? 10 : 9}
                      className="py-8 text-center text-ink-faint"
                    >
                      Sem departamentos activos
                    </TableCell>
                  </TableRow>
                ) : (
                  heads.map((row) => (
                    <TableRow key={row.departmentId}>
                      <TableCell>
                        <span className="text-sm font-medium text-ink">
                          {row.departmentName}
                        </span>
                        <span className="ml-1.5 font-mono text-xs text-ink-faint">
                          {row.departmentCode}
                        </span>
                      </TableCell>
                      <TableCell>
                        {row.head ? (
                          <span className="flex items-center gap-2">
                            <Avatar name={row.head.fullName} size="sm" />
                            <span className="text-sm text-ink">{row.head.fullName}</span>
                          </span>
                        ) : (
                          <span className="text-sm text-ink-faint">Por atribuir</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-ink-muted">
                        {row.position ?? '—'}
                      </TableCell>
                      <TableCell className="text-sm text-ink-muted">
                        {row.deputyHead?.fullName ?? '—'}
                      </TableCell>
                      <TableCell className="text-xs text-ink-muted">
                        {fmtDate(row.startedAt)}
                      </TableCell>
                      <TableCell>
                        <Badge intent={row.active ? 'success' : 'neutral'}>
                          {STATUS_LABEL[row.status] ?? row.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-ink-muted">
                        {row.contact ?? '—'}
                      </TableCell>
                      <TableCell className="text-sm text-ink-muted">
                        {row.usersUnderResponsibility}
                      </TableCell>
                      <TableCell className="text-sm text-ink-muted">
                        {row.subdepartmentsUnderResponsibility}
                      </TableCell>
                      {canManage && (
                        <TableCell>
                          <Button
                            size="sm"
                            intent="ghost"
                            onClick={() => setChanging(row)}
                          >
                            <UserCog size={14} strokeWidth={1.75} />
                            Alterar
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </>
      )}

      {subTab === 'history' && (
        <>
          {loadingHistory ? (
            <Skeleton
              rows={6}
              wrapperClassName="space-y-2 animate-pulse"
              itemClassName="h-12 rounded-card bg-surface-sunken"
            />
          ) : historyError ? (
            <div className="text-sm text-danger">{historyError.message}</div>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Departamento</TableHeaderCell>
                  <TableHeaderCell>Responsável anterior</TableHeaderCell>
                  <TableHeaderCell>Novo responsável</TableHeaderCell>
                  <TableHeaderCell>Data da alteração</TableHeaderCell>
                  <TableHeaderCell>Motivo</TableHeaderCell>
                  <TableHeaderCell>Alterado por</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-ink-faint">
                      Sem alterações de responsável registadas
                    </TableCell>
                  </TableRow>
                ) : (
                  history.map((h) => (
                    <TableRow key={h.id}>
                      <TableCell className="text-sm text-ink">
                        {h.department.name}
                      </TableCell>
                      <TableCell className="text-sm text-ink-muted">
                        {h.previousHead?.fullName ?? '—'}
                      </TableCell>
                      <TableCell className="text-sm text-ink">
                        {h.newHead.fullName}
                      </TableCell>
                      <TableCell className="text-xs text-ink-muted">
                        {fmtDate(h.changedAt)}
                      </TableCell>
                      <TableCell className="text-sm text-ink-muted">
                        {h.reason ?? '—'}
                      </TableCell>
                      <TableCell className="text-sm text-ink-muted">
                        {h.changedBy?.fullName ?? '—'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </>
      )}

      {changing && (
        <ChangeHeadModal row={changing} onClose={() => setChanging(null)} />
      )}
    </div>
  );
}
