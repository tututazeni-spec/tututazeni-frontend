// components/reports/ReportViewer.tsx
// Vista de execução de um template: filtros de data/departamento e
// resultado. Extraído de app/(platform)/reports/page.tsx.

'use client';

import { useState } from 'react';
import { BarChart2, Download, RefreshCw } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from './atoms';
import { REPORT_PATHS } from './constants';
import { defaultRange } from './utils';
import { ReportOutput } from './ReportOutput';
import type { ReportData, ReportRange, Template } from './types';

interface ReportViewerProps {
  template: Template;
  onBack: () => void;
}

export function ReportViewer({ template, onBack }: ReportViewerProps) {
  const [range, setRange] = useState<ReportRange>(() => ({
    ...defaultRange(1),
    deptId: '',
  }));
  const [submitted, setSubmitted] = useState<ReportRange>(range);

  const path = REPORT_PATHS[template.reportKey] ?? REPORT_PATHS.training;
  const params = {
    from: submitted.from,
    to: submitted.to,
    departmentId: submitted.deptId || undefined,
  };
  const {
    data,
    isLoading: loading,
    refetch,
  } = useApiQuery<ReportData>(
    queryKeys.reports.view(template.reportKey, params),
    path,
    { params, staleTime: STALE_TIME.DYNAMIC },
  );

  function run() {
    const unchanged =
      range.from === submitted.from &&
      range.to === submitted.to &&
      range.deptId === submitted.deptId;
    setSubmitted(range);
    if (unchanged) refetch();
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-100 p-4 flex flex-wrap items-center gap-3">
        <button
          onClick={onBack}
          className="text-slate-500 hover:text-slate-700 text-sm flex items-center gap-1"
        >
          ← Voltar
        </button>
        <h3 className="font-semibold text-slate-700 flex-1">{template.name}</h3>
        {/* Filters */}
        <input
          type="date"
          value={range.from}
          onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
          className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none"
        />
        <span className="text-slate-300">→</span>
        <input
          type="date"
          value={range.to}
          onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
          className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none"
        />
        <button
          onClick={run}
          className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700"
        >
          <RefreshCw size={12} />
          Executar
        </button>
        <a
          href={`/api/reports/export/${template.reportKey}-csv?from=${range.from}&to=${range.to}`}
          className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 text-slate-600 text-xs rounded-lg hover:bg-slate-50"
        >
          <Download size={12} />
          CSV
        </a>
      </div>

      {loading ? (
        <Skeleton count={4} />
      ) : data ? (
        <ReportOutput data={data} reportKey={template.reportKey} />
      ) : (
        <div className="py-16 text-center text-slate-400">
          <BarChart2 size={40} className="mx-auto mb-3 opacity-30" />
          <p>Sem dados para o período seleccionado</p>
        </div>
      )}
    </div>
  );
}
