// components/executive-reports/DetailView.tsx
// Vista "Detalhe do Relatório": header com workflow, semáforo de
// KPIs e tabs (KPIs/narrativa/plano de acção). Extraído de
// app/(platform)/executive-reports/page.tsx.

'use client';

import { useState } from 'react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate as fmtDate } from '@/lib/format';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Avatar, Skeleton } from './atoms';
import { STATUS_CFG, TYPE_CFG } from './constants';
import { KpiCard } from './KpiCard';
import type { Report } from './types';

interface DetailViewProps {
  reportId: number;
  onBack: () => void;
}

export function DetailView({ reportId, onBack }: DetailViewProps) {
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
      onError: (e) => alert(e.message),
    },
  );
  const submitting = workflowMutation.isPending;
  const handleWorkflow = (action: string) => workflowMutation.mutate(action);

  if (loading || !report) return <Skeleton rows={6} />;

  const typeCfg = TYPE_CFG[report.type];
  const greenKpis = report.metrics.filter((m) => m.status === 'GREEN').length;
  const yellowKpis = report.metrics.filter((m) => m.status === 'YELLOW').length;
  const redKpis = report.metrics.filter((m) => m.status === 'RED').length;

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-5"
      >
        ← Voltar
      </button>

      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span
                className={`text-xs px-2 py-0.5 rounded font-medium ${typeCfg.cls}`}
              >
                {typeCfg.icon} {typeCfg.label}
              </span>
              <StatusBadge value={report.status} map={STATUS_CFG} />
              <span className="text-xs text-gray-400">
                🔒 {report.confidentiality}
              </span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">{report.title}</h1>
            {report.subtitle && (
              <p className="text-sm text-gray-500 mt-0.5">{report.subtitle}</p>
            )}
            <div className="flex items-center gap-4 text-xs text-gray-400 mt-2">
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
          <div className="flex gap-2 flex-shrink-0">
            {report.status === 'DRAFT' && (
              <button
                onClick={() => handleWorkflow('submit')}
                disabled={submitting}
                className="px-3 py-2 bg-amber-600 text-white text-xs font-medium rounded-lg hover:bg-amber-700 disabled:opacity-50"
              >
                Submeter para revisão →
              </button>
            )}
            {report.status === 'APPROVED' && (
              <button
                onClick={() => handleWorkflow('publish')}
                disabled={submitting}
                className="px-3 py-2 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                Publicar ✓
              </button>
            )}
          </div>
        </div>

        {/* Semáforo overview */}
        <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-500 font-medium">
            Estado dos KPIs:
          </div>
          <div className="flex gap-3 text-xs">
            <span className="flex items-center gap-1 text-emerald-700">
              🟢 {greenKpis} no target
            </span>
            <span className="flex items-center gap-1 text-amber-700">
              🟡 {yellowKpis} atenção
            </span>
            <span className="flex items-center gap-1 text-red-700">
              🔴 {redKpis} crítico
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
        {(['kpis', 'narrative', 'actions'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === t
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {
              {
                kpis: '📊 KPIs',
                narrative: '📝 Narrativa',
                actions: '🎯 Plano de Acção',
              }[t]
            }
          </button>
        ))}
      </div>

      {/* KPIs */}
      {activeTab === 'kpis' && (
        <div className="grid grid-cols-3 gap-3">
          {report.metrics.map((m) => (
            <KpiCard key={m.id} metric={m} />
          ))}
        </div>
      )}

      {/* Narrative */}
      {activeTab === 'narrative' && (
        <div className="space-y-4">
          {report.narrative && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
                Narrativa Executiva
              </div>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                {report.narrative}
              </p>
            </div>
          )}

          {/* Conquistas, Riscos, Recomendações */}
          {[
            {
              label: '🏆 Conquistas do período',
              items: report.achievements,
              cls: 'bg-emerald-50 border-emerald-200',
            },
            {
              label: '⚠️ Riscos identificados',
              items: report.risks,
              cls: 'bg-red-50 border-red-200',
            },
            {
              label: '💡 Recomendações',
              items: report.recommendations,
              cls: 'bg-blue-50 border-blue-200',
            },
          ].map(
            ({ label, items, cls }) =>
              items.length > 0 && (
                <div key={label} className={`border rounded-xl p-5 ${cls}`}>
                  <div className="text-xs font-semibold text-gray-700 mb-3">
                    {label}
                  </div>
                  <ul className="space-y-1.5">
                    {items.map((item, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-gray-700"
                      >
                        <span className="flex-shrink-0 mt-0.5 text-gray-400">
                          {i + 1}.
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ),
          )}
        </div>
      )}

      {/* Actions */}
      {activeTab === 'actions' && (
        <div className="space-y-3">
          {report.nextSteps.length > 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
                Próximos Passos
              </div>
              <div className="space-y-2">
                {report.nextSteps.map((step, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="w-6 h-6 bg-blue-700 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {i + 1}
                    </span>
                    <p className="text-sm text-gray-700">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
              Sem próximos passos definidos
            </div>
          )}
        </div>
      )}
    </div>
  );
}
