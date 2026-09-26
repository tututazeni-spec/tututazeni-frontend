// components/roi-impact/ReportsTab.tsx
// Tab "Relatórios" (docs/roi-impact.md §10): os 11 relatórios do spec como
// vistas de leitura sobre RoiAnalysis/ImpactRecord/TrainingPlan/
// OnboardingPlan/LeadershipProgramParticipant — nunca duplica dados de
// origem. Exportação real em XLSX/PDF onde o backend a implementa
// (roi-reports.controller.ts); PowerPoint não está implementado (sem
// biblioteca .pptx no projecto).

'use client';

import { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { API_URL } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
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
import { fmt$, INITIATIVE_TYPE_LABELS, ROI_REPORT_LABELS } from './utils';
import type {
  ExecutiveData,
  ImpactByIndicatorData,
  InsufficientDataReportData,
  LeadershipEngagementReportData,
  OnboardingRetentionReportData,
  RoiByDimensionData,
  RoiConsolidatedData,
  RoiEvolutionReportData,
  RoiInitiativeType,
  RoiReportFilter,
  RoiReportKey,
  TopInitiativesReportData,
  TrainingPlansExecutionData,
} from './types';

const REPORT_ITEMS = (Object.keys(ROI_REPORT_LABELS) as RoiReportKey[]).map((key) => ({
  value: key,
  label: ROI_REPORT_LABELS[key],
}));

const INITIATIVE_TYPE_ITEMS = [
  { value: '', label: 'Todos os tipos' },
  ...Object.entries(INITIATIVE_TYPE_LABELS).map(([value, label]) => ({ value, label })),
];

const XLSX_REPORTS: Partial<Record<RoiReportKey, string>> = {
  'roi-by-dimension': 'roi-by-dimension/export/xlsx',
  'budget-execution': 'budget-execution/export/xlsx',
  'top-initiatives': 'top-initiatives/export/xlsx',
};

async function downloadReportFile(path: string, filename: string): Promise<void> {
  const res = await fetch(`${API_URL}/roi-impact/reports/${path}`, { credentials: 'include' });
  if (!res.ok) throw new Error('Erro ao gerar o ficheiro');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function ReportsTab() {
  const notify = useToast();
  const [reportKey, setReportKey] = useState<RoiReportKey>('roi-consolidated');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [initiativeType, setInitiativeType] = useState('');
  const [downloading, setDownloading] = useState(false);

  const filter: RoiReportFilter = useMemo(
    () => ({
      from: from || undefined,
      to: to || undefined,
      initiativeType: (initiativeType || undefined) as RoiInitiativeType | undefined,
    }),
    [from, to, initiativeType],
  );

  const path = `/roi-impact/reports/${reportKey}`;
  const { data, isLoading: loading } = useApiQuery<unknown>(
    queryKeys.roiImpact.report(reportKey, filter as unknown as Record<string, unknown>),
    path,
    { params: filter as Record<string, string | undefined>, staleTime: STALE_TIME.DYNAMIC },
  );

  const xlsxPath = XLSX_REPORTS[reportKey];

  async function handleExportXlsx() {
    if (!xlsxPath) return;
    setDownloading(true);
    try {
      await downloadReportFile(xlsxPath, `${reportKey}.xlsx`);
    } catch (e) {
      notify({ title: 'Erro ao exportar', description: (e as Error).message, intent: 'danger' });
    } finally {
      setDownloading(false);
    }
  }

  async function handleExportPdf() {
    setDownloading(true);
    try {
      await downloadReportFile('executive-summary/export/pdf', 'relatorio-executivo-roi-impacto.pdf');
    } catch (e) {
      notify({ title: 'Erro ao exportar', description: (e as Error).message, intent: 'danger' });
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardBody className="flex flex-wrap items-end gap-3">
          <div className="min-w-[240px] flex-1">
            <p className="mb-1 font-body text-xs text-ink-faint">Relatório</p>
            <Select
              items={REPORT_ITEMS}
              value={reportKey}
              onValueChange={(v) => setReportKey(v as RoiReportKey)}
              className="w-full"
            />
          </div>
          <div>
            <p className="mb-1 font-body text-xs text-ink-faint">De</p>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="text-xs" />
          </div>
          <div>
            <p className="mb-1 font-body text-xs text-ink-faint">Até</p>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="text-xs" />
          </div>
          <div className="min-w-[180px]">
            <p className="mb-1 font-body text-xs text-ink-faint">Tipo de iniciativa</p>
            <Select
              items={INITIATIVE_TYPE_ITEMS}
              value={initiativeType}
              onValueChange={setInitiativeType}
              className="w-full"
            />
          </div>
          {xlsxPath && (
            <Button size="sm" intent="secondary" loading={downloading} onClick={handleExportXlsx}>
              <Download size={14} strokeWidth={1.75} className="mr-1" />
              XLSX
            </Button>
          )}
          {reportKey === 'executive-summary' && (
            <Button size="sm" intent="secondary" loading={downloading} onClick={handleExportPdf}>
              <Download size={14} strokeWidth={1.75} className="mr-1" />
              PDF
            </Button>
          )}
        </CardBody>
      </Card>

      {loading ? (
        <Skeleton rows={4} wrapperClassName="space-y-3 animate-pulse" itemClassName="h-14 rounded-card bg-surface-sunken" />
      ) : (
        <ReportBody reportKey={reportKey} data={data} />
      )}
    </div>
  );
}

function ReportBody({ reportKey, data }: { reportKey: RoiReportKey; data: unknown }) {
  if (!data) return null;

  switch (reportKey) {
    case 'roi-consolidated': {
      const d = data as RoiConsolidatedData;
      return (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="Análises" value={String(d.totalAnalyses)} />
          <StatCard label="Custo total" value={fmt$(d.totalCost)} />
          <StatCard label="Benefício total" value={fmt$(d.totalBenefit)} />
          <StatCard label="ROI médio" value={d.avgRoi != null ? `${d.avgRoi}%` : '—'} />
          <Card className="col-span-2 md:col-span-4">
            <CardBody>
              <p className="mb-2 font-body text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Por estado
              </p>
              <ul className="space-y-1 text-sm text-ink">
                {d.byStatus.map((s) => (
                  <li key={s.status} className="flex justify-between">
                    <span className="text-ink-faint">{s.status}</span>
                    <span className="font-semibold">{s.count}</span>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </div>
      );
    }
    case 'roi-by-dimension': {
      const d = data as RoiByDimensionData;
      return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <BreakdownCard title="Por departamento" rows={d.byDepartment} />
          <BreakdownCard title="Por unidade" rows={d.byUnit} />
          <BreakdownCard title="Por tipo de iniciativa" rows={d.byInitiativeType} />
        </div>
      );
    }
    case 'impact-by-indicator': {
      const d = data as ImpactByIndicatorData;
      return (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Indicador</TableHeaderCell>
                  <TableHeaderCell>Categoria</TableHeaderCell>
                  <TableHeaderCell>Registos</TableHeaderCell>
                  <TableHeaderCell>Impacto atribuído médio</TableHeaderCell>
                  <TableHeaderCell>% atribuição média</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {d.indicators.map((row) => (
                  <TableRow key={row.indicatorName}>
                    <TableCell>{row.indicatorName}</TableCell>
                    <TableCell className="text-xs">{row.category}</TableCell>
                    <TableCell>{row.records}</TableCell>
                    <TableCell>{row.avgAttributedImpact ?? '—'}</TableCell>
                    <TableCell>{row.avgAttributionPercent != null ? `${row.avgAttributionPercent}%` : '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      );
    }
    case 'training-cost-vs-budget':
    case 'budget-execution': {
      const d = data as TrainingPlansExecutionData;
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Orçamento planeado" value={fmt$(d.totalPlannedBudget)} />
            <StatCard label="Custo realizado" value={fmt$(d.totalRealizedBudget)} />
            <StatCard
              label="Execução"
              value={d.overallExecutionRatePercent != null ? `${d.overallExecutionRatePercent}%` : '—'}
            />
          </div>
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Plano</TableHeaderCell>
                    <TableHeaderCell>Ano</TableHeaderCell>
                    <TableHeaderCell>Planeado</TableHeaderCell>
                    <TableHeaderCell>Realizado</TableHeaderCell>
                    <TableHeaderCell>Execução</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {d.plans.map((p) => (
                    <TableRow key={p.planId}>
                      <TableCell>{p.name}</TableCell>
                      <TableCell>{p.year}</TableCell>
                      <TableCell>{fmt$(p.plannedBudget)}</TableCell>
                      <TableCell>{fmt$(p.realizedBudget)}</TableCell>
                      <TableCell>{p.executionRatePercent != null ? `${p.executionRatePercent}%` : '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      );
    }
    case 'top-initiatives': {
      const d = data as TopInitiativesReportData;
      return (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Iniciativa</TableHeaderCell>
                  <TableHeaderCell>Tipo</TableHeaderCell>
                  <TableHeaderCell>ROI</TableHeaderCell>
                  <TableHeaderCell>Benefício</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {d.top.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.name}</TableCell>
                    <TableCell className="text-xs">
                      {INITIATIVE_TYPE_LABELS[row.initiativeType] ?? row.initiativeType}
                    </TableCell>
                    <TableCell>{row.roiPercent}%</TableCell>
                    <TableCell>{row.computedBenefit != null ? fmt$(row.computedBenefit) : '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      );
    }
    case 'insufficient-data': {
      const d = data as InsufficientDataReportData;
      return (
        <div className="space-y-3">
          <p className="font-body text-sm text-ink-muted">
            {d.total} iniciativa(s) sem dados suficientes — {d.expensiveWithoutReturn} com custo já
            registado e sem retorno demonstrado.
          </p>
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Iniciativa</TableHeaderCell>
                    <TableHeaderCell>Departamento</TableHeaderCell>
                    <TableHeaderCell>Custo até agora</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {d.initiatives.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.department ?? '—'}</TableCell>
                      <TableCell>{fmt$(row.totalCostSoFar)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      );
    }
    case 'roi-evolution': {
      const d = data as RoiEvolutionReportData;
      return (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Ano</TableHeaderCell>
                  <TableHeaderCell>ROI médio</TableHeaderCell>
                  <TableHeaderCell>Análises</TableHeaderCell>
                  <TableHeaderCell>Benefício total</TableHeaderCell>
                  <TableHeaderCell>Custo total</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {d.years.map((row) => (
                  <TableRow key={row.year}>
                    <TableCell>{row.year}</TableCell>
                    <TableCell>{row.avgRoi}%</TableCell>
                    <TableCell>{row.count}</TableCell>
                    <TableCell>{fmt$(row.totalBenefit)}</TableCell>
                    <TableCell>{fmt$(row.totalCost)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      );
    }
    case 'onboarding-retention': {
      const d = data as OnboardingRetentionReportData;
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <StatCard
              label="Onboarding concluído"
              value={
                d.completedCohort.retentionRatePercent != null
                  ? `${d.completedCohort.retentionRatePercent}% retenção`
                  : '—'
              }
              hint={`${d.completedCohort.count} colaborador(es)`}
            />
            <StatCard
              label="Onboarding incompleto"
              value={
                d.incompleteCohort.retentionRatePercent != null
                  ? `${d.incompleteCohort.retentionRatePercent}% retenção`
                  : '—'
              }
              hint={`${d.incompleteCohort.count} colaborador(es)`}
            />
            <StatCard
              label="Onboarding abandonado"
              value={
                d.abandonedCohort.retentionRatePercent != null
                  ? `${d.abandonedCohort.retentionRatePercent}% retenção`
                  : '—'
              }
              hint={`${d.abandonedCohort.count} colaborador(es)`}
            />
          </div>
          {d.note && <p className="rounded-card bg-warning-subtle p-3 text-xs text-warning-ink">{d.note}</p>}
        </div>
      );
    }
    case 'leadership-engagement': {
      const d = data as LeadershipEngagementReportData;
      return (
        <div className="space-y-3">
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Líder</TableHeaderCell>
                    <TableHeaderCell>Progresso no programa</TableHeaderCell>
                    <TableHeaderCell>Equipa</TableHeaderCell>
                    <TableHeaderCell>Engagement médio</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {d.leaders.map((row) => (
                    <TableRow key={row.leaderId}>
                      <TableCell>{row.leaderName}</TableCell>
                      <TableCell>{row.avgProgress}%</TableCell>
                      <TableCell>{row.teamSize}</TableCell>
                      <TableCell>{row.avgEngagement ?? '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
          {d.note && <p className="rounded-card bg-warning-subtle p-3 text-xs text-warning-ink">{d.note}</p>}
        </div>
      );
    }
    case 'executive-summary': {
      const d = data as ExecutiveData;
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard label="ROI global" value={d.headline?.overallRoi != null ? `${d.headline.overallRoi}%` : '—'} />
            <StatCard label="Benefício total" value={d.headline?.totalBenefit != null ? fmt$(d.headline.totalBenefit) : '—'} />
            <StatCard label="Custo total" value={d.headline?.totalCost != null ? fmt$(d.headline.totalCost) : '—'} />
            <StatCard label="Colaboradores impactados" value={String(d.headline?.impactedEmployees ?? '—')} />
          </div>
          {d.headline?.narrative && (
            <Card>
              <CardBody>
                <p className="font-body text-sm text-ink">{d.headline.narrative}</p>
              </CardBody>
            </Card>
          )}
          {(d.topInsights?.length ?? 0) > 0 && (
            <Card>
              <CardBody>
                <p className="mb-2 font-body text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  Principais insights
                </p>
                <ul className="list-disc space-y-1 pl-4 text-sm text-ink">
                  {d.topInsights!.map((insight, i) => (
                    <li key={i}>{insight}</li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          )}
        </div>
      );
    }
    default:
      return null;
  }
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardBody>
        <p className="font-display text-xl font-bold text-ink">{value}</p>
        <p className="font-body text-[10px] text-ink-faint">{label}</p>
        {hint && <p className="text-[10px] text-ink-faint">{hint}</p>}
      </CardBody>
    </Card>
  );
}

function BreakdownCard({ title, rows }: { title: string; rows: { key: string | number | null; avgRoi: number; count: number }[] }) {
  return (
    <Card>
      <CardBody>
        <p className="mb-2 font-body text-xs font-semibold uppercase tracking-wide text-ink-muted">{title}</p>
        {rows.length === 0 ? (
          <p className="text-xs text-ink-faint">Sem dados.</p>
        ) : (
          <ul className="space-y-1 text-sm text-ink">
            {rows.map((r) => (
              <li key={String(r.key)} className="flex justify-between">
                <span className="text-ink-faint">{r.key ?? '—'}</span>
                <span className="font-semibold">{r.avgRoi}%</span>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
