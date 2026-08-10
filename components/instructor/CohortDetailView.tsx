// components/instructor/CohortDetailView.tsx
// Vista "Detalhe da Turma": header, tabs (todos/em-risco) e lista de
// participantes. Extraído de app/(platform)/instructor/page.tsx.

'use client';

import { useState } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate as fmtDate } from '@/lib/format';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Avatar, ProgressBar, Skeleton } from './atoms';
import { MODALITY_CFG, STATUS_CFG, STUDENT_STATUS } from './constants';
import type { CohortDetail } from './types';

interface CohortDetailViewProps {
  cohortId: number;
  onBack: () => void;
}

export function CohortDetailView({ cohortId, onBack }: CohortDetailViewProps) {
  const [tab, setTab] = useState<'students' | 'atrisk'>('students');

  const { data, isLoading } = useApiQuery<CohortDetail>(
    queryKeys.instructor.cohortDetail(cohortId),
    `/instructors/my/cohorts/${cohortId}`,
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (isLoading || !data) return <Skeleton rows={5} />;

  const atRiskSet = new Set(data.atRisk);
  const modalityCfg = MODALITY_CFG[data.modalidade] ?? MODALITY_CFG.ONLINE;
  const atRiskList = data.participants.filter((p) => atRiskSet.has(p.userId));

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4"
      >
        ← Voltar
      </button>

      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <StatusBadge value={data.status} map={STATUS_CFG} />
              <span className="text-xs text-gray-400">
                {modalityCfg.icon} {modalityCfg.label}
              </span>
            </div>
            <h2 className="text-lg font-bold text-gray-900">{data.name}</h2>
            <p className="text-sm text-gray-500">{data.course.title}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              {data.participants.length}
            </div>
            <div className="text-xs text-gray-400">
              / {data.maxParticipants} alunos
            </div>
            {data.atRiskCount > 0 && (
              <div className="text-xs text-red-600 mt-1">
                ⚠ {data.atRiskCount} em risco
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-4 text-xs text-gray-400 mt-3">
          <span>📅 Início: {fmtDate(data.startDate)}</span>
          {data.endDate && <span>📅 Fim: {fmtDate(data.endDate)}</span>}
          {data.course.workloadHours && (
            <span>⏱ {data.course.workloadHours}h</span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-4">
        {(
          [
            { id: 'students', label: `👥 Todos (${data.participants.length})` },
            { id: 'atrisk', label: `⚠ Em risco (${data.atRiskCount})` },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Participant list */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {(tab === 'students' ? data.participants : atRiskList).map((p) => {
          const isAtRisk = atRiskSet.has(p.userId);
          return (
            <div
              key={p.userId}
              className={`flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0 ${isAtRisk ? 'bg-red-50' : ''}`}
            >
              <Avatar
                name={p.user.fullName}
                avatarUrl={p.user.avatarUrl}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium text-gray-900">
                    {p.user.fullName}
                  </span>
                  {isAtRisk && (
                    <span className="text-xs text-red-600 font-medium">
                      ⚠ Em risco
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-400">
                  {p.user.position?.name ?? '—'}
                </div>
                <div className="mt-1 max-w-xs">
                  <ProgressBar
                    pct={p.enrollmentProgress}
                    color={
                      p.enrollmentProgress > 60
                        ? 'bg-emerald-500'
                        : p.enrollmentProgress > 30
                          ? 'bg-blue-500'
                          : 'bg-red-400'
                    }
                  />
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <StatusBadge value={p.enrollmentStatus} map={STUDENT_STATUS} />
                <div className="text-xs text-gray-400 mt-0.5">
                  Inscrito: {fmtDate(p.enrolledAt)}
                </div>
              </div>
            </div>
          );
        })}
        {(tab === 'students' ? data.participants : atRiskList).length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-gray-400">
            {tab === 'atrisk'
              ? '✅ Sem alunos em risco'
              : 'Sem participantes inscritos'}
          </div>
        )}
      </div>
    </div>
  );
}
