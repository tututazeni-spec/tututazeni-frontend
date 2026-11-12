// components/leave/ReportsTab.tsx
// Separador "Relatórios" (docs/Modulo_Leave.md §9) — os 10 relatórios
// essenciais com filtros e exportação CSV. O absentismo mostra a fórmula
// documentada e deixa escolher que categorias entram no numerador (férias
// aprovadas ficam de fora por omissão).

'use client';

import { ExportMenu } from '@/components/ui/ExportMenu';
import { saveCsvContent, type ExportFormat } from '@/lib/tableExport';
import { useState } from 'react';
import {
  BarChart3,
  Banknote,
  Building2,
  CalendarCheck,
  ClipboardList,
  FileSearch,
  FileText,
  Hourglass,
  Layers,
  Palmtree,
  type LucideIcon,
  CalendarDays,
  Filter,
  FormInput,
  Landmark,
} from 'lucide-react';
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
import type {
  CsvExport,
  LeaveReportKind,
  LeaveType,
  ReportColumn,
} from './types';
import { Checkbox } from '@/components/ui/Checkbox';

const REPORT_ICONS: Record<LeaveReportKind, LucideIcon> = {
  ANNUAL_VACATION_MAP: CalendarCheck,
  ABSENCES_BY_DEPARTMENT: Building2,
  MONTHLY_ABSENTEEISM: BarChart3,
  JUSTIFIED_VS_UNJUSTIFIED: FileText,
  LICENSES_BY_TYPE: ClipboardList,
  PENDING_REQUESTS: Hourglass,
  VACATION_BY_EMPLOYEE: Palmtree,
  OPERATIONAL_COVERAGE: Layers,
  PAYROLL_IMPACT: Banknote,
  REQUEST_AUDIT: FileSearch,
};

const ALL = 'ALL';
const ABSENTEEISM: LeaveReportKind = 'MONTHLY_ABSENTEEISM';
// Relatórios que não dependem do período (ou que têm o seu próprio).
const YEAR_ONLY: LeaveReportKind[] = [
  'ANNUAL_VACATION_MAP',
  'VACATION_BY_EMPLOYEE',
];
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
  const [custom, setCustomRaw] = useState(false);
  // Os dados só aparecem depois de o utilizador filtrar.
  const [filtered, setFiltered] = useState(false);
  const setCustom = (v: boolean) => {
    setCustomRaw(v);
    setFiltered(true);
  };
  const [included, setIncluded] = useState<string[]>([]);
  const departments = useDepartmentOptions();
  const units = useUnitOptions();

  const effective: ReportFilters = {
    ...filters,
    includeCodes: kind === ABSENTEEISM && custom ? included.join(',') : '',
  };
  const { data, loading } = useLeaveReport(kind, effective, filtered);

  const set = (patch: Partial<ReportFilters>) => {
    setFiltered(true);
    setFilters((f) => ({ ...f, ...patch }));
  };
  const pick = (v: string) => (v === ALL ? '' : v);

  const exportCsv = useApiMutation(
    (_format: ExportFormat) =>
      apiClient.get<CsvExport>(`/leave/reports/${kind}/export`, {
        params: Object.fromEntries(
          Object.entries(effective).filter(
            ([, v]) => v !== '' && v !== undefined,
          ),
        ),
      }),
    {
      onSuccess: (r, format) =>
        void saveCsvContent(
          r.filename,
          r.content,
          format,
          'Relatório de licenças',
        ).catch((e) => notify({ title: e.message, intent: 'danger' })),
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  const toggleIncluded = (code: string) => {
    setFiltered(true);
    setIncluded((cur) =>
      cur.includes(code) ? cur.filter((c) => c !== code) : [...cur, code],
    );
  };

  const usesPeriod = !YEAR_ONLY.includes(kind);
  const usesDepartment = !NO_DEPARTMENT.includes(kind);

  const pillCls = 'rounded-control bg-white text-ink shadow-sm';
  const numeric = (c: ReportColumn) =>
    c.type === 'number' || c.type === 'percent';

  return (
    <div className="overflow-hidden rounded-card border border-[#0F1F3D]/30 bg-surface shadow-sm">
      <div className="bg-gradient-to-r from-[#0B1730] via-[#0F1F3D] to-[#1D4ED8] px-5 py-4 text-white">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/30">
            <CalendarDays size={26} strokeWidth={1.75} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold leading-tight">
              {data?.title ?? catalog.find((r) => r.kind === kind)?.title}
            </h2>
            {data?.description && (
              <p className="mt-0.5 text-sm text-white/80">{data.description}</p>
            )}
            {data && (
              <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium text-white ring-1 ring-white/25">
                <CalendarDays size={13} strokeWidth={1.75} />
                {formatDate(data.range.from)} a {formatDate(data.range.to)}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {usesPeriod ? (
              <>
                <Input
                  type="date"
                  aria-label="Desde"
                  value={filters.from}
                  onChange={(e) => set({ from: e.target.value })}
                  className={cn(pillCls, 'w-40')}
                />
                <Input
                  type="date"
                  aria-label="Até"
                  min={filters.from}
                  value={filters.to}
                  onChange={(e) => set({ to: e.target.value })}
                  className={cn(pillCls, 'w-40')}
                />
              </>
            ) : null}
            <Input
              type="number"
              aria-label="Ano"
              min={2000}
              value={filters.year}
              onChange={(e) =>
                set({
                  year: Number(e.target.value) || new Date().getFullYear(),
                })
              }
              className={cn(pillCls, 'w-24')}
            />
            {usesDepartment && (
              <>
                <Select
                  variant="underline"
                  icon={Landmark}
                  className={cn(pillCls, 'w-48 px-2')}
                  value={filters.unitId || ALL}
                  onValueChange={(v) => set({ unitId: pick(v) })}
                  items={[
                    { value: ALL, label: 'Todas as unidades' },
                    ...units.options,
                  ]}
                />
                <Select
                  variant="underline"
                  icon={Building2}
                  className={cn(pillCls, 'w-52 px-2')}
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
                variant="underline"
                icon={Filter}
                className={cn(pillCls, 'w-44 px-2')}
                value={filters.leaveTypeCode || ALL}
                onValueChange={(v) => set({ leaveTypeCode: pick(v) })}
                items={[
                  { value: ALL, label: 'Todos os tipos' },
                  ...leaveTypes.map((t) => ({ value: t.code, label: t.name })),
                ]}
              />
            )}
            <ExportMenu
              formats={['csv', 'pdf']}
              loading={exportCsv.isPending}
              onExport={(f) => exportCsv.mutate(f)}
            />
          </div>
        </div>
        {(data?.formula || usesPeriod) && (
          <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/15 pt-3">
            {data?.formula && (
              <div className="flex items-center gap-2 rounded-control bg-white/10 px-3 py-2 text-xs ring-1 ring-white/20">
                <FormInput size={14} strokeWidth={1.75} className="shrink-0" />
                <span className="font-semibold uppercase tracking-wide text-white/70">
                  Fórmula
                </span>
                <span className="text-white">{data.formula}</span>
              </div>
            )}
            {usesPeriod && (
              <p className="text-xs text-white/60">
                Sem datas, usa o ano indicado.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[15rem_1fr]">
        <div className="space-y-1 bg-[#0F1F3D] p-3">
          {catalog.map((r) => (
            <button
              key={r.kind}
              type="button"
              onClick={() => setKind(r.kind)}
              className={cn(
                'flex w-full items-start gap-2.5 rounded-control px-3 py-2 text-left transition-colors',
                kind === r.kind
                  ? 'bg-white text-[#1D4ED8]'
                  : 'text-white/85 hover:bg-white/10',
              )}
            >
              {(() => {
                const Icon = REPORT_ICONS[r.kind] ?? FileText;
                return (
                  <Icon
                    size={18}
                    strokeWidth={1.75}
                    className="mt-0.5 shrink-0"
                  />
                );
              })()}
              <span className="min-w-0">
                <span className="block text-sm font-semibold leading-tight">
                  {r.title}
                </span>
                <span
                  className={cn(
                    'block text-xs',
                    kind === r.kind ? 'text-[#0F1F3D]/60' : 'text-white/55',
                  )}
                >
                  {r.indicators}
                </span>
              </span>
            </button>
          ))}
        </div>

        <div className="min-w-0 space-y-4 bg-surface p-4">
          {kind === ABSENTEEISM && (
            <div className="space-y-2 rounded-card border border-border p-3">
              <label className="flex items-center gap-2 text-sm text-ink">
                <Checkbox
                  checked={custom}
                  onChange={(e) => setCustom(e.target.checked)}
                />
                Escolher as categorias contabilizadas no numerador
              </label>
              {custom ? (
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
                  {leaveTypes.map((t) => (
                    <label key={t.code} className="flex items-center gap-1.5">
                      <Checkbox
                        checked={included.includes(t.code)}
                        onChange={() => toggleIncluded(t.code)}
                      />
                      {t.name}
                    </label>
                  ))}
                  {Object.entries(ABSENCE_TYPE_LABELS).map(([code, label]) => (
                    <label key={code} className="flex items-center gap-1.5">
                      <Checkbox
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

          {loading && !data ? (
            <Skeleton
              rows={6}
              wrapperClassName="space-y-2"
              itemClassName="h-10 bg-surface-sunken rounded-control"
            />
          ) : !data || data.rows.length === 0 ? (
            <EmptyState
              title={
                filtered
                  ? 'Sem dados para os filtros seleccionados'
                  : 'Aplique um filtro para ver os dados'
              }
              description={
                filtered
                  ? 'Ajuste o período ou os filtros.'
                  : 'Escolha o período, a unidade ou o departamento.'
              }
            />
          ) : (
            <>
              <Table className="[&_td]:px-2 [&_td]:py-2 [&_td]:text-xs [&_th]:px-2 [&_th]:py-2 [&_th]:align-bottom [&_th]:leading-tight">
                <TableHead className="bg-brand-dark [&_th]:text-[11px] [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-wide [&_th]:text-white">
                  <TableRow className="hover:bg-[#0F1F3D]">
                    {data.columns.map((c) => (
                      <TableHeaderCell key={c.key} className="text-center">
                        {c.label}
                      </TableHeaderCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.rows.map((row, i) => (
                    <TableRow key={i} className="hover:bg-[#EAF1FB]">
                      {data.columns.map((c) => (
                        <TableCell
                          key={c.key}
                          className={cn(
                            numeric(c) && 'text-center tabular-nums',
                          )}
                        >
                          {renderCell(c, row[c.key])}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                  {data.totals && (
                    <TableRow className="bg-[#0F1F3D] font-semibold text-white hover:bg-[#0F1F3D] [&_td]:text-white">
                      {data.columns.map((c) => (
                        <TableCell
                          key={c.key}
                          className={cn(
                            numeric(c) && 'text-center tabular-nums',
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
                {data.truncated
                  ? ' — resultado truncado, restrinja os filtros'
                  : ''}
                .
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
