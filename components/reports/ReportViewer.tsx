// components/reports/ReportViewer.tsx
// Vista de execução de um template: filtros de data/departamento e
// resultado. Extraído de app/(platform)/reports/page.tsx.

'use client';

import { useState } from 'react';
import { ArrowLeft, BarChart2, Download, RefreshCw } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Button, buttonVariants } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
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
      <Card>
        <CardBody className="flex flex-wrap items-center gap-3">
          <Button intent="ghost" size="sm" onClick={onBack}>
            <ArrowLeft size={14} strokeWidth={1.75} />
            Voltar
          </Button>
          <h3 className="flex-1 font-display font-semibold text-ink">
            {template.name}
          </h3>
          {/* Filters */}
          <Input
            type="date"
            value={range.from}
            onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
            className="text-xs"
          />
          <span className="text-ink-faint">→</span>
          <Input
            type="date"
            value={range.to}
            onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
            className="text-xs"
          />
          <Button size="sm" onClick={run}>
            <RefreshCw size={14} strokeWidth={1.75} />
            Executar
          </Button>
          <a
            href={`/api/reports/export/${template.reportKey}-csv?from=${range.from}&to=${range.to}`}
            className={buttonVariants({ intent: 'secondary', size: 'sm' })}
          >
            <Download size={14} strokeWidth={1.75} />
            CSV
          </a>
          <a
            href={`/api/reports/export/${template.reportKey}-xlsx?from=${range.from}&to=${range.to}`}
            className={buttonVariants({ intent: 'secondary', size: 'sm' })}
          >
            <Download size={14} strokeWidth={1.75} />
            XLSX
          </a>
        </CardBody>
      </Card>

      {loading ? (
        <Skeleton
          rows={4}
          wrapperClassName="space-y-3"
          itemClassName="skeleton-shimmer h-20 rounded-card"
        />
      ) : data ? (
        <ReportOutput data={data} reportKey={template.reportKey} />
      ) : (
        <div className="py-16 text-center text-ink-faint">
          <BarChart2
            size={40}
            strokeWidth={1.75}
            className="mx-auto mb-3 opacity-30"
          />
          <p className="font-body">Sem dados para o período seleccionado</p>
        </div>
      )}
    </div>
  );
}
