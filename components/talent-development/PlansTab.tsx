// components/talent-development/PlansTab.tsx
// Separador "Planos (PDI)" — grelha filtrável de planos de desenvolvimento.
// Dados próprios (useApiQuery) + apresentação. Extraído de
// app/(platform)/talent-development/page.tsx.

'use client';

import { useState } from 'react';
import { AlertTriangle, CheckCircle, Search, Target } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar, ProgressBar, Skeleton } from './atoms';
import { PRIORITY_COLOR, STATUS_COLOR } from './constants';
import type { ListMeta, Plan } from './types';

export function PlansTab() {
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

  const params = {
    limit: 40,
    isTemplate: false,
    ...(status ? { status } : {}),
  };
  const { data, isLoading } = useApiQuery<{ data: Plan[]; meta: ListMeta }>(
    queryKeys.talentDevelopment.plans(status),
    '/talent/plans',
    { params, staleTime: STALE_TIME.SEMI_STATIC },
  );
  const loading = isLoading;

  const filtered =
    data?.data.filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.user.fullName.toLowerCase().includes(search.toLowerCase()),
    ) ?? [];

  const statuses = ['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'];

  if (loading) return <Skeleton />;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar plano ou colaborador..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400"
          />
        </div>
        <div className="flex gap-1">
          {['', ...statuses].map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                status === s
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-300'
              }`}
            >
              {s || 'Todos'}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-400 ml-auto">
          {data?.meta.total ?? 0} planos
        </span>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-5 gap-3">
        {statuses.map((s) => {
          const count = data?.data.filter((p) => p.status === s).length ?? 0;
          return (
            <div
              key={s}
              className="bg-white rounded-lg p-3 border border-slate-100 text-center"
            >
              <p className="text-xl font-bold text-slate-700">{count}</p>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_COLOR[s]}`}
              >
                {s}
              </span>
            </div>
          );
        })}
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((plan) => (
          <div
            key={plan.id}
            className="bg-white rounded-xl border border-slate-100 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2 min-w-0">
                <Avatar
                  name={plan.user.fullName}
                  url={plan.user.avatarUrl}
                  size={8}
                />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-700 truncate">
                    {plan.user.fullName}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {plan.user.department?.name}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[plan.status]}`}
                >
                  {plan.status}
                </span>
                <span
                  className={`text-[10px] font-semibold ${PRIORITY_COLOR[plan.priority]}`}
                >
                  {plan.priority}
                </span>
              </div>
            </div>

            <h4 className="text-sm font-semibold text-slate-800 mb-2 leading-snug line-clamp-2">
              {plan.name}
            </h4>

            {/* Progress */}
            <div className="mb-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] text-slate-400">
                  Progresso geral
                </span>
                <span className="text-xs font-bold text-indigo-600">
                  {plan.overallProgress}%
                </span>
              </div>
              <ProgressBar
                value={plan.overallProgress}
                color={
                  plan.overallProgress >= 80
                    ? 'bg-emerald-500'
                    : 'bg-indigo-500'
                }
              />
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <CheckCircle size={11} className="text-emerald-500" />
                {plan.stats.completed}/{plan.stats.total} acções
              </span>
              {plan.stats.overdue > 0 && (
                <span className="flex items-center gap-1 text-red-500">
                  <AlertTriangle size={11} />
                  {plan.stats.overdue} atrasadas
                </span>
              )}
              {plan.manager && (
                <span className="ml-auto text-[10px] text-slate-400 truncate">
                  Gestor: {plan.manager.fullName}
                </span>
              )}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-3 py-16 text-center text-slate-400">
            <Target size={40} className="mx-auto mb-3 opacity-30" />
            <p>Nenhum plano encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
}
