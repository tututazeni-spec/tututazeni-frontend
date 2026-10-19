// components/leave/LicensesTab.tsx
// Separador "Licenças" (docs/Modulo_Leave.md §4) — tabela de licenças com os
// campos do spec e entrada para o modal "Nova licença". O âmbito (próprio /
// equipa / organização) e a privacidade vêm do backend: motivo e comprovativos
// de tipos sensíveis chegam ocultos a quem não é o titular nem o RH, e o
// impacto salarial só chega a ADMIN/RH.

'use client';

import { useState } from 'react';
import {
  CalendarDays,
  Clock,
  FileLock2,
  Paperclip,
  Plus,
  UserCheck,
  Wallet,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  NAVY_ACTION,
  NavyBadge,
  NavyCard,
  type NavyTone,
} from '@/components/courses/NavyCard';
import { useDepartmentOptions } from '@/components/competencies/modelFormData';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { useDebounce } from '@/hooks/useDebounce';
import { useLicenses, type LicenseFilters } from '@/hooks/useLeave';
import { formatDate, formatDateTime } from '@/lib/format';
import { PAY_REGIME_LABELS, PHASE_CFG } from './constants';
import { NewLicenseModal } from './NewLicenseModal';
import type { LeaveType, LicensePhase, LicenseRow } from './types';

const PHASE_TONE: Record<LicensePhase, NavyTone> = {
  DRAFT: 'neutral',
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
  IN_PROGRESS: 'info',
  COMPLETED: 'neutral',
  CANCELLED: 'neutral',
};

const ALL = 'ALL';
const VACATION_CODE = 'VACATION';
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

      <Card className="overflow-hidden p-4">
        <h3 className="-mx-4 -mt-4 mb-3 bg-[#0F1F3D]/60 px-4 py-3 text-sm font-semibold text-white">Filtros</h3>
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
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {data.data.map((r) => (
              <NavyCard
                key={r.id}
                seed={r.id}
                avatar={{ name: r.user.fullName }}
                title={r.type.name}
                subtitle={`${r.user.fullName}${r.user.employeeNumber ? ` · ${r.user.employeeNumber}` : ''}`}
                badge={
                  <>
                    <NavyBadge tone={PHASE_TONE[r.phase]}>
                      {PHASE_CFG[r.phase].label}
                    </NavyBadge>
                    {r.type.requiresDocument &&
                      !r.hasDocument &&
                      r.documents.length === 0 && (
                        <NavyBadge tone="warning">Comprovativo em falta</NavyBadge>
                      )}
                  </>
                }
                infos={[
                  { icon: CalendarDays, value: periodLabel(r), label: 'Período' },
                  { icon: Clock, value: durationLabel(r), label: 'Duração' },
                  {
                    icon: Wallet,
                    value: PAY_REGIME_LABELS[r.payRegime],
                    label: 'Regime',
                  },
                  {
                    icon: UserCheck,
                    value: r.approver?.fullName ?? '—',
                    label: 'Aprovador',
                  },
                ]}
                footer={
                  <>
                    <span className="text-xs text-white/70">
                      Submetida em {formatDateTime(r.submittedAt)}
                      {r.registeredBy &&
                        ` · registada por ${r.registeredBy.fullName ?? '—'}`}
                    </span>
                    {r.documents.map((d) => (
                      <a
                        key={d.id}
                        href={d.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={NAVY_ACTION}
                      >
                        <Paperclip size={12} strokeWidth={1.75} className="mr-1" />
                        {d.name}
                      </a>
                    ))}
                    {r.documents.length === 0 && r.hasDocument && (
                      <span
                        className="inline-flex items-center gap-1 text-xs text-white/70"
                        title="Documento protegido — acesso restrito ao titular e ao RH"
                      >
                        <FileLock2 size={13} strokeWidth={1.75} /> Protegido
                      </span>
                    )}
                    {showPayroll && r.payrollImpact === 'VALIDATION_REQUIRED' && (
                      <NavyBadge tone="warning">Validar no Payroll</NavyBadge>
                    )}
                    {r.canCancel && (
                      <button
                        type="button"
                        className={NAVY_ACTION}
                        onClick={() => onCancel(r.id)}
                      >
                        <X size={12} strokeWidth={1.75} className="mr-1" /> Cancelar pedido
                      </button>
                    )}
                  </>
                }
              />
            ))}
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
