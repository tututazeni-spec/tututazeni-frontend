// components/leave/AbsenceCalendarTab.tsx
// Separador "Calendário de Ausências" (docs/Modulo_Leave.md §6) — férias,
// licenças e ausências validadas em vista diária, semanal, mensal e anual,
// com filtros, cobertura por departamento, sobreposições, exportação e
// impressão. A privacidade é aplicada no backend: quem não é o titular nem o
// RH vê só "Férias" ou "Indisponível" e o período, nunca o motivo.

'use client';

import { ExportMenu } from '@/components/ui/ExportMenu';
import { saveCsvContent, type ExportFormat } from '@/lib/tableExport';
import { useState } from 'react';
import {
  AlertTriangle,
  Building2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Printer,
  User,
  Users,
} from 'lucide-react';
import { Button, IconButton } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { useDepartmentOptions } from '@/components/competencies/modelFormData';
import { useApiMutation } from '@/hooks/useApiQuery';
import { useHasRole } from '@/hooks/useCurrentRole';
import { useAbsenceCalendar, type CalendarFilters } from '@/hooks/useLeave';
import { apiClient } from '@/lib/apiClient';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import { useToast } from '@/providers/ToastProvider';
import { todayKey } from './calendarUtils';
import { AbsenceCalendarPanel } from './AbsenceCalendarPanel';
import { CoverageAlertsList } from './CoverageAlertsList';
import {
  CAN_PICK_EMPLOYEE_ABSENCE,
  useEmployeeOptions,
} from './useEmployeeOptions';
import type {
  AbsenceCalendarData,
  CalendarEntry,
  CalendarView,
  CsvExport,
  LeaveType,
} from './types';
import { EmptyState } from '@/components/ui/EmptyState';

const ALL = 'ALL';
const VIEWS: Array<{ value: CalendarView; label: string }> = [
  { value: 'day', label: 'Dia' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mês' },
  { value: 'year', label: 'Ano' },
];

export interface AbsenceCalendarTabProps {
  leaveTypes: LeaveType[];
}

export function AbsenceCalendarTab({ leaveTypes }: AbsenceCalendarTabProps) {
  const notify = useToast();
  const isReviewer = useHasRole(CAN_PICK_EMPLOYEE_ABSENCE);
  const [filters, setFilters] = useState<CalendarFilters>({
    view: 'month',
    date: todayKey(),
    unitId: '',
    departmentId: '',
    managerId: '',
    userId: '',
    leaveTypeCode: '',
  });
  const { data, loading } = useAbsenceCalendar(filters);
  const departments = useDepartmentOptions();
  const people = useEmployeeOptions('leave-calendar', isReviewer);

  const set = (patch: Partial<CalendarFilters>) =>
    setFilters((f) => ({ ...f, ...patch }));
  const pick = (v: string) => (v === ALL ? '' : v);
  const goTo = (day: string) => set({ view: 'day', date: day });

  const exportCsv = useApiMutation(
    (_format: ExportFormat) =>
      apiClient.get<CsvExport>('/leave/absence-calendar/export', {
        params: { ...filters },
      }),
    {
      onSuccess: (r, format) =>
        void saveCsvContent(
          r.filename,
          r.content,
          format,
          'Calendário de ausências',
        ).catch((e) => notify({ title: e.message, intent: 'danger' })),
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  const nameById = new Map(data?.entries.map((e) => [e.userId, e.userName]));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-ink">
            Calendário de Ausências
          </h2>
          <p className="text-xs text-ink-faint">
            Férias, licenças e ausências validadas. O motivo nunca é mostrado;
            fora do RH, só aparece «Férias» ou «Indisponível».
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <Button intent="ghost" onClick={() => window.print()}>
            <Printer size={15} strokeWidth={1.75} /> Imprimir
          </Button>
          {(data?.canExport ?? isReviewer) && (
            <ExportMenu
              formats={['csv', 'pdf']}
              loading={exportCsv.isPending}
              onExport={(f) => exportCsv.mutate(f)}
            />
          )}
        </div>
      </div>

      <Card className="overflow-hidden p-4 print:hidden">
        <h3 className="-mx-4 -mt-4 mb-3 bg-brand/60 px-4 py-3 text-sm font-semibold text-white">
          Filtros
        </h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <Select
            variant="underline"
            icon={Building2}
            className="w-full"
            value={filters.departmentId || ALL}
            onValueChange={(v) => set({ departmentId: pick(v) })}
            items={[
              { value: ALL, label: 'Todos os departamentos' },
              ...departments.options,
            ]}
          />
          {isReviewer && (
            <>
              <Select
                variant="underline"
                icon={Users}
                className="w-full"
                value={filters.managerId || ALL}
                onValueChange={(v) => set({ managerId: pick(v) })}
                items={[{ value: ALL, label: 'Todas as equipas' }, ...people]}
              />
              <Select
                variant="underline"
                icon={User}
                className="w-full"
                value={filters.userId || ALL}
                onValueChange={(v) => set({ userId: pick(v) })}
                items={[
                  { value: ALL, label: 'Todos os colaboradores' },
                  ...people,
                ]}
              />
            </>
          )}
          <Select
            variant="underline"
            icon={Filter}
            className="w-full"
            value={filters.leaveTypeCode || ALL}
            onValueChange={(v) => set({ leaveTypeCode: pick(v) })}
            items={[
              { value: ALL, label: 'Todos os tipos' },
              ...leaveTypes.map((t) => ({ value: t.code, label: t.name })),
            ]}
          />
        </div>
      </Card>

      <AbsenceCalendarPanel
        data={data}
        loading={loading}
        view={filters.view}
        date={filters.date}
        onViewChange={(view) => set({ view })}
        onDateChange={(date) => set({ date })}
      />

      {data && (
        <>
          {(data.alerts.length > 0 || data.overlaps.length > 0) && (
            <div className="grid grid-cols-1 gap-4">
              {data.alerts.length > 0 && (
                <Card className="overflow-hidden p-4">
                  <h3 className="-mx-4 -mt-4 mb-3 flex items-center gap-2 bg-brand/60 px-4 py-3 text-sm font-semibold text-white">
                    <AlertTriangle size={14} strokeWidth={1.75} />
                    Cobertura insuficiente
                  </h3>
                  <CoverageAlertsList alerts={data.alerts} />
                </Card>
              )}
              {data.overlaps.length > 0 && (
                <Card className="overflow-hidden p-4">
                  <h3 className="-mx-4 -mt-4 mb-3 flex items-center gap-2 bg-brand/60 px-4 py-3 text-sm font-semibold text-white">
                    <Users size={14} strokeWidth={1.75} />
                    Sobreposição de ausências
                  </h3>
                  <ul className="space-y-1 text-sm text-ink-muted">
                    {data.overlaps.slice(0, 15).map((o, i) => (
                      <li key={`${o.date}-${o.departmentId}-${i}`}>
                        {formatDate(o.date)} ·{' '}
                        {o.department ?? 'Sem departamento'}:{' '}
                        {o.userIds
                          .map((id) => nameById.get(id) ?? `#${id}`)
                          .join(', ')}
                      </li>
                    ))}
                  </ul>
                  {data.overlaps.length > 15 && (
                    <p className="mt-1 text-xs text-ink-faint">
                      +{data.overlaps.length - 15} dia(s) com sobreposição.
                    </p>
                  )}
                </Card>
              )}
            </div>
          )}
          <p className="text-xs text-ink-faint">
            Cobertura calculada sobre dias úteis (sem fins de semana nem
            feriados). O limite de ausência vem da política de cada
            departamento; o sistema avisa mas não recusa pedidos.
          </p>
        </>
      )}
    </div>
  );
}
