// components/talent-development/PoolTab.tsx
// Separador "Pool de Talento" — grelha de talentos filtrável por tier +
// matriz 9-box. Dados próprios (useApiQuery) + apresentação, mesmo padrão
// auto-contido usado em components/payslips/page.tsx. Extraído de
// app/(platform)/talent-development/page.tsx.
//
// scoreIntent(): score do talento (0–5) é estado decorativo (bom/médio/
// baixo), não série de dados — mapeado para os tokens semânticos, único
// consumidor do antigo `ScoreBadge` local (por isso inlined em vez de
// virar um átomo partilhado).

'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { NineBoxMatrix } from './NineBoxMatrix';
import { TIER_CFG, TIER_DOT, TIER_LABEL } from './constants';
import type { NineBoxResponse, PoolMeta, TalentUser, Tier } from './types';

const TIER_SUMMARY: { label: string; key: string; tier: Tier }[] = [
  { label: TIER_LABEL.HIGH, key: 'high', tier: 'HIGH' },
  { label: TIER_LABEL.MEDIUM, key: 'medium', tier: 'MEDIUM' },
  { label: TIER_LABEL.DEVELOPING, key: 'developing', tier: 'DEVELOPING' },
];

function scoreIntent(score: number): string {
  if (score >= 4) return 'text-success-ink';
  if (score >= 2.5) return 'text-warning-ink';
  return 'text-ink-faint';
}

export function PoolTab() {
  const [search, setSearch] = useState('');
  const [tier, setTier] = useState<string>('');

  const poolParams = { limit: 100, ...(tier ? { tier } : {}) };
  const poolQuery = useApiQuery<{ data: TalentUser[]; meta: PoolMeta }>(
    queryKeys.talentDevelopment.pool(tier),
    '/talent/pool',
    { params: poolParams, staleTime: STALE_TIME.SEMI_STATIC },
  );
  const matrixQuery = useApiQuery<NineBoxResponse>(
    queryKeys.talentDevelopment.matrix(),
    '/talent/matrix',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  const data = poolQuery.data ?? null;
  const matrix = matrixQuery.data ?? null;

  const filtered =
    data?.data.filter((u) =>
      u.user.fullName.toLowerCase().includes(search.toLowerCase()),
    ) ?? [];

  if (poolQuery.isLoading || matrixQuery.isLoading)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="space-y-4"
        itemClassName="skeleton-shimmer h-24 rounded-card"
      />
    );

  return (
    <div className="space-y-6">
      {/* Tier summary */}
      <div className="grid grid-cols-3 gap-4">
        {TIER_SUMMARY.map((t) => (
          <button
            key={t.key}
            onClick={() =>
              setTier(tier === t.key.toUpperCase() ? '' : t.key.toUpperCase())
            }
            className={`rounded-card border-2 bg-surface p-4 text-left transition-all ${
              tier === t.key.toUpperCase() ? 'border-primary' : 'border-border'
            }`}
          >
            <div className={`mb-2 h-3 w-3 rounded-full ${TIER_DOT[t.tier]}`} />
            <p className="font-display text-xl font-bold text-ink">
              {data?.meta.tierCounts?.[t.key] ?? 0}
            </p>
            <p className="font-body text-xs text-ink-faint">{t.label}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Table */}
        <Card className="xl:col-span-2">
          <div className="flex items-center gap-3 border-b border-border p-4">
            <div className="relative flex-1">
              <Search
                size={14}
                strokeWidth={1.75}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
              />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar colaborador..."
                className="w-full pl-9"
              />
            </div>
            <span className="font-body text-xs text-ink-faint">
              {filtered.length} colaboradores
            </span>
          </div>

          <div className="max-h-[520px] divide-y divide-border overflow-y-auto">
            {filtered.map((t) => (
              <div
                key={t.user.id}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-sunken"
              >
                <Avatar
                  name={t.user.fullName}
                  url={t.user.avatarUrl}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-body text-sm font-medium text-ink">
                    {t.user.fullName}
                  </p>
                  <p className="truncate font-body text-xs text-ink-faint">
                    {t.user.position?.name} · {t.user.department?.name}
                  </p>
                  {t.activePlan && (
                    <div className="mt-1 flex items-center gap-2">
                      <ProgressBar
                        value={t.activePlan.overallProgress}
                        className="h-1"
                      />
                      <span className="shrink-0 font-body text-[10px] text-ink-faint">
                        {t.activePlan.overallProgress}%
                      </span>
                    </div>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <span
                    className={`font-display text-sm font-bold ${scoreIntent(t.scores.talent)}`}
                  >
                    {t.scores.talent.toFixed(1)}
                  </span>
                  <div className="mt-1">
                    <StatusBadge value={t.tier} map={TIER_CFG} variant="pill" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* 9-Box */}
        {matrix && (
          <ErrorBoundary source="talent-development.NineBoxMatrix">
            <NineBoxMatrix matrix={matrix.matrix} />
          </ErrorBoundary>
        )}
      </div>
    </div>
  );
}
