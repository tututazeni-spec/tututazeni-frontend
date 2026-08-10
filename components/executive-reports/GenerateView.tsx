// components/executive-reports/GenerateView.tsx
// Vista "Gerar Relatório": geração automática por tipo/template.
// Extraído de app/(platform)/executive-reports/page.tsx.

'use client';

import { useState } from 'react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { TYPE_CFG } from './constants';
import type { Report, ReportTemplate, ReportType } from './types';

interface GenerateViewProps {
  onSuccess: (id: number) => void;
}

export function GenerateView({ onSuccess }: GenerateViewProps) {
  const [type, setType] = useState<ReportType>('MONTHLY');

  const { data: templates = [] } = useApiQuery<ReportTemplate[]>(
    queryKeys.executiveReports.templates(),
    '/executive-reports/templates',
    { staleTime: STALE_TIME.STATIC },
  );

  const generateMutation = useApiMutation(
    (t: ReportType) =>
      apiClient.post<Report>(
        '/executive-reports/auto-generate',
        {},
        { params: { type: t } },
      ),
    {
      onSuccess: (report) => onSuccess(report.id),
      onError: (e) => alert(e.message),
    },
  );
  const generating = generateMutation.isPending;
  const handleGenerate = () => generateMutation.mutate(type);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-5">
        <div className="text-base font-semibold text-gray-900 mb-4">
          Geração automática de relatório
        </div>
        <p className="text-sm text-gray-500 mb-5">
          O sistema irá consolidar automaticamente todos os KPIs da plataforma e
          gerar um relatório executivo com narrativa incluída.
        </p>

        {/* Tipo de relatório */}
        <div className="mb-5">
          <div className="text-xs font-medium text-gray-700 mb-2">
            Tipo de relatório
          </div>
          <div className="grid grid-cols-3 gap-2">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => setType(t.type)}
                className={`p-3 border rounded-xl text-left transition-all ${
                  type === t.type
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-lg mb-1">
                  {TYPE_CFG[t.type as ReportType]?.icon}
                </div>
                <div className="text-xs font-semibold text-gray-900">
                  {t.name}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {t.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Secções incluídas */}
        {templates.find((t) => t.type === type) && (
          <div className="mb-5 p-3 bg-blue-50 rounded-lg">
            <div className="text-xs font-medium text-blue-700 mb-2">
              Secções incluídas neste relatório:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {templates
                .find((t) => t.type === type)
                ?.sections.map((s: string) => (
                  <span
                    key={s}
                    className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded"
                  >
                    {s.replace('_', ' ')}
                  </span>
                ))}
            </div>
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full py-3 bg-blue-700 text-white text-sm font-semibold rounded-xl hover:bg-blue-800 disabled:opacity-60"
        >
          {generating ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                />
              </svg>
              A gerar relatório…
            </span>
          ) : (
            `⚡ Gerar ${TYPE_CFG[type]?.label} automaticamente`
          )}
        </button>

        <p className="text-xs text-gray-400 text-center mt-3">
          O relatório incluirá narrativa executiva gerada automaticamente com
          base nos dados actuais da plataforma.
        </p>
      </div>
    </div>
  );
}
