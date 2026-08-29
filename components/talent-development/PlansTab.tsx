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
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  PRIORITY_COLOR,
  PRIORITY_LABEL,
  STATUS_CFG_PLAIN,
  STATUS_LABEL,
} from './constants';
import type { ListMeta, Plan } from './types';

const STATUSES = ['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'];

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

  const filtered =
    data?.data.filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.user.fullName.toLowerCase().includes(search.toLowerCase()),
    ) ?? [];

  if (isLoading)
    return (
      <Skeleton
        rows={3}
        wrapperClassName="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
        itemClassName="skeleton-shimmer h-40 rounded-card"
      />
    );

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search
            size={14}
            strokeWidth={1.75}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar plano ou colaborador..."
            className="w-full pl-9"
          />
        </div>
        <div className="flex gap-1">
          {['', ...STATUSES].map((s) => (
            <Button
              key={s}
              size="sm"
              intent={status === s ? 'primary' : 'secondary'}
              onClick={() => setStatus(s)}
            >
              {s ? (STATUS_LABEL[s] ?? s) : 'Todos'}
            </Button>
          ))}
        </div>
        <span className="ml-auto font-body text-xs text-ink-faint">
          {data?.meta.total ?? 0} planos
        </span>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-5 gap-3">
        {STATUSES.map((s) => {
          const count = data?.data.filter((p) => p.status === s).length ?? 0;
          return (
            <Card key={s} className="p-3 text-center">
              <p className="font-display text-xl font-bold text-ink">{count}</p>
              <StatusBadge value={s} map={STATUS_CFG_PLAIN} />
            </Card>
          );
        })}
      </div>

      {/* List */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((plan) => (
          <Card key={plan.id} className="p-4">
            <div className="mb-3 flex items-start justify-between">
              <div className="flex min-w-0 items-center gap-2">
                <Avatar
                  name={plan.user.fullName}
                  url={plan.user.avatarUrl}
                  size="sm"
                />
                <div className="min-w-0">
                  <p className="truncate font-body text-xs font-medium text-ink">
                    {plan.user.fullName}
                  </p>
                  <p className="font-body text-[10px] text-ink-faint">
                    {plan.user.department?.name}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <StatusBadge value={plan.status} map={STATUS_CFG_PLAIN} />
                <span
                  className={`font-body text-[10px] font-semibold ${PRIORITY_COLOR[plan.priority]}`}
                >
                  {PRIORITY_LABEL[plan.priority] ?? plan.priority}
                </span>
              </div>
            </div>

            <h4 className="mb-2 line-clamp-2 font-display text-sm font-semibold leading-snug text-ink">
              {plan.name}
            </h4>

            {/* Progress */}
            <div className="mb-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="font-body text-[10px] text-ink-faint">
                  Progresso geral
                </span>
                <span className="font-body text-xs font-bold text-primary">
                  {plan.overallProgress}%
                </span>
              </div>
              <ProgressBar value={plan.overallProgress} />
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 font-body text-xs text-ink-muted">
              <span className="flex items-center gap-1">
                <CheckCircle
                  size={11}
                  strokeWidth={1.75}
                  className="text-success"
                />
                {plan.stats.completed}/{plan.stats.total} acções
              </span>
              {plan.stats.overdue > 0 && (
                <span className="flex items-center gap-1 text-danger-ink">
                  <AlertTriangle size={11} strokeWidth={1.75} />
                  {plan.stats.overdue} atrasadas
                </span>
              )}
              {plan.manager && (
                <span className="ml-auto truncate font-body text-[10px] text-ink-faint">
                  Gestor: {plan.manager.fullName}
                </span>
              )}
            </div>
          </Card>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full">
            <EmptyState
              title="Nenhum plano encontrado"
              description="Ajusta a pesquisa ou o filtro de estado para ver mais planos."
            />
          </div>
        )}
      </div>
    </div>
  );
}
