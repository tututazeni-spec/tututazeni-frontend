// components/courses/CohortAttendanceReportView.tsx
// Relatório de assiduidade da turma: indicadores gerais, critério de cálculo
// (mínimo configurável), tabela individual e exportação (Excel / CSV / PDF).

'use client';

import { useEffect, useState } from 'react';
import {
  CalendarCheck,
  Download,
  Percent,
  UserCheck,
  UserX,
  Users,
} from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { downloadFromApi } from '@/lib/download';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useToast } from '@/providers/ToastProvider';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Input } from '@/components/ui/Input';
import { KpiCard } from '@/components/ui/KpiCard';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
import { sessionDay } from './CohortSessionsPanel';
import { Skeleton } from './shared';
import type { CohortAttendanceReport } from './types';

const pct = (r: number | null) => (r === null ? 'Ainda sem dados' : `${r}%`);

export interface CohortAttendanceReportViewProps {
  cohortId: number;
  isPrivileged: boolean;
}

export function CohortAttendanceReportView({
  cohortId,
  isPrivileged,
}: CohortAttendanceReportViewProps) {
  const toast = useToast();
  const [exporting, setExporting] = useState(false);
  const [min, setMin] = useState('');
  const [excludeExcused, setExcludeExcused] = useState(true);

  const { data: report, isLoading } = useApiQuery<CohortAttendanceReport>(
    queryKeys.courses.cohortAttendanceReport(cohortId),
    `/courses/cohorts/${cohortId}/attendance-report`,
    { staleTime: STALE_TIME.DYNAMIC },
  );

  useEffect(() => {
    if (!report) return;
    setMin(String(report.criteria.minAttendancePercent));
    setExcludeExcused(report.criteria.excludeExcusedFromTotal);
  }, [report]);

  const savePolicy = useApiMutation(
    (body: {
      minAttendancePercent: number;
      excludeExcusedFromTotal: boolean;
    }) =>
      apiClient.patch(`/courses/cohorts/${cohortId}/attendance-policy`, body),
    {
      invalidateKeys: [
        queryKeys.courses.cohortAttendanceReport(cohortId),
        queryKeys.courses.cohortDetail(cohortId),
      ],
      onSuccess: () =>
        toast({ title: 'Critério de assiduidade guardado', intent: 'success' }),
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  function submitPolicy() {
    const n = Number(min);
    if (!Number.isInteger(n) || n < 0 || n > 100) {
      toast({
        title: 'O mínimo tem de ser um número entre 0 e 100',
        intent: 'danger',
      });
      return;
    }
    savePolicy.mutate({
      minAttendancePercent: n,
      excludeExcusedFromTotal: excludeExcused,
    });
  }

  async function exportReport(format: 'xlsx' | 'csv' | 'pdf') {
    setExporting(true);
    try {
      await downloadFromApi(
        `/courses/cohorts/${cohortId}/attendance-report/export`,
        { params: { format }, fallbackName: `assiduidade.${format}` },
      );
    } catch (e) {
      toast({
        title: e instanceof Error ? e.message : 'Não foi possível exportar.',
        intent: 'danger',
      });
    } finally {
      setExporting(false);
    }
  }

  if (isLoading || !report) return <Skeleton rows={4} />;
  const g = report.general;

  return (
    <section className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          icon={Users}
          label="Inscritos"
          value={g.enrolled}
          intent="primary"
        />
        <KpiCard
          icon={CalendarCheck}
          label="Sessões realizadas"
          value={g.sessionsCompleted}
          sub={
            g.sessionsCancelled > 0
              ? `${g.sessionsCancelled} cancelada(s)`
              : undefined
          }
          intent="info"
        />
        <KpiCard
          icon={Percent}
          label="Taxa média de presença"
          value={pct(g.averageRate)}
          sub={`Mínimo ${report.criteria.minAttendancePercent}%`}
          intent={
            g.averageRate === null
              ? 'info'
              : g.averageRate >= report.criteria.minAttendancePercent
                ? 'success'
                : 'warning'
          }
        />
        <KpiCard
          icon={g.belowMinimum > 0 ? UserX : UserCheck}
          label="Abaixo do mínimo"
          value={g.belowMinimum}
          intent={g.belowMinimum > 0 ? 'danger' : 'success'}
        />
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        <Badge intent="success">Presenças: {g.present}</Badge>
        <Badge intent="warning">Atrasos: {g.late}</Badge>
        <Badge intent="danger">Faltas: {g.absent}</Badge>
        <Badge intent="info">Justificadas: {g.justified}</Badge>
        <Badge intent="neutral">Sem registo: {g.unmarked}</Badge>
      </div>

      <div className="space-y-3 rounded-card border border-border p-4">
        <h4 className="text-sm font-medium text-ink">
          Critério de assiduidade
        </h4>
        <p className="text-xs text-ink-muted">
          Presente e Atrasado contam como presença. Só entram sessões
          concluídas; sessões canceladas ficam de fora. Sessão concluída sem
          registo conta como falta. {report.criteria.note}
        </p>
        {isPrivileged && (
          <div className="flex flex-wrap items-end gap-3">
            <label className="space-y-1 text-xs text-ink-muted">
              Presença mínima (%) — predefinição 75
              <Input
                type="number"
                min={0}
                max={100}
                value={min}
                onChange={(e) => setMin(e.target.value)}
                className="w-28"
              />
            </label>
            <label className="flex items-center gap-2 pb-3 text-sm text-ink">
              <Checkbox
                checked={excludeExcused}
                onChange={(e) => setExcludeExcused(e.target.checked)}
              />
              Faltas justificadas não entram no total de sessões
            </label>
            <Button
              size="sm"
              onClick={submitPolicy}
              loading={savePolicy.isPending}
            >
              Guardar critério
            </Button>
          </div>
        )}
      </div>

      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-sm font-medium text-ink">
            Relatório individual
            {report.period.from && (
              <span className="ml-2 font-normal text-ink-muted">
                {sessionDay(report.period.from)} a{' '}
                {sessionDay(report.period.to ?? report.period.from)}
              </span>
            )}
          </h4>
          <div className="flex gap-2" role="group" aria-label="Exportar">
            {(['xlsx', 'csv', 'pdf'] as const).map((f) => (
              <Button
                key={f}
                size="sm"
                intent="secondary"
                disabled={exporting}
                onClick={() => void exportReport(f)}
              >
                <Download size={14} strokeWidth={1.75} className="mr-1" />
                {f === 'xlsx' ? 'Excel' : f.toUpperCase()}
              </Button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHead className="bg-brand/60">
              <TableRow className="hover:bg-transparent">
                <TableHeaderCell className="text-white">
                  Participante
                </TableHeaderCell>
                <TableHeaderCell className="text-center text-white">
                  Sessões
                </TableHeaderCell>
                <TableHeaderCell className="text-center text-white">
                  Presenças
                </TableHeaderCell>
                <TableHeaderCell className="text-center text-white">
                  Atrasos
                </TableHeaderCell>
                <TableHeaderCell className="text-center text-white">
                  Faltas
                </TableHeaderCell>
                <TableHeaderCell className="text-center text-white">
                  Justificadas
                </TableHeaderCell>
                <TableHeaderCell className="text-center text-white">
                  % presença
                </TableHeaderCell>
                <TableHeaderCell className="text-white">
                  Situação
                </TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {report.participants.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-ink-muted">
                    Ainda sem participantes inscritos.
                  </TableCell>
                </TableRow>
              )}
              {report.participants.map((p) => (
                <TableRow key={p.userId}>
                  <TableCell>
                    <div className="text-ink">{p.fullName}</div>
                    <div className="text-xs text-ink-faint">{p.identifier}</div>
                  </TableCell>
                  <TableCell className="text-center tabular-nums">
                    {p.eligibleSessions}
                  </TableCell>
                  <TableCell className="text-center tabular-nums">
                    {p.present}
                  </TableCell>
                  <TableCell className="text-center tabular-nums">
                    {p.late}
                  </TableCell>
                  <TableCell className="text-center tabular-nums">
                    {p.absent}
                  </TableCell>
                  <TableCell className="text-center tabular-nums">
                    {p.justified}
                  </TableCell>
                  <TableCell className="text-center font-medium tabular-nums">
                    {pct(p.rate)}
                  </TableCell>
                  <TableCell>
                    {p.meetsMinimum === null ? (
                      <Badge intent="neutral">Ainda sem dados</Badge>
                    ) : p.meetsMinimum ? (
                      <Badge intent="success">Cumpre o mínimo</Badge>
                    ) : (
                      <Badge intent="danger">Abaixo do mínimo</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className="mt-2 text-xs text-ink-faint">
          Emitido em {new Date(report.generatedAt).toLocaleString('pt-PT')}.
        </p>
      </div>
    </section>
  );
}
