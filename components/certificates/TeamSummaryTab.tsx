// components/certificates/TeamSummaryTab.tsx
// Visão consolidada das certificações da equipa. O gestor vê sempre e só a sua
// equipa directa; ADMIN/RH/AUDITOR escolhem um departamento. O âmbito é aplicado
// no backend — esta vista só mostra o que o servidor devolve.

'use client';

import { useState } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { EmptyState } from '@/components/ui/EmptyState';
import { KpiCard } from '@/components/ui/KpiCard';
import { QueryError } from '@/components/ui/QueryError';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
import type { TeamSummary } from './types';

export function TeamSummaryTab({
  pickDepartment = false,
}: {
  pickDepartment?: boolean;
}) {
  const [departmentId, setDepartmentId] = useState('');

  const deptParams = { limit: 200 };
  const depts = useApiQuery<{ data: { id: number; name: string }[] }>(
    queryKeys.departments.list(deptParams),
    '/departments',
    {
      params: deptParams,
      staleTime: STALE_TIME.SEMI_STATIC,
      enabled: pickDepartment,
    },
  );

  const ready = !pickDepartment || !!departmentId;
  const deptNumber = departmentId ? Number(departmentId) : undefined;
  const { data, isLoading, error, refetch } = useApiQuery<TeamSummary>(
    queryKeys.certificates.teamSummary(deptNumber),
    '/certificates/team/summary',
    {
      params:
        pickDepartment && deptNumber ? { departmentId: deptNumber } : undefined,
      staleTime: STALE_TIME.DYNAMIC,
      enabled: ready,
    },
  );

  const picker = pickDepartment && (
    <div className="max-w-xs">
      <Select
        items={(depts.data?.data ?? []).map((d) => ({
          value: String(d.id),
          label: d.name,
        }))}
        value={departmentId}
        onValueChange={setDepartmentId}
        placeholder="Escolher departamento…"
      />
    </div>
  );

  if (!ready) {
    return (
      <div className="space-y-4">
        {picker}
        <EmptyState
          title="Escolha um departamento"
          description="Escolha o departamento para ver as certificações dos seus colaboradores."
        />
      </div>
    );
  }
  if (isLoading) return <Skeleton rows={3} />;
  if (error || !data)
    return <QueryError error={error} onRetry={() => void refetch()} />;

  const t = data.totals;
  const empty = pickDepartment
    ? 'Sem colaboradores neste departamento'
    : 'Sem colaboradores na sua equipa';

  return (
    <div className="space-y-5">
      {picker}
      {data.members.length === 0 ? (
        <EmptyState
          title={empty}
          description="Quando houver colaboradores, as suas certificações aparecem aqui."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard
              href="/users"
              label="Colaboradores"
              value={t.members}
              intent="primary"
            />
            <KpiCard
              label="Cobertura obrigatória"
              value={
                t.mandatoryCoveragePct === null
                  ? '—'
                  : `${t.mandatoryCoveragePct}%`
              }
              sub="Obrigatórias concluídas com certificado válido"
              intent="success"
            />
            <KpiCard
              label="Certificados válidos"
              value={t.active}
              intent="success"
            />
            <KpiCard label="Expirados" value={t.expired} intent="warning" />
            <KpiCard
              label="Vencem em 30 dias"
              value={t.expiringSoon}
              intent="warning"
            />
            <KpiCard
              label="Aguardam aprovação"
              value={t.pendingApproval}
              intent="info"
            />
            <KpiCard
              label="Obrigatórias por concluir"
              value={t.mandatoryPending}
              intent="danger"
            />
            <KpiCard label="Em formação" value={t.inProgress} intent="info" />
          </div>
          <Table>
            <TableHead className="bg-brand/60 [&_th]:text-white">
              <TableRow className="hover:bg-transparent">
                <TableHeaderCell>Colaborador</TableHeaderCell>
                <TableHeaderCell>Válidos</TableHeaderCell>
                <TableHeaderCell>Expirados</TableHeaderCell>
                <TableHeaderCell>A vencer</TableHeaderCell>
                <TableHeaderCell>Aguardam aprovação</TableHeaderCell>
                <TableHeaderCell>Obrigatórias por concluir</TableHeaderCell>
                <TableHeaderCell>Em formação</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.members.map((m) => (
                <TableRow key={m.userId}>
                  <TableCell>{m.fullName}</TableCell>
                  <TableCell>{m.active}</TableCell>
                  <TableCell>{m.expired}</TableCell>
                  <TableCell>{m.expiringSoon}</TableCell>
                  <TableCell>{m.pendingApproval}</TableCell>
                  <TableCell>{m.mandatoryPending}</TableCell>
                  <TableCell>{m.inProgress}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </div>
  );
}
