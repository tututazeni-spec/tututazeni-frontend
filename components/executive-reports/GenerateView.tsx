// components/executive-reports/GenerateView.tsx
// Vista "Gerar Relatório": geração automática por tipo/template.
// Extraído de app/(platform)/executive-reports/page.tsx.

'use client';

import { useState } from 'react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
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
    <div className="mx-auto max-w-2xl">
      <Card className="mb-5 p-6">
        <div className="mb-4 font-body text-base font-semibold text-ink">
          Geração automática de relatório
        </div>
        <p className="mb-5 font-body text-sm text-ink-muted">
          O sistema irá consolidar automaticamente todos os KPIs da plataforma e
          gerar um relatório executivo com narrativa incluída.
        </p>

        {/* Tipo de relatório */}
        <div className="mb-5">
          <div className="mb-2 font-body text-xs font-medium text-ink">
            Tipo de relatório
          </div>
          <div className="grid grid-cols-3 gap-2">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => setType(t.type)}
                className={cn(
                  'rounded-card border p-3 text-left transition-colors',
                  type === t.type
                    ? 'border-primary bg-primary-subtle'
                    : 'border-border hover:border-border-strong',
                )}
              >
                <div className="mb-1 text-lg">
                  {TYPE_CFG[t.type as ReportType]?.icon}
                </div>
                <div className="font-body text-xs font-semibold text-ink">
                  {t.name}
                </div>
                <div className="mt-0.5 font-body text-xs text-ink-faint">
                  {t.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Secções incluídas */}
        {templates.find((t) => t.type === type) && (
          <div className="mb-5 rounded-control bg-info-subtle p-3">
            <div className="mb-2 font-body text-xs font-medium text-info-ink">
              Secções incluídas neste relatório:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {templates
                .find((t) => t.type === type)
                ?.sections.map((s: string) => (
                  <span
                    key={s}
                    className="rounded bg-surface px-2 py-0.5 font-body text-xs text-info-ink"
                  >
                    {s.replace('_', ' ')}
                  </span>
                ))}
            </div>
          </div>
        )}

        <Button
          onClick={handleGenerate}
          loading={generating}
          disabled={generating}
          className="w-full"
        >
          {generating
            ? 'A gerar relatório…'
            : `⚡ Gerar ${TYPE_CFG[type]?.label} automaticamente`}
        </Button>

        <p className="mt-3 text-center font-body text-xs text-ink-faint">
          O relatório incluirá narrativa executiva gerada automaticamente com
          base nos dados actuais da plataforma.
        </p>
      </Card>
    </div>
  );
}
