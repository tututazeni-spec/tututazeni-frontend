// components/history/ReportsTab.tsx
// Aba "Relatórios" (docs/history.md §9): os 12 relatórios do History, com
// pré-visualização e exportação Excel / CSV / PDF. Usa os filtros globais.

'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
import { useToast } from '@/providers/ToastProvider';
import { REPORT_CATALOG } from './constants';
import { useScopeParams } from './filters';
import { downloadHistoryReport, type ReportFormat } from './exportDownload';
import type { ReportResult } from './types';

const PREVIEW_ROWS = 100;

export function ReportsTab() {
  const notify = useToast();
  const [type, setType] = useState(REPORT_CATALOG[0].id);
  const [busy, setBusy] = useState<ReportFormat | null>(null);
  const scope = useScopeParams();
  const params = { ...scope, type };

  const { data, isLoading, error } = useApiQuery<ReportResult>(
    queryKeys.history.report(params),
    '/history/reports',
    { params, staleTime: STALE_TIME.DYNAMIC },
  );

  async function exportAs(format: ReportFormat) {
    setBusy(format);
    try {
      await downloadHistoryReport(params, format);
    } catch (e) {
      notify({
        title: e instanceof Error ? e.message : 'Falha na exportação',
        intent: 'danger',
      });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select
          className="w-72"
          value={type}
          onValueChange={setType}
          items={REPORT_CATALOG.map((r) => ({ value: r.id, label: r.label }))}
        />
        {(['xlsx', 'csv', 'pdf'] as const).map((f) => (
          <Button
            key={f}
            intent="secondary"
            size="sm"
            loading={busy === f}
            disabled={!data || data.rows.length === 0 || busy !== null}
            onClick={() => exportAs(f)}
          >
            <Download size={14} strokeWidth={1.75} />
            {f === 'xlsx' ? 'Excel' : f.toUpperCase()}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <Skeleton
          rows={5}
          wrapperClassName="space-y-2"
          itemClassName="skeleton-shimmer h-10 rounded-card"
        />
      ) : error ? (
        <p className="rounded-card border border-danger bg-danger-subtle p-4 text-sm text-danger-ink">
          {error.message}
        </p>
      ) : !data || data.rows.length === 0 ? (
        <EmptyState
          title="Sem dados para este relatório"
          description="Não há registos reais para os filtros seleccionados."
        />
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-ink-faint">
            {data.rows.length} registos
            {data.rows.length > PREVIEW_ROWS
              ? ` — a mostrar os primeiros ${PREVIEW_ROWS}; a exportação inclui todos`
              : ''}
          </p>
          <Table>
            <TableHead>
              <TableRow>
                {data.columns.map((c) => (
                  <TableHeaderCell key={c}>{c}</TableHeaderCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {data.rows.slice(0, PREVIEW_ROWS).map((r, i) => (
                <TableRow key={i}>
                  {data.columns.map((c) => (
                    <TableCell key={c}>{r[c] === '' ? '–' : r[c]}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
