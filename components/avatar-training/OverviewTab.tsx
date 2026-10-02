// components/avatar-training/OverviewTab.tsx
// Visão Geral (docs/Avatar_Training.md §3): indicadores com fórmula/fonte/período,
// «Sem dados» quando não existem dados e alertas. GET /avatar-training/overview.

'use client';

import { AlertTriangle } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDateTime } from '@/lib/format';
import { Card } from '@/components/ui/Card';
import { QueryError } from '@/components/ui/QueryError';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Indicator, Overview } from './types';

const SCOPE_LABEL = {
  ALL: 'Toda a organização',
  TEAM: 'A sua equipa',
  SELF: 'Os seus dados',
} as const;

function IndicatorCard({ i }: { i: Indicator }) {
  const noData = i.status !== 'OK' || i.value === null;
  return (
    <Card className="p-4" title={`${i.formula}\nFonte: ${i.source}`}>
      <div className="font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
        {i.label}
      </div>
      <div className="mt-2 font-display text-2xl font-semibold text-ink">
        {i.status === 'RESTRICTED'
          ? 'Restrito'
          : noData
            ? 'Sem dados'
            : i.value}
      </div>
      {!noData && (
        <div className="font-body text-xs text-ink-muted">{i.unit}</div>
      )}
      <p className="mt-2 line-clamp-2 font-body text-[11px] text-ink-faint">
        {i.formula}
      </p>
    </Card>
  );
}

export function OverviewTab() {
  const { data, isLoading, error, refetch } = useApiQuery<Overview>(
    queryKeys.avatarTraining.overview({}),
    '/avatar-training/overview',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (error) return <QueryError error={error} onRetry={() => refetch()} />;
  if (isLoading || !data)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="space-y-4"
        itemClassName="h-24 bg-surface-sunken rounded-card animate-pulse"
      />
    );

  return (
    <div className="space-y-6">
      {data.alerts.length > 0 && (
        <div className="space-y-2">
          {data.alerts.map((a) => (
            <div
              key={a.code}
              role="alert"
              className={`flex items-start gap-2 rounded-card border px-4 py-3 font-body text-sm ${
                a.severity === 'CRITICAL'
                  ? 'border-danger bg-danger-subtle text-danger-ink'
                  : 'border-warning bg-warning-subtle text-warning-ink'
              }`}
            >
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              {a.message}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.indicators.map((i) => (
          <IndicatorCard key={i.code} i={i} />
        ))}
      </div>

      <p className="font-body text-xs text-ink-faint">
        Âmbito: {SCOPE_LABEL[data.scope]} · Período{' '}
        {formatDateTime(data.period.from)} – {formatDateTime(data.period.to)} ·
        Actualizado em {formatDateTime(data.generatedAt)}
        {data.truncated && ' · Resultados truncados (limite de leitura)'}
      </p>
    </div>
  );
}
