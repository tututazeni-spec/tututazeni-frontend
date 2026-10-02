// components/avatar-training/ReportsTab.tsx
// Relatórios (docs/Avatar_Training.md §11). O catálogo vem do backend já
// filtrado pelas permissões do utilizador; cada relatório mostra fórmula,
// fonte e período, e «Sem dados» quando está vazio (nunca valores fictícios).

'use client';

import { useState } from 'react';
import { BarChart2, Download } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDateTime } from '@/lib/format';
import { API_URL } from '@/lib/apiClient';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { QueryError } from '@/components/ui/QueryError';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Report, ReportCatalogItem } from './types';

function cell(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

interface Period {
  from: string;
  to: string;
}

/** Exporta o relatório em CSV ou PDF (o cookie httpOnly segue com credentials: include). */
async function downloadReport(type: string, period: Period, format: 'csv' | 'pdf') {
  const qs = new URLSearchParams({ type, format });
  if (period.from) qs.set('from', new Date(period.from).toISOString());
  if (period.to) qs.set('to', new Date(period.to + 'T23:59:59').toISOString());
  const res = await fetch(`${API_URL}/avatar-training/reports/export?${qs}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Falha ao exportar o relatório');
  const disposition = res.headers.get('Content-Disposition') ?? '';
  const name = /filename="([^"]+)"/.exec(disposition)?.[1] ?? `${type}.${format}`;
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
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
      <Skeleton
        rows={3}
        itemClassName="h-12 rounded-card bg-surface-sunken animate-pulse"
      />
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
            <thead className="border-b border-border text-xs uppercase tracking-wide text-ink-faint">
              <tr>
                {columns.map((c) => (
                  <th key={c} className="px-3 py-2">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  {columns.map((c) => (
                    <td key={c} className="px-3 py-2 text-ink-muted">
                      {cell(r[c])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="font-body text-xs text-ink-faint">
        Fonte: {data.source} · {data.formula} · Período{' '}
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
      <Skeleton
        rows={2}
        itemClassName="h-10 rounded-card bg-surface-sunken animate-pulse"
      />
    );
  if (data.length === 0)
    return (
      <EmptyState
        icon={BarChart2}
        title="Sem relatórios disponíveis"
        description="O seu perfil não tem acesso a relatórios do Avatar Training."
      />
    );

  const active = type ?? data[0].type;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {data.map((r) => (
          <button
            key={r.type}
            onClick={() => setType(r.type)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              active === r.type
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-white text-ink-muted hover:text-ink'
            }`}
          >
            {r.title}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="font-body text-xs text-ink-muted">
          De
          <Input
            type="date"
            value={period.from}
            onChange={(e) => setPeriod((p) => ({ ...p, from: e.target.value }))}
          />
        </label>
        <label className="font-body text-xs text-ink-muted">
          Até
          <Input
            type="date"
            value={period.to}
            onChange={(e) => setPeriod((p) => ({ ...p, to: e.target.value }))}
          />
        </label>
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
      </div>
      <ReportView key={active} type={active} period={period} />
    </div>
  );
}
