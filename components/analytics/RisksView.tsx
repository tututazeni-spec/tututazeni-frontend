// components/analytics/RisksView.tsx
// Separador "Riscos" — sumário e tabs (inactivos/PDIs/acções
// críticas). Dados próprios + apresentação. Extraído de
// app/(platform)/analytics/page.tsx. Migrado para a fundação de
// design: pills de separador manuais passam a components/ui/Tabs.

'use client';

import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import type { RiskAlert } from './types';

type Tone = 'blue' | 'green' | 'gold' | 'red';

const TONES: Record<Tone, { bar: string; text: string }> = {
  blue: { bar: 'bg-[#2B6CC4]', text: 'text-[#2B6CC4]' },
  green: { bar: 'bg-[#2E8B3E]', text: 'text-[#2E8B3E]' },
  gold: { bar: 'bg-[#C9A227]', text: 'text-[#B8912A]' },
  red: { bar: 'bg-[#C0453F]', text: 'text-[#C0453F]' },
};

function TopBarKpiCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  tone: Tone;
}) {
  const t = TONES[tone];
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-resting transition-all duration-200 hover:scale-105 hover:shadow-md motion-reduce:hover:scale-100">
      <div className={`h-1.5 w-full ${t.bar}`} />
      <div className="p-5 pt-6">
        <Icon size={22} strokeWidth={1.75} className={t.text} />
        <p className={`mt-3 font-display text-3xl font-bold ${t.text}`}>
          {value}
        </p>
        <p className="mt-1 font-body text-sm font-medium text-ink-muted">
          {label}
        </p>
      </div>
    </div>
  );
}

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
      <div className="grid grid-cols-3 gap-4">
        <TopBarKpiCard
          icon={Clock}
          label="Inactivos (+60 dias)"
          value={summary.inactiveCount}
          tone={summary.inactiveCount > 0 ? 'gold' : 'green'}
        />
        <TopBarKpiCard
          icon={AlertTriangle}
          label="PDIs atrasados"
          value={summary.overduePDICount}
          tone={summary.overduePDICount > 0 ? 'red' : 'green'}
        />
        <TopBarKpiCard
          icon={ShieldAlert}
          label="Acções críticas"
          value={summary.criticalActionCount}
          tone={summary.criticalActionCount > 0 ? 'red' : 'green'}
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
