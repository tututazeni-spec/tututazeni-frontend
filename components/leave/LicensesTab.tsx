// components/leave/LicensesTab.tsx
// Separador "Licenças" (docs/Modulo_Leave.md §4) — tabela de licenças com os
// campos do spec e entrada para o modal "Nova licença". O âmbito (próprio /
// equipa / organização) e a privacidade vêm do backend: motivo e comprovativos
// de tipos sensíveis chegam ocultos a quem não é o titular nem o RH, e o
// impacto salarial só chega a ADMIN/RH.

'use client';

import { useState } from 'react';
import { Building2, Filter, MapPin, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { useDepartmentOptions } from '@/components/competencies/modelFormData';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { useDebounce } from '@/hooks/useDebounce';
import { useLicenses, type LicenseFilters } from '@/hooks/useLeave';
import { ApprovalDecisionModal } from './ApprovalDecisionModal';
import { PHASE_CFG } from './constants';
import { LicenseCard } from './LicenseCard';
import { LicenseDetailModal } from './LicenseDetailModal';
import { NewLicenseModal } from './NewLicenseModal';
import type { LeaveType, LicenseRow } from './types';

const ALL = 'ALL';
const VACATION_CODE = 'VACATION';
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
  const [openRow, setOpenRow] = useState<LicenseRow | null>(null);
  const [deciding, setDeciding] = useState<{
    row: LicenseRow;
    action: 'APPROVE' | 'REJECT';
  } | null>(null);
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
            Licenças legais e internas. A duração, a remuneração e os documentos
            exigidos seguem a configuração de cada tipo.
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus size={15} strokeWidth={1.75} /> Nova licença
        </Button>
      </div>

      <Card className="overflow-hidden p-4">
        <h3 className="-mx-4 -mt-4 mb-3 bg-brand-dark px-4 py-3 text-sm font-semibold text-white">
          Filtros
        </h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
          <Input
            variant="underline"
            placeholder="Procurar nome ou n.º interno"
            value={filters.search}
            onChange={(e) => set({ search: e.target.value })}
            className="w-full col-span-2 md:col-span-2"
          />
          <Select
            variant="underline"
            icon={Filter}
            className="w-full"
            value={filters.leaveTypeCode || ALL}
            onValueChange={(v) => set({ leaveTypeCode: pick(v) })}
            items={[
              { value: ALL, label: 'Todos os tipos' },
              ...licenseTypes.map((t) => ({ value: t.code, label: t.name })),
            ]}
          />
          <Select
            variant="underline"
            icon={MapPin}
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
          <div className="col-span-2 flex min-w-0 items-center gap-2">
            <Input
              type="date"
              aria-label="Desde"
              value={filters.from}
              onChange={(e) => set({ from: e.target.value })}
              className="w-full min-w-0"
            />
            <span className="text-xs text-ink-faint" aria-hidden>
              até
            </span>
            <Input
              type="date"
              aria-label="Até"
              min={filters.from}
              value={filters.to}
              onChange={(e) => set({ to: e.target.value })}
              className="w-full min-w-0"
            />
          </div>
        </div>
      </Card>

      {loading && !data ? (
        <Skeleton
          rows={6}
          wrapperClassName="space-y-2"
          itemClassName="h-10 bg-surface-sunken rounded-control"
        />
      ) : !data || data.data.length === 0 ? (
        <EmptyState
          title="Sem licenças para os filtros seleccionados"
          description="Ajuste os filtros ou registe uma nova licença."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4">
            {data.data.map((r) => (
              <LicenseCard
                key={r.id}
                row={r}
                showPayroll={showPayroll}
                onCancel={onCancel}
                onDecide={(row, action) => setDeciding({ row, action })}
                onOpen={setOpenRow}
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

      {openRow && (
        <LicenseDetailModal
          row={openRow}
          onClose={() => setOpenRow(null)}
          onDecide={(row, action) => {
            setOpenRow(null);
            setDeciding({ row, action });
          }}
        />
      )}

      {deciding && (
        <ApprovalDecisionModal
          row={{
            requestId: deciding.row.id,
            request: {
              user: deciding.row.user,
              type: deciding.row.type,
              startDate: deciding.row.startDate,
              endDate: deciding.row.endDate,
            },
          }}
          action={deciding.action}
          onClose={() => setDeciding(null)}
        />
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
