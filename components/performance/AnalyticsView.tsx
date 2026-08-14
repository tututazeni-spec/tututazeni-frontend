// components/performance/AnalyticsView.tsx
// Separador "Analytics" — KPIs, distribuição por categoria, top
// performers e divergências. Dados próprios + apresentação. Extraído
// de app/(platform)/performance/page.tsx.

'use client';

import {
  AlertTriangle,
  BarChart3,
  Star,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { Card, CardBody } from '@/components/ui/Card';
import { KpiCard } from '@/components/ui/KpiCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
import { PERF_CATEGORY_MAP } from './constants';
import type { Analytics } from './types';

// Categorias de desempenho já têm um mapeamento semântico único
// (PERF_CATEGORY_MAP: HIGH=success, MEDIUM=warning, LOW=danger) — a barra
// de distribuição abaixo reutiliza os mesmos três tokens, não é uma
// paleta de série de gráfico arbitrária.
const CATEGORY_BAR_CLASS: Record<string, string> = {
  HIGH: 'bg-success',
  MEDIUM: 'bg-warning',
  LOW: 'bg-danger',
};

const CATEGORY_LABEL: Record<string, string> = {
  HIGH: 'Alto',
  MEDIUM: 'Médio',
  LOW: 'Baixo',
};

export function AnalyticsView() {
  const { data, isLoading: loading } = useApiQuery<Analytics>(
    queryKeys.performance.analytics(),
    '/performance/analytics',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (loading) return <Skeleton rows={3} />;
  if (!data) return null;

  const total = data.byCategory.reduce((s, c) => s + c._count, 0) || 1;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard
          icon={BarChart3}
          label="Total de reviews"
          value={data.totalReviews}
          intent="primary"
        />
        <KpiCard
          icon={TrendingUp}
          label="Score médio"
          value={data.avgScore}
          intent="info"
        />
        <KpiCard
          icon={TrendingDown}
          label="Score mínimo"
          value={data.minScore ?? '—'}
          intent="danger"
        />
        <KpiCard
          icon={Star}
          label="Score máximo"
          value={data.maxScore ?? '—'}
          intent="success"
        />
      </div>

      {/* Distribuição por categoria */}
      <Card>
        <CardBody>
          <div className="text-sm font-semibold text-ink mb-4">
            Distribuição de desempenho
          </div>
          {data.byCategory.map((cat) => {
            const pct = Math.round((cat._count / total) * 100);
            return (
              <div
                key={cat.category}
                className="flex items-center gap-3 mb-3 last:mb-0"
              >
                <div className="w-20 text-xs text-ink-muted font-medium">
                  {CATEGORY_LABEL[cat.category] ?? cat.category}
                </div>
                <div className="flex-1 h-6 bg-surface-sunken rounded-control overflow-hidden">
                  <div
                    className={`h-full ${CATEGORY_BAR_CLASS[cat.category] ?? 'bg-ink-faint'} rounded-control flex items-center pl-2`}
                    style={{ width: `${pct}%` }}
                  >
                    {pct > 15 && (
                      <span className="text-xs text-canvas font-medium">
                        {pct}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-xs font-data text-ink-muted w-16 text-right">
                  {cat._count} pessoas
                </div>
              </div>
            );
          })}
        </CardBody>
      </Card>

      {/* Top performers */}
      {data.topPerformers.length > 0 && (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell colSpan={2}>Top performers</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.topPerformers.map((r, idx) => (
              <TableRow key={r.id}>
                <TableCell>
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-bold font-data text-ink-faint w-6 text-center">
                      {idx + 1}
                    </span>
                    <Avatar name={r.user.fullName} size="sm" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-ink">
                        {r.user.fullName}
                      </div>
                      <div className="text-xs text-ink-faint">
                        {r.user.position?.name ?? '—'}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="text-lg font-bold font-data text-primary">
                    {r.score}
                  </div>
                  {r.category && (
                    <StatusBadge value={r.category} map={PERF_CATEGORY_MAP} />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Divergências */}
      {data.highDivergences.length > 0 && (
        <div className="rounded-card border border-warning bg-warning-subtle p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-warning-ink mb-3">
            <AlertTriangle size={16} strokeWidth={1.75} />
            Divergências self vs gestor ≥ 1 ponto ({data.highDivergences.length}{' '}
            casos)
          </div>
          {data.highDivergences.map((d) => (
            <div
              key={d.userId}
              className="flex justify-between py-1.5 border-b border-warning/20 last:border-0 text-xs"
            >
              <span className="text-warning-ink">User #{d.userId}</span>
              <span className="font-data font-bold text-warning-ink">
                {d.divergence} pontos
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
