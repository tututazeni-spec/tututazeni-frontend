// components/analytics/RisksView.tsx
// Separador "Riscos" — sumário e tabs (inactivos/PDIs/acções
// críticas). Dados próprios + apresentação. Extraído de
// app/(platform)/analytics/page.tsx. Migrado para a fundação de
// design: pills de separador manuais passam a components/ui/Tabs.

'use client';

import { useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { KpiCard } from '@/components/ui/KpiCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
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
      <div className="grid grid-cols-3 gap-3">
        <KpiCard
          label="Inactivos (+60 dias)"
          value={summary.inactiveCount}
          intent={summary.inactiveCount > 0 ? 'warning' : 'primary'}
          className="w-full"
        />
        <KpiCard
          label="PDIs atrasados"
          value={summary.overduePDICount}
          intent={summary.overduePDICount > 0 ? 'danger' : 'primary'}
          className="w-full"
        />
        <KpiCard
          label="Acções críticas"
          value={summary.criticalActionCount}
          intent={summary.criticalActionCount > 0 ? 'danger' : 'primary'}
          className="w-full"
        />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList className="mb-6 w-fit gap-10">
          <TabsTrigger value="inactive">Inactivos</TabsTrigger>
          <TabsTrigger value="pdis">PDIs</TabsTrigger>
          <TabsTrigger value="actions">Acções</TabsTrigger>
        </TabsList>

        <TabsContent value="inactive">
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
        </TabsContent>

        <TabsContent value="pdis">
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
                  <div className="text-xs text-ink-faint">
                    {p.user.fullName}
                  </div>
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
        </TabsContent>

        <TabsContent value="actions">
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
                  <div className="text-xs text-ink-faint">
                    {a.user.fullName}
                  </div>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
