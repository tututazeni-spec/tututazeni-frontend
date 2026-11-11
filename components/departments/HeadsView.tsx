// components/departments/HeadsView.tsx
// Separador "Responsáveis" (docs/modulo_departments.md Ponto 4) — gestão das
// pessoas que lideram os departamentos, agregado entre toda a organização
// (distinto do histórico por-departamento já mostrado em DetailView).

'use client';

import { useState } from 'react';
import { History, List as ListIcon, UserCog } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useHasRole } from '@/hooks/useCurrentRole';
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
import { departmentIcon } from './departmentIcon';
import type { HeadHistoryRow, HeadRow } from './types';
import { formatDateNumeric } from '@/lib/format';

type SubTab = 'current' | 'history';

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
  ARCHIVED: 'Arquivado',
};

export function HeadsView() {
  const [subTab, setSubTab] = useState<SubTab>('current');
  const [changing, setChanging] = useState<HeadRow | null>(null);
  const canManage = useHasRole(ADMIN_ROLES);

  const {
    data: heads = [],
    isLoading: loadingHeads,
    error: headsError,
  } = useApiQuery<HeadRow[]>(
    queryKeys.departments.heads(),
    '/departments/heads',
    {
      staleTime: STALE_TIME.DYNAMIC,
      enabled: subTab === 'current',
    },
  );

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
      <div className="mb-4 flex h-10 items-center gap-2 rounded-[14px] bg-[#EAF1FC] px-3">
        {(
          [
            ['current', ListIcon, 'Responsáveis actuais'],
            ['history', History, 'Histórico'],
          ] as const
        ).map(([tab, Icon, label]) => (
          <button
            key={tab}
            type="button"
            onClick={() => setSubTab(tab)}
            className={`flex items-center gap-1.5 rounded-control px-3 py-1 text-xs font-medium uppercase transition-colors ${
              subTab === tab
                ? 'bg-brand text-white'
                : 'text-brand hover:bg-white'
            }`}
          >
            <Icon size={14} strokeWidth={1.75} />
            {label}
          </button>
        ))}
      </div>

      {subTab === 'current' && (
        <>
          {loadingHeads ? (
            <Skeleton
              rows={6}
              wrapperClassName="space-y-2"
              itemClassName="h-12 rounded-card bg-surface-sunken"
            />
          ) : headsError ? (
            <div className="text-sm text-danger">{headsError.message}</div>
          ) : (
            <Table
              wrapperClassName="overflow-x-visible"
              className="table-fixed [&_td]:break-words [&_td]:px-1.5 [&_td]:py-2 [&_td]:align-middle [&_td]:text-[11px] [&_th]:px-1.5 [&_th]:py-2 [&_th]:text-[10px] [&_th]:leading-tight [&_th]:[overflow-wrap:anywhere]"
            >
              <TableHead className="bg-[#DCE8FA] [&_th]:text-brand">
                <TableRow className="hover:bg-transparent">
                  <TableHeaderCell className="w-[13%]">
                    Departamento
                  </TableHeaderCell>
                  <TableHeaderCell className="w-[14%] !pl-5">
                    Responsável
                  </TableHeaderCell>
                  <TableHeaderCell className="w-[10%]">Cargo</TableHeaderCell>
                  <TableHeaderCell className="w-[11%]">
                    Substituto
                  </TableHeaderCell>
                  <TableHeaderCell className="w-[8%]">Desde</TableHeaderCell>
                  <TableHeaderCell className="w-[8%]">Estado</TableHeaderCell>
                  <TableHeaderCell className="w-[10%]">
                    Contacto
                  </TableHeaderCell>
                  <TableHeaderCell className="w-[11%]">
                    Colaboradores
                  </TableHeaderCell>
                  <TableHeaderCell className="w-[9%]">
                    Subdeptos
                  </TableHeaderCell>
                  {canManage && (
                    <TableHeaderCell className="w-[6%] whitespace-nowrap">
                      Acções
                    </TableHeaderCell>
                  )}
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
                        <span className="flex items-center gap-1.5">
                          <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand text-white">
                            {(() => {
                              const Icon = departmentIcon(
                                row.departmentName,
                                row.subdepartmentsUnderResponsibility > 0,
                              );
                              return <Icon size={13} strokeWidth={1.75} />;
                            })()}
                          </span>
                          <span className="text-[11px] font-bold leading-tight text-brand">
                            {row.departmentName}
                          </span>
                        </span>
                      </TableCell>
                      <TableCell className="!pl-5">
                        {row.head ? (
                          <span className="flex items-center gap-1">
                            <Avatar name={row.head.fullName} size="sm" />
                            <span className="text-[11px] leading-tight text-ink">
                              {row.head.fullName}
                            </span>
                          </span>
                        ) : (
                          <span className="text-xs text-ink-faint">
                            Por atribuir
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-ink-muted">
                        {row.position ?? '—'}
                      </TableCell>
                      <TableCell className="text-ink-muted">
                        {row.deputyHead?.fullName ?? '—'}
                      </TableCell>
                      <TableCell className="text-ink-muted">
                        {formatDateNumeric(row.startedAt)}
                      </TableCell>
                      <TableCell>
                        <Badge intent={row.active ? 'success' : 'neutral'}>
                          {STATUS_LABEL[row.status] ?? row.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-ink-muted">
                        <span className="break-all">{row.contact ?? '—'}</span>
                      </TableCell>
                      <TableCell className="text-ink-muted">
                        {row.usersUnderResponsibility}
                      </TableCell>
                      <TableCell className="text-ink-muted">
                        {row.subdepartmentsUnderResponsibility}
                      </TableCell>
                      {canManage && (
                        <TableCell>
                          <Button
                            size="sm"
                            intent="ghost"
                            title="Alterar responsável"
                            aria-label="Alterar responsável"
                            onClick={() => setChanging(row)}
                          >
                            <UserCog size={14} strokeWidth={1.75} />
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
              wrapperClassName="space-y-2"
              itemClassName="h-12 rounded-card bg-surface-sunken"
            />
          ) : historyError ? (
            <div className="text-sm text-danger">{historyError.message}</div>
          ) : (
            <Table>
              <TableHead className="bg-[#DCE8FA] [&_th]:text-brand">
                <TableRow className="hover:bg-transparent">
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
                    <TableCell
                      colSpan={6}
                      className="py-8 text-center text-ink-faint"
                    >
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
                        {formatDateNumeric(h.changedAt)}
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
