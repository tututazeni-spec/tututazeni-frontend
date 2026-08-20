// components/executive-reports/DetailView.tsx
// Vista "Detalhe do Relatório": header com workflow, semáforo de
// KPIs e tabs (KPIs/narrativa/plano de acção). Extraído de
// app/(platform)/executive-reports/page.tsx.

'use client';

import { useState } from 'react';
import { ArrowLeft, Lock } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useToast } from '@/providers/ToastProvider';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate as fmtDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { STATUS_CFG, TYPE_CFG } from './constants';
import { KpiCard } from './KpiCard';
import type { Report } from './types';

interface DetailViewProps {
  reportId: number;
  onBack: () => void;
}

const NARRATIVE_BLOCKS = [
  {
    key: 'achievements',
    label: '🏆 Conquistas do período',
    cls: 'bg-success-subtle border-success/30',
  },
  {
    key: 'risks',
    label: '⚠️ Riscos identificados',
    cls: 'bg-danger-subtle border-danger/30',
  },
  {
    key: 'recommendations',
    label: '💡 Recomendações',
    cls: 'bg-info-subtle border-info/30',
  },
] as const;

export function DetailView({ reportId, onBack }: DetailViewProps) {
  const notify = useToast();
  const [activeTab, setActiveTab] = useState<'kpis' | 'narrative' | 'actions'>(
    'kpis',
  );

  const { data: report, isLoading: loading } = useApiQuery<Report>(
    queryKeys.executiveReports.detail(reportId),
    `/executive-reports/${reportId}`,
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const workflowMutation = useApiMutation(
    (action: string) => {
      if (action === 'submit')
        return apiClient.patch(`/executive-reports/${reportId}/submit`, {});
      return apiClient.patch(`/executive-reports/${reportId}/publish`, {});
    },
    {
      invalidateKeys: [queryKeys.executiveReports.detail(reportId)],
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );
  const submitting = workflowMutation.isPending;
  const handleWorkflow = (action: string) => workflowMutation.mutate(action);

  if (loading || !report)
    return (
      <Skeleton
        rows={6}
        wrapperClassName="space-y-3"
        itemClassName="skeleton-shimmer h-16 rounded-card"
      />
    );

  const typeCfg = TYPE_CFG[report.type];
  const greenKpis = report.metrics.filter((m) => m.status === 'GREEN').length;
  const yellowKpis = report.metrics.filter((m) => m.status === 'YELLOW').length;
  const redKpis = report.metrics.filter((m) => m.status === 'RED').length;

  return (
    <div>
      <Button intent="ghost" size="sm" onClick={onBack} className="mb-5">
        <ArrowLeft size={14} strokeWidth={1.75} />
        Voltar
      </Button>

      {/* Header */}
      <Card className="mb-5 p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  'rounded px-2 py-0.5 font-body text-xs font-medium',
                  typeCfg.bg,
                  typeCfg.color,
                )}
              >
                {typeCfg.icon} {typeCfg.label}
              </span>
              <StatusBadge value={report.status} map={STATUS_CFG} />
              <span className="flex items-center gap-1 font-body text-xs text-ink-faint">
                <Lock size={12} strokeWidth={1.75} /> {report.confidentiality}
              </span>
            </div>
            <h1 className="font-display text-xl font-bold text-ink">
              {report.title}
            </h1>
            {report.subtitle && (
              <p className="mt-0.5 font-body text-sm text-ink-muted">
                {report.subtitle}
              </p>
            )}
            <div className="mt-2 flex items-center gap-4 font-body text-xs text-ink-faint">
              {report.period && <span>📅 {report.period}</span>}
              {report.publishedAt && (
                <span>Publicado: {fmtDate(report.publishedAt)}</span>
              )}
              <span className="flex items-center gap-1">
                <Avatar name={report.generatedBy.fullName} size="sm" />
                {report.generatedBy.fullName}
              </span>
            </div>
          </div>

          {/* Workflow buttons */}
          <div className="flex flex-shrink-0 gap-2">
            {report.status === 'DRAFT' && (
              <Button
                intent="warning"
                size="sm"
                onClick={() => handleWorkflow('submit')}
                disabled={submitting}
              >
                Submeter para revisão →
              </Button>
            )}
            {report.status === 'APPROVED' && (
              <Button
                intent="success"
                size="sm"
                onClick={() => handleWorkflow('publish')}
                disabled={submitting}
              >
                Publicar ✓
              </Button>
            )}
          </div>
        </div>

        {/* Semáforo overview */}
        <div className="flex items-center gap-4 rounded-control bg-surface-sunken p-3">
          <div className="font-body text-xs font-medium text-ink-muted">
            Estado dos KPIs:
          </div>
          <div className="flex gap-3 font-body text-xs">
            <span className="flex items-center gap-1 text-success-ink">
              🟢 {greenKpis} no target
            </span>
            <span className="flex items-center gap-1 text-warning-ink">
              🟡 {yellowKpis} atenção
            </span>
            <span className="flex items-center gap-1 text-danger-ink">
              🔴 {redKpis} crítico
            </span>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as typeof activeTab)}
      >
        <TabsList className="mb-5 w-fit">
          <TabsTrigger value="kpis">📊 KPIs</TabsTrigger>
          <TabsTrigger value="narrative">📝 Narrativa</TabsTrigger>
          <TabsTrigger value="actions">🎯 Plano de Acção</TabsTrigger>
        </TabsList>

        <TabsContent value="kpis">
          <div className="grid grid-cols-3 gap-3">
            {report.metrics.map((m) => (
              <KpiCard key={m.id} metric={m} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="narrative">
          <div className="space-y-4">
            {report.narrative && (
              <Card className="p-5">
                <div className="mb-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
                  Narrativa Executiva
                </div>
                <p className="whitespace-pre-line font-body text-sm leading-relaxed text-ink">
                  {report.narrative}
                </p>
              </Card>
            )}

            {NARRATIVE_BLOCKS.map(({ key, label, cls }) => {
              const items = report[key];
              return (
                items.length > 0 && (
                  <div key={key} className={cn('rounded-card border p-5', cls)}>
                    <div className="mb-3 font-body text-xs font-semibold text-ink">
                      {label}
                    </div>
                    <ul className="space-y-1.5">
                      {items.map((item, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 font-body text-sm text-ink"
                        >
                          <span className="mt-0.5 flex-shrink-0 text-ink-faint">
                            {i + 1}.
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="actions">
          <div className="space-y-3">
            {report.nextSteps.length > 0 ? (
              <Card className="p-5">
                <div className="mb-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
                  Próximos Passos
                </div>
                <div className="space-y-2">
                  {report.nextSteps.map((step, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-control bg-surface-sunken p-3"
                    >
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary font-body text-xs font-bold text-canvas">
                        {i + 1}
                      </span>
                      <p className="font-body text-sm text-ink">{step}</p>
                    </div>
                  ))}
                </div>
              </Card>
            ) : (
              <div className="rounded-card border border-dashed border-border-strong py-8 text-center font-body text-sm text-ink-faint">
                Sem próximos passos definidos
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
