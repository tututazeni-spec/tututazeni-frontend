// components/history/OverviewTab.tsx
// Aba "Visão Geral" (docs/history.md §1): dashboard do histórico da
// organização. Todos os números vêm de contagens reais (GET /history/overview).

'use client';

import { keepPreviousData } from '@tanstack/react-query';
import {
  ArrowRightLeft,
  Briefcase,
  Building2,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  FileText,
  GraduationCap,
  History,
  Star,
  ThumbsDown,
  ThumbsUp,
  UserPlus,
  Wallet,
} from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Card, CardBody } from '@/components/ui/Card';
import { KpiCard } from '@/components/ui/KpiCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { MODULE_LABEL } from './constants';
import { useScopeParams } from './filters';
import { fmtDate, fmtTime } from './shared';
import type { Overview } from './types';

function RankingList({
  title,
  items,
}: {
  title: string;
  items: { label: string; count: number }[];
}) {
  const max = items[0]?.count ?? 1;
  return (
    <Card>
      <CardBody>
        <h4 className="mb-3 font-display font-semibold text-ink">{title}</h4>
        {items.length === 0 ? (
          <p className="text-sm text-ink-faint">Sem dados no período.</p>
        ) : (
          <div className="space-y-2">
            {items.map((i, idx) => (
              <div key={`${i.label}-${idx}`} className="flex items-center gap-3">
                <span className="w-5 text-right text-xs text-ink-faint">
                  #{idx + 1}
                </span>
                <span className="w-44 truncate text-xs font-medium text-ink">
                  {i.label}
                </span>
                <div className="h-1.5 flex-1 rounded-pill bg-surface-sunken">
                  <div
                    className="h-1.5 rounded-pill bg-primary"
                    style={{ width: `${(i.count / max) * 100}%` }}
                  />
                </div>
                <span className="w-12 text-right text-xs text-ink-muted">
                  {i.count}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

export function OverviewTab() {
  // O dashboard só usa o período — os restantes filtros não se aplicam aos KPIs.
  const scope = useScopeParams();
  const params = { from: scope.from, to: scope.to };
  const { data, isLoading, error } = useApiQuery<Overview>(
    queryKeys.history.overview(params),
    '/history/overview',
    {
      params,
      staleTime: STALE_TIME.DYNAMIC,
      placeholderData: keepPreviousData,
    },
  );

  if (isLoading)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="space-y-4"
        itemClassName="skeleton-shimmer h-24 rounded-card"
      />
    );
  if (error || !data)
    return (
      <EmptyState
        title="Não foi possível carregar a visão geral"
        description={error?.message ?? 'Tenta novamente dentro de instantes'}
      />
    );

  const k = data.kpis;
  const period = `${fmtDate(data.period.from)} – ${fmtDate(data.period.to)}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4">
        <KpiCard icon={History} label="Total de eventos" value={k.totalEvents} sub="Desde sempre" />
        <KpiCard icon={CalendarDays} label="Alterações hoje" value={k.eventsToday} intent="accent" />
        <KpiCard icon={CalendarRange} label="Alterações este mês" value={k.eventsMonth} intent="accent" />
        <KpiCard icon={UserPlus} label="Admissões" value={k.admissions} intent="success" sub={period} />
        <KpiCard icon={ArrowRightLeft} label="Transferências" value={k.transfers} intent="info" sub={period} />
        <KpiCard icon={Briefcase} label="Alterações de cargo" value={k.positionChanges} intent="info" sub={period} />
        <KpiCard icon={Building2} label="Alterações de departamento" value={k.departmentChanges} intent="info" sub={period} />
        <KpiCard icon={Wallet} label="Alterações salariais" value={k.salaryChanges} intent="warning" sub={period} />
        <KpiCard icon={Star} label="Avaliações concluídas" value={k.evaluationsCompleted} intent="success" sub={period} />
        <KpiCard icon={GraduationCap} label="Formações concluídas" value={k.trainingsCompleted} intent="success" sub={period} />
        <KpiCard icon={FileText} label="Documentos adicionados" value={k.documentsAdded} intent="primary" sub={period} />
        <KpiCard icon={ThumbsUp} label="Pedidos aprovados" value={k.requestsApproved} intent="success" sub={period} />
        <KpiCard icon={ThumbsDown} label="Pedidos rejeitados" value={k.requestsRejected} intent="danger" sub={period} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <RankingList
          title="Utilizadores mais activos"
          items={data.topUsers.map((u) => ({
            label: u.user?.fullName ?? 'Utilizador removido',
            count: u.count,
          }))}
        />
        <RankingList
          title="Módulos com mais alterações"
          items={data.topModules.map((m) => ({
            label: MODULE_LABEL[m.module] ?? m.module,
            count: m.count,
          }))}
        />
      </div>

      <Card>
        <CardBody>
          <h4 className="mb-3 flex items-center gap-2 font-display font-semibold text-ink">
            <CheckCircle2 size={16} strokeWidth={1.75} /> Últimas actividades
          </h4>
          {data.recent.length === 0 ? (
            <p className="text-sm text-ink-faint">Ainda não há eventos registados.</p>
          ) : (
            <ul className="divide-y divide-border">
              {data.recent.map((e) => (
                <li key={e.id} className="flex items-start gap-4 py-2 text-sm">
                  <span className="w-28 shrink-0 text-xs text-ink-faint">
                    {fmtDate(e.timestamp)} {fmtTime(e.timestamp)}
                  </span>
                  <span className="w-40 shrink-0 truncate text-xs text-ink-muted">
                    {e.actor?.fullName ?? '–'}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="font-medium text-ink">{e.title}</span>
                    {e.description && (
                      <span className="block text-xs text-ink-muted">
                        {e.description}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
