// components/leave/ReportsTab.tsx
// Separador "Relatórios" (docs/Modulo_Leave.md §9) — os 10 relatórios
// essenciais com filtros e exportação CSV. O absentismo mostra a fórmula
// documentada e deixa escolher que categorias entram no numerador (férias
// aprovadas ficam de fora por omissão).

'use client';

import { useState } from 'react';
import { Download, FormInput } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
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
import {
  useDepartmentOptions,
  useUnitOptions,
} from '@/components/competencies/modelFormData';
import { useApiMutation } from '@/hooks/useApiQuery';
import {
  useLeaveReport,
  useReportCatalog,
  type ReportFilters,
} from '@/hooks/useLeave';
import { apiClient } from '@/lib/apiClient';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/format';
import { useToast } from '@/providers/ToastProvider';
import { ABSENCE_TYPE_LABELS } from './constants';
import { downloadCsv } from './downloadCsv';
import type {
  CsvExport,
  LeaveReportKind,
  LeaveType,
  ReportColumn,
} from './types';

const ALL = 'ALL';
const ABSENTEEISM: LeaveReportKind = 'MONTHLY_ABSENTEEISM';
// Relatórios que não dependem do período (ou que têm o seu próprio).
const YEAR_ONLY: LeaveReportKind[] = ['ANNUAL_VACATION_MAP', 'VACATION_BY_EMPLOYEE'];
const NO_DEPARTMENT: LeaveReportKind[] = ['PENDING_REQUESTS', 'REQUEST_AUDIT'];

function renderCell(c: ReportColumn, v: string | number | null): string {
  if (v === null || v === undefined || v === '') return '—';
  if (c.type === 'percent') return `${v}%`;
  if (c.type === 'date') return formatDate(String(v));
  return String(v);
}

export interface ReportsTabProps {
  leaveTypes: LeaveType[];
}

export function ReportsTab({ leaveTypes }: ReportsTabProps) {
  const notify = useToast();
  const catalog = useReportCatalog();
  const [kind, setKind] = useState<LeaveReportKind>('ANNUAL_VACATION_MAP');
  const [filters, setFilters] = useState<ReportFilters>({
    year: new Date().getFullYear(),
    from: '',
    to: '',
    departmentId: '',
    unitId: '',
    leaveTypeCode: '',
    includeCodes: '',
  });
  const [custom, setCustom] = useState(false);
  const [included, setIncluded] = useState<string[]>([]);
  const departments = useDepartmentOptions();
  const units = useUnitOptions();

  const effective: ReportFilters = {
    ...filters,
    includeCodes: kind === ABSENTEEISM && custom ? included.join(',') : '',
  };
  const { data, loading } = useLeaveReport(kind, effective);

  const set = (patch: Partial<ReportFilters>) =>
    setFilters((f) => ({ ...f, ...patch }));
  const pick = (v: string) => (v === ALL ? '' : v);

  const exportCsv = useApiMutation(
    () =>
      apiClient.get<CsvExport>(`/leave/reports/${kind}/export`, {
        params: Object.fromEntries(
          Object.entries(effective).filter(([, v]) => v !== '' && v !== undefined),
        ),
      }),
    {
      onSuccess: (r) => downloadCsv(r.filename, r.content),
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  const toggleIncluded = (code: string) =>
    setIncluded((cur) =>
      cur.includes(code) ? cur.filter((c) => c !== code) : [...cur, code],
    );

  const usesPeriod = !YEAR_ONLY.includes(kind);
  const usesDepartment = !NO_DEPARTMENT.includes(kind);

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[18rem_1fr]">
      <div className="space-y-2">
        {catalog.map((r) => (
          <button
            key={r.kind}
            type="button"
            onClick={() => setKind(r.kind)}
            className={cn(
              'w-full rounded-card border p-3 text-left transition-colors',
              kind === r.kind
                ? 'border-primary bg-primary-subtle'
                : 'border-border bg-surface hover:bg-surface-sunken',
            )}
          >
            <p className="text-sm font-semibold text-ink">{r.title}</p>
            <p className="text-xs text-ink-faint">{r.indicators}</p>
          </button>
        ))}
      </div>

      <div className="space-y-4 min-w-0">
        <Card className="overflow-hidden p-4 space-y-3">
          <h3 className="-mx-4 -mt-4 bg-[#0F1F3D]/60 px-4 py-3 text-sm font-semibold text-white">Filtros</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {usesPeriod ? (
              <>
                <Input
                  type="date"
                  aria-label="Desde"
                  value={filters.from}
                  onChange={(e) => set({ from: e.target.value })}
                  className="w-full"
                />
                <Input
                  type="date"
                  aria-label="Até"
                  min={filters.from}
                  value={filters.to}
                  onChange={(e) => set({ to: e.target.value })}
                  className="w-full"
                />
              </>
            ) : null}
            <Input
              type="number"
              aria-label="Ano"
              min={2000}
              value={filters.year}
              onChange={(e) =>
                set({ year: Number(e.target.value) || new Date().getFullYear() })
              }
              className="w-full"
            />
            {usesDepartment && (
              <>
                <Select
                  className="w-full"
                  value={filters.unitId || ALL}
                  onValueChange={(v) => set({ unitId: pick(v) })}
                  items={[
                    { value: ALL, label: 'Todas as unidades' },
                    ...units.options,
                  ]}
                />
                <Select
                  className="w-full"
                  value={filters.departmentId || ALL}
                  onValueChange={(v) => set({ departmentId: pick(v) })}
                  items={[
                    { value: ALL, label: 'Todos os departamentos' },
                    ...departments.options,
                  ]}
                />
              </>
            )}
            {(kind === 'ABSENCES_BY_DEPARTMENT' ||
              kind === 'LICENSES_BY_TYPE' ||
              kind === 'PAYROLL_IMPACT') && (
              <Select
                className="w-full"
                value={filters.leaveTypeCode || ALL}
                onValueChange={(v) => set({ leaveTypeCode: pick(v) })}
                items={[
                  { value: ALL, label: 'Todos os tipos' },
                  ...leaveTypes.map((t) => ({ value: t.code, label: t.name })),
                ]}
              />
            )}
          </div>
          {usesPeriod && (
            <p className="text-xs text-ink-faint">
              Sem datas, usa o ano indicado.
            </p>
          )}

          {kind === ABSENTEEISM && (
            <div className="space-y-2 border-t border-border pt-3">
              <label className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={custom}
                  onChange={(e) => setCustom(e.target.checked)}
                />
                Escolher as categorias contabilizadas no numerador
              </label>
              {custom ? (
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
                  {leaveTypes.map((t) => (
                    <label key={t.code} className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={included.includes(t.code)}
                        onChange={() => toggleIncluded(t.code)}
                      />
                      {t.name}
                    </label>
                  ))}
                  {Object.entries(ABSENCE_TYPE_LABELS).map(([code, label]) => (
                    <label key={code} className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={included.includes(code)}
                        onChange={() => toggleIncluded(code)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-ink-faint">
                  Por omissão contam as faltas e as licenças cujo tipo está
                  marcado como absentismo; as férias aprovadas ficam de fora.
                </p>
              )}
            </div>
          )}
        </Card>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-ink">
              {data?.title ?? catalog.find((r) => r.kind === kind)?.title}
            </h2>
            <p className="text-xs text-ink-faint">
              {data?.description}
              {data ? ` · ${formatDate(data.range.from)} a ${formatDate(data.range.to)}` : ''}
            </p>
            {data?.formula && (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-muted">
                <FormInput size={13} strokeWidth={1.75} /> {data.formula}
              </p>
            )}
          </div>
          <Button
            intent="secondary"
            loading={exportCsv.isPending}
            onClick={() => exportCsv.mutate(undefined)}
          >
            <Download size={15} strokeWidth={1.75} /> Exportar CSV
          </Button>
        </div>

        {loading && !data ? (
          <Skeleton
            rows={6}
            wrapperClassName="space-y-2 animate-pulse"
            itemClassName="h-10 bg-surface-sunken rounded-control"
          />
        ) : !data || data.rows.length === 0 ? (
          <EmptyState
            title="Sem dados para os filtros seleccionados"
            description="Ajuste o período ou os filtros."
          />
        ) : (
          <>
            <Table>
              <TableHead className="bg-[#0F1F3D]/60 [&_th]:text-white">
                <TableRow>
                  {data.columns.map((c) => (
                    <TableHeaderCell
                      key={c.key}
                      className={cn(
                        (c.type === 'number' || c.type === 'percent') &&
                          'text-right',
                      )}
                    >
                      {c.label}
                    </TableHeaderCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {data.rows.map((row, i) => (
                  <TableRow key={i}>
                    {data.columns.map((c) => (
                      <TableCell
                        key={c.key}
                        className={cn(
                          (c.type === 'number' || c.type === 'percent') &&
                            'text-right tabular-nums',
                        )}
                      >
                        {renderCell(c, row[c.key])}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
                {data.totals && (
                  <TableRow className="font-semibold bg-surface-sunken">
                    {data.columns.map((c) => (
                      <TableCell
                        key={c.key}
                        className={cn(
                          (c.type === 'number' || c.type === 'percent') &&
                            'text-right tabular-nums',
                        )}
                      >
                        {data.totals![c.key] === undefined
                          ? ''
                          : renderCell(c, data.totals![c.key])}
                      </TableCell>
                    ))}
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <p className="text-xs text-ink-faint">
              {data.rows.length} linha(s)
              {data.truncated ? ' — resultado truncado, restrinja os filtros' : ''}.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
