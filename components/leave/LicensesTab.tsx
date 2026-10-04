// components/leave/LicensesTab.tsx
// Separador "Licenças" (docs/Modulo_Leave.md §4) — tabela de licenças com os
// campos do spec e entrada para o modal "Nova licença". O âmbito (próprio /
// equipa / organização) e a privacidade vêm do backend: motivo e comprovativos
// de tipos sensíveis chegam ocultos a quem não é o titular nem o RH, e o
// impacto salarial só chega a ADMIN/RH.

'use client';

import { useState } from 'react';
import { FileLock2, Paperclip, Plus, X } from 'lucide-react';
import { Button, IconButton } from '@/components/ui/Button';
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
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { useDebounce } from '@/hooks/useDebounce';
import { useLicenses, type LicenseFilters } from '@/hooks/useLeave';
import { formatDate, formatDateTime } from '@/lib/format';
import { PAY_REGIME_LABELS, PHASE_CFG } from './constants';
import { NewLicenseModal } from './NewLicenseModal';
import type { LeaveType, LicenseRow } from './types';

const ALL = 'ALL';
const VACATION_CODE = 'VACATION';
const BASE_HEADERS = [
  'Colaborador',
  'Tipo',
  'Período',
  'Duração',
  'Regime remuneratório',
  'Comprovativo',
  'Submissão',
  'Aprovador',
  'Estado',
];

function periodLabel(r: LicenseRow): string {
  const dates =
    r.startDate.slice(0, 10) === r.endDate.slice(0, 10)
      ? formatDate(r.startDate)
      : `${formatDate(r.startDate)} → ${formatDate(r.endDate)}`;
  return r.startTime && r.endTime
    ? `${dates} · ${r.startTime}–${r.endTime}`
    : dates;
}

function durationLabel(r: LicenseRow): string {
  if (r.durationMode === 'HOURS' && r.hours) return `${r.hours} h`;
  if (r.durationMode === 'HALF_AM' || r.durationMode === 'HALF_PM')
    return '½ dia';
  return `${r.workDays} dia(s)`;
}

export interface LicensesTabProps {
  leaveTypes: LeaveType[];
  onCancel: (id: number) => void;
}

export function LicensesTab({ leaveTypes, onCancel }: LicensesTabProps) {
  const role = useCurrentRole();
  const showPayroll = role === 'ADMIN' || role === 'RH';
  const [filters, setFilters] = useState<LicenseFilters>({
    leaveTypeCode: '',
    phase: '',
    departmentId: '',
    unitId: '',
    from: '',
    to: '',
    search: '',
    page: 1,
  });
  const [showModal, setShowModal] = useState(false);
  const debouncedSearch = useDebounce(filters.search, 300);
  const { data, loading, refetch } = useLicenses({
    ...filters,
    search: debouncedSearch,
  });
  const departments = useDepartmentOptions();

  const set = (patch: Partial<LicenseFilters>) =>
    setFilters((f) => ({ ...f, page: 1, ...patch }));
  const pick = (v: string) => (v === ALL ? '' : v);
  const licenseTypes = leaveTypes.filter(
    (t) => t.code !== VACATION_CODE && t.active,
  );
  const headers = showPayroll
    ? [...BASE_HEADERS, 'Impacto salarial', '']
    : [...BASE_HEADERS, ''];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-ink">Licenças</h2>
          <p className="text-xs text-ink-faint">
            Licenças legais e internas. A duração, a remuneração e os
            documentos exigidos seguem a configuração de cada tipo.
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus size={15} strokeWidth={1.75} /> Nova licença
        </Button>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <Input
            placeholder="Procurar nome ou n.º interno"
            value={filters.search}
            onChange={(e) => set({ search: e.target.value })}
            className="w-full col-span-2 md:col-span-2"
          />
          <Select
            className="w-full"
            value={filters.leaveTypeCode || ALL}
            onValueChange={(v) => set({ leaveTypeCode: pick(v) })}
            items={[
              { value: ALL, label: 'Todos os tipos' },
              ...licenseTypes.map((t) => ({ value: t.code, label: t.name })),
            ]}
          />
          <Select
            className="w-full"
            value={filters.phase || ALL}
            onValueChange={(v) => set({ phase: pick(v) })}
            items={[
              { value: ALL, label: 'Todos os estados' },
              ...Object.entries(PHASE_CFG).map(([value, c]) => ({
                value,
                label: c.label,
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
          <div className="flex items-center gap-2">
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
          title="Sem licenças para os filtros seleccionados"
          description="Ajuste os filtros ou registe uma nova licença."
        />
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  {headers.map((h, i) => (
                    <TableHeaderCell key={`${h}-${i}`}>{h}</TableHeaderCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {data.data.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <p className="font-medium text-ink">{r.user.fullName}</p>
                      <p className="text-xs text-ink-faint">
                        {r.user.employeeNumber ?? '—'}
                        {r.registeredBy &&
                          ` · registada por ${r.registeredBy.fullName ?? '—'}`}
                      </p>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-2">
                        {r.type.color && (
                          <span
                            aria-hidden
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: r.type.color }}
                          />
                        )}
                        {r.type.name}
                      </span>
                    </TableCell>
                    <TableCell>{periodLabel(r)}</TableCell>
                    <TableCell>{durationLabel(r)}</TableCell>
                    <TableCell>{PAY_REGIME_LABELS[r.payRegime]}</TableCell>
                    <TableCell>
                      {r.documents.length > 0 ? (
                        <ul className="space-y-0.5">
                          {r.documents.map((d) => (
                            <li key={d.id}>
                              <a
                                href={d.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-primary hover:underline"
                              >
                                <Paperclip size={12} strokeWidth={1.75} />
                                {d.name}
                              </a>
                            </li>
                          ))}
                        </ul>
                      ) : r.hasDocument ? (
                        <span
                          className="inline-flex items-center gap-1 text-ink-faint"
                          title="Documento protegido — acesso restrito ao titular e ao RH"
                        >
                          <FileLock2 size={13} strokeWidth={1.75} /> Protegido
                        </span>
                      ) : r.type.requiresDocument ? (
                        <span className="text-warning-ink">Em falta</span>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>{formatDateTime(r.submittedAt)}</TableCell>
                    <TableCell>{r.approver?.fullName ?? '—'}</TableCell>
                    <TableCell>
                      <StatusBadge
                        value={r.phase}
                        map={PHASE_CFG}
                        variant="dot"
                      />
                    </TableCell>
                    {showPayroll && (
                      <TableCell>
                        {r.payrollImpact === 'VALIDATION_REQUIRED'
                          ? 'Validar no Payroll'
                          : '—'}
                      </TableCell>
                    )}
                    <TableCell>
                      {r.canCancel && (
                        <IconButton
                          icon={X}
                          label="Cancelar pedido"
                          intent="ghost"
                          onClick={() => onCancel(r.id)}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="text-xs text-ink-faint">
            {data.meta.total} licença(s). O motivo e os comprovativos de tipos
            sensíveis só são visíveis ao titular e ao RH.
          </p>
          <Pagination
            page={data.meta.page}
            totalPages={data.meta.totalPages}
            onPageChange={(page) => setFilters((f) => ({ ...f, page }))}
          />
        </>
      )}

      {showModal && (
        <NewLicenseModal
          leaveTypes={licenseTypes}
          onClose={() => setShowModal(false)}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}
