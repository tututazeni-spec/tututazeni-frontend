// components/talent-development/PoolTab.tsx
// Separador "Pool de Talento" — grelha de talentos filtrável por tier +
// matriz 9-box. Dados próprios (useApiQuery) + apresentação, mesmo padrão
// auto-contido usado em components/payslips/page.tsx. Extraído de
// app/(platform)/talent-development/page.tsx.

'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar, ProgressBar, ScoreBadge, Skeleton } from './atoms';
import { NineBoxMatrix } from './NineBoxMatrix';
import { TIER_COLOR } from './constants';
import type { NineBoxResponse, PoolMeta, TalentUser } from './types';

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

  if (poolQuery.isLoading || matrixQuery.isLoading) return <Skeleton />;

  return (
    <div className="space-y-6">
      {/* Tier summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Alto Potencial', key: 'high', color: 'bg-emerald-500' },
          { label: 'Médio', key: 'medium', color: 'bg-amber-500' },
          {
            label: 'Em Desenvolvimento',
            key: 'developing',
            color: 'bg-slate-400',
          },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() =>
              setTier(tier === t.key.toUpperCase() ? '' : t.key.toUpperCase())
            }
            className={`bg-white rounded-xl p-4 border-2 transition-all ${
              tier === t.key.toUpperCase()
                ? 'border-indigo-500'
                : 'border-slate-100'
            }`}
          >
            <div className={`w-3 h-3 rounded-full ${t.color} mb-2`} />
            <p className="text-xl font-bold text-slate-800">
              {data?.meta.tierCounts?.[t.key] ?? 0}
            </p>
            <p className="text-xs text-slate-500">{t.label}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Table */}
        <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100">
          <div className="p-4 border-b border-slate-100 flex items-center gap-3">
            <div className="flex-1 relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar colaborador..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400"
              />
            </div>
            <span className="text-xs text-slate-400">
              {filtered.length} colaboradores
            </span>
          </div>

          <div className="divide-y divide-slate-50 max-h-[520px] overflow-y-auto">
            {filtered.map((t) => (
              <div
                key={t.user.id}
                className="px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors"
              >
                <Avatar name={t.user.fullName} url={t.user.avatarUrl} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">
                    {t.user.fullName}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {t.user.position?.name} · {t.user.department?.name}
                  </p>
                  {t.activePlan && (
                    <div className="mt-1 flex items-center gap-2">
                      <ProgressBar
                        value={t.activePlan.overallProgress}
                        height="h-1"
                      />
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {t.activePlan.overallProgress}%
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <ScoreBadge score={t.scores.talent} />
                  <div className="mt-1">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${TIER_COLOR[t.tier]}`}
                    >
                      {t.tier === 'HIGH'
                        ? 'HiPo'
                        : t.tier === 'MEDIUM'
                          ? 'Médio'
                          : 'Dev.'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 9-Box */}
        {matrix && <NineBoxMatrix matrix={matrix.matrix} />}
      </div>
    </div>
  );
}
