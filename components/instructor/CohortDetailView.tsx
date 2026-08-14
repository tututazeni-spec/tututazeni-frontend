// components/instructor/CohortDetailView.tsx
// Vista "Detalhe da Turma": header, tabs (todos/em-risco) e lista de
// participantes. Extraído de app/(platform)/instructor/page.tsx.

'use client';

import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate as fmtDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { MODALITY_CFG, STATUS_CFG, STUDENT_STATUS } from './constants';
import type { CohortDetail } from './types';

interface CohortDetailViewProps {
  cohortId: number;
  onBack: () => void;
}

// ProgressBar da fundação é mono-cor — o sentido (progresso baixo/médio/
// alto) que a barra original comunicava por cor passa para a percentagem
// adjacente, mesmo padrão de AnalyticsTab/OverviewTab do engagement.
function progressTextClass(pct: number): string {
  if (pct > 60) return 'text-success';
  if (pct > 30) return 'text-info';
  return 'text-danger';
}

export function CohortDetailView({ cohortId, onBack }: CohortDetailViewProps) {
  const [tab, setTab] = useState<'students' | 'atrisk'>('students');

  const { data, isLoading } = useApiQuery<CohortDetail>(
    queryKeys.instructor.cohortDetail(cohortId),
    `/instructors/my/cohorts/${cohortId}`,
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (isLoading || !data)
    return (
      <Skeleton rows={5} itemClassName="skeleton-shimmer h-16 rounded-card" />
    );

  const atRiskSet = new Set(data.atRisk);
  const modalityCfg = MODALITY_CFG[data.modalidade] ?? MODALITY_CFG.ONLINE;
  const atRiskList = data.participants.filter((p) => atRiskSet.has(p.userId));
  const visibleList = tab === 'students' ? data.participants : atRiskList;

  return (
    <div>
      <Button intent="ghost" size="sm" onClick={onBack} className="mb-4">
        <ArrowLeft size={14} strokeWidth={1.75} />
        Voltar
      </Button>

      {/* Header */}
      <Card className="mb-4 p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <StatusBadge value={data.status} map={STATUS_CFG} />
              <span className="font-body text-xs text-ink-faint">
                {modalityCfg.icon} {modalityCfg.label}
              </span>
            </div>
            <h2 className="font-display text-lg font-bold text-ink">
              {data.name}
            </h2>
            <p className="font-body text-sm text-ink-muted">
              {data.course.title}
            </p>
          </div>
          <div className="text-right">
            <div className="font-display text-2xl font-bold text-ink">
              {data.participants.length}
            </div>
            <div className="font-body text-xs text-ink-faint">
              / {data.maxParticipants} alunos
            </div>
            {data.atRiskCount > 0 && (
              <div className="mt-1 font-body text-xs text-danger">
                ⚠ {data.atRiskCount} em risco
              </div>
            )}
          </div>
        </div>
        <div className="mt-3 flex gap-4 font-body text-xs text-ink-faint">
          <span>📅 Início: {fmtDate(data.startDate)}</span>
          {data.endDate && <span>📅 Fim: {fmtDate(data.endDate)}</span>}
          {data.course.workloadHours && (
            <span>⏱ {data.course.workloadHours}h</span>
          )}
        </div>
      </Card>

      {/* Tabs */}
      <div className="mb-4 flex w-fit gap-1 rounded-card bg-surface-sunken p-1">
        {(
          [
            { id: 'students', label: `👥 Todos (${data.participants.length})` },
            { id: 'atrisk', label: `⚠ Em risco (${data.atRiskCount})` },
          ] as const
        ).map((t) => (
          <Button
            key={t.id}
            size="sm"
            intent={tab === t.id ? 'primary' : 'ghost'}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {/* Participant list */}
      <Card className="overflow-hidden">
        {visibleList.map((p) => {
          const isAtRisk = atRiskSet.has(p.userId);
          return (
            <div
              key={p.userId}
              className={cn(
                'flex items-center gap-3 border-b border-border px-4 py-3 last:border-0',
                isAtRisk && 'bg-danger-subtle',
              )}
            >
              <Avatar
                name={p.user.fullName}
                url={p.user.avatarUrl ?? undefined}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <div className="mb-0.5 flex items-center gap-2">
                  <span className="font-body text-sm font-medium text-ink">
                    {p.user.fullName}
                  </span>
                  {isAtRisk && (
                    <span className="font-body text-xs font-medium text-danger">
                      ⚠ Em risco
                    </span>
                  )}
                </div>
                <div className="font-body text-xs text-ink-faint">
                  {p.user.position?.name ?? '—'}
                </div>
                <div className="mt-1 flex max-w-xs items-center gap-2">
                  <ProgressBar
                    value={p.enrollmentProgress}
                    className="flex-1"
                  />
                  <span
                    className={cn(
                      'w-9 shrink-0 font-mono text-xs',
                      progressTextClass(p.enrollmentProgress),
                    )}
                  >
                    {p.enrollmentProgress}%
                  </span>
                </div>
              </div>
              <div className="flex-shrink-0 text-right">
                <StatusBadge value={p.enrollmentStatus} map={STUDENT_STATUS} />
                <div className="mt-0.5 font-body text-xs text-ink-faint">
                  Inscrito: {fmtDate(p.enrolledAt)}
                </div>
              </div>
            </div>
          );
        })}
        {visibleList.length === 0 && (
          <div className="px-4 py-8 text-center font-body text-sm text-ink-faint">
            {tab === 'atrisk'
              ? '✅ Sem alunos em risco'
              : 'Sem participantes inscritos'}
          </div>
        )}
      </Card>
    </div>
  );
}
