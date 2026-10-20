// components/analytics/RisksView.tsx
// Separador "Riscos" — sumário e tabs (inactivos/PDIs/acções
// críticas). Dados próprios + apresentação. Extraído de
// app/(platform)/analytics/page.tsx. Migrado para a fundação de
// design: pills de separador manuais passam a components/ui/Tabs.

'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { NavyStatCard } from '@/components/ui/NavyStatCard';
import { PeriodPills } from '@/components/ui/Pills';
import type { RiskAlert } from './types';

export function RisksView() {
  const [tab, setTab] = useState<'inactive' | 'pdis' | 'actions'>('inactive');
  const { data, isLoading } = useApiQuery<RiskAlert>(
    queryKeys.analyticsPage.risks(),
    '/analytics/risks',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (isLoading || !data) return <Skeleton />;

  const { summary } = data;

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <NavyStatCard
          href="/users"
          icon={Clock}
          label="Inactivos (+60 dias)"
          value={summary.inactiveCount}
          tone={summary.inactiveCount > 0 ? 'orange' : 'green'}
        />
        <NavyStatCard
          href="/development-plans?tab=team"
          icon={AlertTriangle}
          label="PDIs atrasados"
          value={summary.overduePDICount}
          tone={summary.overduePDICount > 0 ? 'red' : 'green'}
        />
        <NavyStatCard
          href="/development-plans?tab=team"
          icon={ShieldAlert}
          label="Acções críticas"
          value={summary.criticalActionCount}
          tone={summary.criticalActionCount > 0 ? 'red' : 'green'}
        />
      </div>

      <PeriodPills
        label="Riscos"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'inactive', label: 'Inactivos' },
          { value: 'pdis', label: 'PDIs' },
          { value: 'actions', label: 'Acções' },
        ]}
      />

      {tab === 'inactive' && (
        <Card className="overflow-hidden">
          {data.inactiveCollaborators.map((u) => (
            <div
              key={u.id}
              className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0"
            >
              <Avatar
                name={u.fullName}
                url={u.avatarUrl ?? undefined}
                size="sm"
              />
              <div className="flex-1 text-sm text-ink">{u.fullName}</div>
              <span className="text-xs text-black font-medium">
                Sem actividade há +60 dias
              </span>
            </div>
          ))}
          {data.inactiveCollaborators.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-ink-faint">
              <CheckCircle2
                size={13}
                strokeWidth={1.75}
                className="inline align-[-2px]"
              />{' '}
              Sem colaboradores inactivos
            </div>
          )}
        </Card>
      )}

      {tab === 'pdis' && (
        <Card className="overflow-hidden">
          {data.overduePDIs.map((p) => (
            <div
              key={p.planId}
              className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0"
            >
              <Avatar
                name={p.user.fullName}
                url={p.user.avatarUrl ?? undefined}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-ink truncate">
                  {p.planName}
                </div>
                <div className="text-xs text-ink-faint">{p.user.fullName}</div>
              </div>
              <span className="text-xs text-danger font-medium flex-shrink-0">
                <AlertTriangle
                  size={13}
                  strokeWidth={1.75}
                  className="inline align-[-2px]"
                />{' '}
                {p.daysOverdue} dias em atraso
              </span>
            </div>
          ))}
          {data.overduePDIs.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-ink-faint">
              <CheckCircle2
                size={13}
                strokeWidth={1.75}
                className="inline align-[-2px]"
              />{' '}
              Sem PDIs atrasados
            </div>
          )}
        </Card>
      )}

      {tab === 'actions' && (
        <Card className="overflow-hidden">
          {data.criticalActions.map((a) => (
            <div
              key={a.actionId}
              className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0"
            >
              <Avatar
                name={a.user.fullName}
                url={a.user.avatarUrl ?? undefined}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-ink truncate">
                  {a.actionTitle}
                </div>
                <div className="text-xs text-ink-faint">{a.user.fullName}</div>
              </div>
              <span className="text-xs text-danger font-medium flex-shrink-0">
                <Circle
                  size={11}
                  strokeWidth={1.75}
                  className="inline align-[-1px] fill-danger text-danger"
                />{' '}
                {a.daysOverdue} dias
              </span>
            </div>
          ))}
          {data.criticalActions.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-ink-faint">
              <CheckCircle2
                size={13}
                strokeWidth={1.75}
                className="inline align-[-2px]"
              />{' '}
              Sem acções críticas
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
