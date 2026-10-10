// components/leave/AbsencesTab.tsx
// Separador "Gestão de Ausências" (docs/Modulo_Leave.md §5) — ocorrências
// planeadas e imprevistas, com os campos do spec, filtros, exportação e
// entrada para o registo e para o detalhe (justificar, validar, corrigir…).
// O âmbito, a privacidade e as acções permitidas vêm do backend.

'use client';

import { useState } from 'react';
import { Download, FileLock2, Paperclip, Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
import { useDepartmentOptions } from '@/components/competencies/modelFormData';
import { useApiMutation } from '@/hooks/useApiQuery';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { useDebounce } from '@/hooks/useDebounce';
import { useAbsences, type AbsenceFilters } from '@/hooks/useLeave';
import { apiClient } from '@/lib/apiClient';
import { formatDate } from '@/lib/format';
import { queryKeys } from '@/lib/queryKeys';
import { useToast } from '@/providers/ToastProvider';
import { AbsenceDetailModal } from './AbsenceDetailModal';
import { RegisterAbsenceModal } from './RegisterAbsenceModal';
import {
  ABSENCE_SOURCE_LABELS,
  ABSENCE_TYPE_LABELS,
  ATTENDANCE_STATUS_LABELS,
  JUSTIFICATION_CFG,
  absenceTypeLabel,
} from './constants';
import { downloadCsv } from './downloadCsv';
import type { AbsenceRow, CsvExport } from './types';

const ALL = 'ALL';
const REVIEWER_ROLES = ['ADMIN', 'RH', 'GESTOR', 'DIRECTOR', 'LIDER'];
const BASE_HEADERS = [
  'Colaborador',
  'Data',
  'Horário',
  'Duração',
  'Tipo',
  'Justificação',
  'Comprovativo',
  'Origem',
  'Estado',
  'Validador',
  'Assiduidade',
];

function durationLabel(a: AbsenceRow): string {
  return a.durationHours ? `${a.durationHours} h` : `${a.durationDays} dia(s)`;
}

export function AbsencesTab() {
  const role = useCurrentRole();
  const notify = useToast();
  const isReviewer = !!role && REVIEWER_ROLES.includes(role);
  const isOrg = role === 'ADMIN' || role === 'RH';
  const [filters, setFilters] = useState<AbsenceFilters>({
    occurrenceType: '',
    justificationStatus: '',
    source: '',
    departmentId: '',
    unitId: '',
    from: '',
    to: '',
    search: '',
    page: 1,
  });
  const [showRegister, setShowRegister] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);
  const debouncedSearch = useDebounce(filters.search, 300);
  const { data, loading, refetch } = useAbsences({
    ...filters,
    search: debouncedSearch,
  });
  const departments = useDepartmentOptions();

  const set = (patch: Partial<AbsenceFilters>) =>
    setFilters((f) => ({ ...f, page: 1, ...patch }));
  const pick = (v: string) => (v === ALL ? '' : v);

  const exportCsv = useApiMutation(
    () =>
      apiClient.get<CsvExport>('/leave/absences/export', {
        params: {
          occurrenceType: filters.occurrenceType,
          justificationStatus: filters.justificationStatus,
          source: filters.source,
          departmentId: filters.departmentId,
          from: filters.from,
          to: filters.to,
          search: debouncedSearch,
        },
      }),
    {
      onSuccess: (r) => downloadCsv(r.filename, r.content),
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );
  const sync = useApiMutation(
    () => apiClient.post<{ created: number; skipped: number }>('/leave/absences/sync-attendance', {}),
    {
      invalidateKeys: [queryKeys.leave.all],
      onSuccess: (r) =>
        notify({
          title: `Assiduidade sincronizada: ${r.created} nova(s) ocorrência(s), ${r.skipped} já associada(s).`,
          intent: 'success',
        }),
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  const headers = isOrg
    ? [...BASE_HEADERS, 'Análise Payroll', '']
    : [...BASE_HEADERS, ''];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-ink">Gestão de Ausências</h2>
          <p className="text-xs text-ink-faint">
            Faltas e ocorrências. Se a falta já consta da assiduidade, o registo
            é associado em vez de duplicado.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isOrg && (
            <Button
              intent="ghost"
              loading={sync.isPending}
              onClick={() => sync.mutate(undefined)}
            >
              <RefreshCw size={15} strokeWidth={1.75} /> Sincronizar assiduidade
            </Button>
          )}
          {isReviewer && (
            <Button
              intent="secondary"
              loading={exportCsv.isPending}
              onClick={() => exportCsv.mutate(undefined)}
            >
              <Download size={15} strokeWidth={1.75} /> Exportar
            </Button>
          )}
          <Button onClick={() => setShowRegister(true)}>
            <Plus size={15} strokeWidth={1.75} /> Registar ausência
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden p-4">
        <h3 className="-mx-4 -mt-4 mb-3 bg-[#0F1F3D]/60 px-4 py-3 text-sm font-semibold text-white">Filtros</h3>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <Input
            placeholder="Procurar nome ou n.º interno"
            value={filters.search}
            onChange={(e) => set({ search: e.target.value })}
            className="w-full col-span-2"
          />
          <Select
            className="w-full"
            value={filters.occurrenceType || ALL}
            onValueChange={(v) => set({ occurrenceType: pick(v) })}
            items={[
              { value: ALL, label: 'Todos os tipos' },
              ...Object.entries(ABSENCE_TYPE_LABELS).map(([value, label]) => ({
                value,
                label,
              })),
            ]}
          />
          <Select
            className="w-full"
            value={filters.justificationStatus || ALL}
            onValueChange={(v) => set({ justificationStatus: pick(v) })}
            items={[
              { value: ALL, label: 'Todos os estados' },
              ...Object.entries(JUSTIFICATION_CFG).map(([value, c]) => ({
                value,
                label: c.label,
              })),
            ]}
          />
          <Select
            className="w-full"
            value={filters.source || ALL}
            onValueChange={(v) => set({ source: pick(v) })}
            items={[
              { value: ALL, label: 'Todas as origens' },
              ...Object.entries(ABSENCE_SOURCE_LABELS).map(([value, label]) => ({
                value,
                label,
              })),
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
        </div>
      </Card>

      {loading && !data ? (
        <Skeleton
          rows={6}
          wrapperClassName="space-y-2 animate-pulse"
          itemClassName="h-10 bg-surface-sunken rounded-control"
        />
      ) : !data || data.data.length === 0 ? (
        <EmptyState
          title="Sem ocorrências para os filtros seleccionados"
          description="Ajuste os filtros ou registe uma ausência."
        />
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHead className="bg-[#0F1F3D]/60 [&_th]:text-white">
                <TableRow>
                  {headers.map((h, i) => (
                    <TableHeaderCell key={`${h}-${i}`}>{h}</TableHeaderCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {data.data.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <p className="font-medium text-ink">{a.user.fullName}</p>
                      <p className="text-xs text-ink-faint">
                        {a.user.department?.name ?? '—'}
                      </p>
                    </TableCell>
                    <TableCell>{formatDate(a.date)}</TableCell>
                    <TableCell>
                      {a.startTime && a.endTime
                        ? `${a.startTime}–${a.endTime}`
                        : 'Dia inteiro'}
                    </TableCell>
                    <TableCell>{durationLabel(a)}</TableCell>
                    <TableCell>{absenceTypeLabel(a)}</TableCell>
                    <TableCell className="max-w-[16rem] truncate">
                      {a.justification ??
                        (a.hasAttachment && a.attachments.length === 0 ? (
                          <span className="inline-flex items-center gap-1 text-ink-faint">
                            <FileLock2 size={13} strokeWidth={1.75} /> Protegida
                          </span>
                        ) : (
                          '—'
                        ))}
                    </TableCell>
                    <TableCell>
                      {a.hasAttachment ? (
                        <Paperclip
                          size={14}
                          strokeWidth={1.75}
                          aria-label="Tem comprovativo"
                        />
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>{ABSENCE_SOURCE_LABELS[a.source]}</TableCell>
                    <TableCell>
                      <StatusBadge
                        value={a.justificationStatus}
                        map={JUSTIFICATION_CFG}
                        variant="dot"
                      />
                    </TableCell>
                    <TableCell>{a.validator?.fullName ?? '—'}</TableCell>
                    <TableCell>
                      {a.attendance
                        ? (ATTENDANCE_STATUS_LABELS[a.attendance.status] ??
                          a.attendance.status)
                        : '—'}
                    </TableCell>
                    {isOrg && (
                      <TableCell>
                        {a.payrollReview ? 'Analisar' : '—'}
                      </TableCell>
                    )}
                    <TableCell>
                      <Button
                        size="sm"
                        intent="ghost"
                        onClick={() => setOpenId(a.id)}
                      >
                        Abrir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="text-xs text-ink-faint">
            {data.meta.total} ocorrência(s). Motivos de saúde e respectivos
            comprovativos só são visíveis ao titular e ao RH.
          </p>
          <Pagination
            page={data.meta.page}
            totalPages={data.meta.totalPages}
            onPageChange={(page) => setFilters((f) => ({ ...f, page }))}
          />
        </>
      )}

      {showRegister && (
        <RegisterAbsenceModal
          onClose={() => setShowRegister(false)}
          onSuccess={() => refetch()}
        />
      )}
      {openId !== null && (
        <AbsenceDetailModal absenceId={openId} onClose={() => setOpenId(null)} />
      )}
    </div>
  );
}
