// components/executive-reports/GenerateView.tsx
// Vista "Gerar Relatório": geração automática por tipo/template.
// Extraído de app/(platform)/executive-reports/page.tsx.

'use client';

import { useState } from 'react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useToast } from '@/providers/ToastProvider';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { SECTION_LABEL, TYPE_CFG } from './constants';
import type { Report, ReportTemplate, ReportType } from './types';

interface GenerateViewProps {
  onSuccess: (id: number) => void;
}

export function GenerateView({ onSuccess }: GenerateViewProps) {
  const notify = useToast();
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
      invalidateKeys: [queryKeys.executiveReports.all],
      onSuccess: (report) => onSuccess(report.id),
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );
  const generating = generateMutation.isPending;
  const handleGenerate = () => generateMutation.mutate(type);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-5 rounded-panel bg-gradient-to-br from-brand via-brand-mid to-brand-dark p-6 text-white shadow-[0_8px_24px_rgba(15,31,61,0.25)]">
        <div className="mb-4 font-display text-base font-bold uppercase tracking-wide">
          Geração automática de relatório
        </div>
        <p className="mb-5 font-body text-sm text-white/70">
          O sistema irá consolidar automaticamente todos os KPIs da plataforma e
          gerar um relatório executivo com narrativa incluída.
        </p>

        {/* Tipo de relatório */}
        <div className="mb-5">
          <div className="mb-2 font-body text-xs font-medium text-white/80">
            Tipo de relatório
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => setType(t.type)}
                className={cn(
                  'group rounded-card border p-3 text-left text-white transition-all duration-200 ease-out hover:scale-[1.06] hover:border-white hover:bg-surface hover:text-brand hover:shadow-[0_10px_24px_rgba(0,0,0,0.25)] motion-reduce:hover:scale-100',
                  type === t.type
                    ? 'border-on-brand-accent bg-white/20'
                    : 'border-white/25 bg-white/10',
                )}
              >
                <div className="font-body text-xs font-semibold">{t.name}</div>
                <div className="mt-0.5 font-body text-xs text-white/70 group-hover:text-brand/70">
                  {t.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Secções incluídas */}
        {templates.find((t) => t.type === type) && (
          <div className="mb-5 rounded-control bg-white/10 p-3">
            <div className="mb-2 font-body text-xs font-medium text-white">
              Secções incluídas neste relatório:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {templates
                .find((t) => t.type === type)
                ?.sections.map((s: string) => (
                  <span
                    key={s}
                    className="rounded bg-white/15 px-2 py-0.5 font-body text-xs text-white"
                  >
                    {SECTION_LABEL[s] ?? s.replace('_', ' ')}
                  </span>
                ))}
            </div>
          </div>
        )}

        <Button
          onClick={handleGenerate}
          loading={generating}
          disabled={generating}
          className="w-full !bg-surface !text-brand hover:!bg-white/90"
        >
          {generating
            ? 'A gerar relatório…'
            : `Gerar ${TYPE_CFG[type]?.label} automaticamente`}
        </Button>

        <p className="mt-3 text-center font-body text-xs text-white/70">
          O relatório incluirá narrativa executiva gerada automaticamente com
          base nos dados actuais da plataforma.
        </p>
      </div>
    </div>
  );
}
