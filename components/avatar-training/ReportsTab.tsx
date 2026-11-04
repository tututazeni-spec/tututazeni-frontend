// components/avatar-training/ReportsTab.tsx
// Relatórios (docs/Avatar_Training.md §11). O catálogo vem do backend já
// filtrado pelas permissões do utilizador; cada relatório mostra fórmula,
// fonte e período, e «Sem dados» quando está vazio (nunca valores fictícios).

'use client';

import { useState } from 'react';
import { BarChart2, CalendarDays, Download } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDateTime } from '@/lib/format';
import { downloadFromApi } from '@/lib/download';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PeriodPills } from '@/components/ui/Pills';
import { QueryError } from '@/components/ui/QueryError';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  cellLabel,
  columnLabel,
  REPORT_TITLE,
  sourceLabel,
  textLabel,
} from './reportLabels';
import type { Report, ReportCatalogItem } from './types';

interface Period {
  from: string;
  to: string;
}

/** Exporta o relatório em CSV ou PDF (o cookie httpOnly segue com credentials: include). */
async function downloadReport(
  type: string,
  period: Period,
  format: 'csv' | 'pdf',
) {
  await downloadFromApi('/avatar-training/reports/export', {
    params: {
      type,
      format,
      from: period.from ? new Date(period.from).toISOString() : undefined,
      to: period.to
        ? new Date(period.to + 'T23:59:59').toISOString()
        : undefined,
    },
    fallbackName: `${type}.${format}`,
    errorMessage: 'Falha ao exportar o relatório',
  });
}

/** Campo de data no design dos Filtros Underline: ícone + só linha por baixo. */
function UnderlineDate({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block min-w-[10rem] font-body text-xs text-brand-muted">
      {label}
      <span className="flex min-h-[44px] items-center gap-3 border-b border-brand-line bg-transparent px-1 pb-2.5 pt-3 transition-colors focus-within:border-brand hover:border-brand-muted">
        <CalendarDays
          size={20}
          strokeWidth={1.5}
          className="shrink-0 text-brand-muted"
          aria-hidden
        />
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-w-0 flex-1 bg-transparent font-body text-sm text-brand outline-none"
        />
      </span>
    </label>
  );
}

function ReportView({ type, period }: { type: string; period: Period }) {
  const params = {
    type,
    from: period.from ? new Date(period.from).toISOString() : undefined,
    to: period.to ? new Date(period.to + 'T23:59:59').toISOString() : undefined,
  };
  const { data, isLoading, error, refetch } = useApiQuery<Report>(
    queryKeys.avatarTraining.reports(type, params),
    '/avatar-training/reports',
    { params, staleTime: STALE_TIME.DYNAMIC },
  );

  if (error) return <QueryError error={error} onRetry={() => refetch()} />;
  if (isLoading || !data)
    return (
      <Skeleton rows={3} itemClassName="h-12 rounded-card bg-surface-sunken" />
    );

  const columns = data.rows.length > 0 ? Object.keys(data.rows[0]) : [];
  return (
    <div className="space-y-3">
      {data.noData ? (
        <p className="rounded-card border border-dashed border-border-strong bg-surface p-6 text-center font-body text-sm text-ink-faint">
          Sem dados
        </p>
      ) : (
        <div className="overflow-x-auto rounded-card border border-border bg-surface">
          <table className="w-full text-left font-body text-sm">
            <thead className="bg-brand text-xs uppercase tracking-wide text-white">
              <tr>
                {columns.map((c) => (
                  <th key={c} className="px-3 py-2">
                    {columnLabel(c)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  {columns.map((c) => (
                    <td key={c} className="px-3 py-2 text-ink-muted">
                      {cellLabel(r[c])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="font-body text-xs text-ink-faint">
        Fonte: {sourceLabel(data.source)} · {textLabel(data.formula)} · Período{' '}
        {formatDateTime(data.period.from)} – {formatDateTime(data.period.to)} ·
        Gerado em {formatDateTime(data.generatedAt)}
        {data.truncated && ' · Resultados truncados'}
      </p>
    </div>
  );
}

export function ReportsTab() {
  const notify = useToast();
  const [type, setType] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>({ from: '', to: '' });
  const [exporting, setExporting] = useState<'csv' | 'pdf' | null>(null);
  const { data, isLoading, error, refetch } = useApiQuery<ReportCatalogItem[]>(
    queryKeys.avatarTraining.reportCatalog(),
    '/avatar-training/reports',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (error) return <QueryError error={error} onRetry={() => refetch()} />;
  if (isLoading || !data)
    return (
      <Skeleton rows={2} itemClassName="h-10 rounded-card bg-surface-sunken" />
    );
  if (data.length === 0)
    return (
      <EmptyState
        icon={BarChart2}
        title="Sem relatórios disponíveis"
        description="O seu perfil não tem acesso a relatórios do Treino com Avatar."
      />
    );

  const active = type ?? data[0].type;
  return (
    <div className="space-y-4">
      <PeriodPills
        label="Relatório"
        value={active}
        onChange={setType}
        options={data.map((r) => ({
          value: r.type,
          label: REPORT_TITLE[r.type] ?? r.title,
        }))}
        className="grid grid-cols-2 items-stretch gap-1.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 [&>button]:flex [&>button]:items-center [&>button]:justify-center [&>button]:px-2.5 [&>button]:py-1 [&>button]:text-center [&>button]:text-xs [&>button]:leading-tight"
      />
      <Card>
        <CardBody className="flex flex-wrap items-end gap-x-8 gap-y-5">
          <UnderlineDate
            label="De"
            value={period.from}
            onChange={(v) => setPeriod((p) => ({ ...p, from: v }))}
          />
          <UnderlineDate
            label="Até"
            value={period.to}
            onChange={(v) => setPeriod((p) => ({ ...p, to: v }))}
          />
          {(['csv', 'pdf'] as const).map((format) => (
            <Button
              key={format}
              size="sm"
              intent="secondary"
              loading={exporting === format}
              disabled={exporting !== null}
              onClick={async () => {
                setExporting(format);
                try {
                  await downloadReport(active, period, format);
                } catch (e) {
                  notify({
                    title: 'Não foi possível exportar',
                    description: e instanceof Error ? e.message : undefined,
                    intent: 'danger',
                  });
                } finally {
                  setExporting(null);
                }
              }}
            >
              <Download size={14} /> Exportar {format.toUpperCase()}
            </Button>
          ))}
          <span className="font-body text-xs text-ink-faint">
            Período por omissão: últimos 30 dias
          </span>
        </CardBody>
      </Card>
      <ReportView key={active} type={active} period={period} />
    </div>
  );
}
