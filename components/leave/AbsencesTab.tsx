// components/leave/AbsencesTab.tsx
// Separador "Gestão de Ausências" (docs/Modulo_Leave.md §5) — ocorrências
// planeadas e imprevistas, com os campos do spec, filtros, exportação e
// entrada para o registo e para o detalhe (justificar, validar, corrigir…).
// O âmbito, a privacidade e as acções permitidas vêm do backend.

'use client';

import { ExportMenu } from '@/components/ui/ExportMenu';
import { saveCsvContent, type ExportFormat } from '@/lib/tableExport';
import { useState } from 'react';
import {
  Building2,
  Compass,
  Filter,
  MapPin,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { useDepartmentOptions } from '@/components/competencies/modelFormData';
import { useApiMutation } from '@/hooks/useApiQuery';
import { useCurrentRole, useHasRole } from '@/hooks/useCurrentRole';
import { useDebounce } from '@/hooks/useDebounce';
import { useAbsences, type AbsenceFilters } from '@/hooks/useLeave';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { AbsenceCard } from './AbsenceCard';
import { AbsenceDetailModal } from './AbsenceDetailModal';
import { RegisterAbsenceModal } from './RegisterAbsenceModal';
import {
  ABSENCE_SOURCE_LABELS,
  ABSENCE_TYPE_LABELS,
  JUSTIFICATION_CFG,
} from './constants';
import type { CsvExport } from './types';
import { EVAL_CREATOR_ROLES } from '@/lib/roles';

const ALL = 'ALL';
const REVIEWER_ROLES = EVAL_CREATOR_ROLES;
export function AbsencesTab() {
  const role = useCurrentRole();
  const notify = useToast();
  const isReviewer = useHasRole(REVIEWER_ROLES);
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
    (_format: ExportFormat) =>
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
      onSuccess: (r, format) =>
        void saveCsvContent(r.filename, r.content, format, 'Ausências').catch(
          (e) => notify({ title: e.message, intent: 'danger' }),
        ),
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );
  const cancel = useApiMutation(
    (id: number) => apiClient.patch(`/leave/absences/${id}/cancel`, {}),
    {
      invalidateKeys: [queryKeys.leave.all],
      onSuccess: () =>
        notify({ title: 'Registo de ausência cancelado.', intent: 'success' }),
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );
  const confirm = useConfirm();
  const handleCancel = async (id: number) => {
    if (
      !(await confirm({
        title: 'Cancelar este registo de ausência?',
        message:
          'O registo, os comprovativos e o histórico de correcções serão removidos. Esta acção não pode ser anulada.',
        confirmLabel: 'Cancelar registo',
        cancelLabel: 'Manter registo',
        destructive: true,
      }))
    )
      return;
    cancel.mutate(id);
  };
  const sync = useApiMutation(
    () =>
      apiClient.post<{ created: number; skipped: number }>(
        '/leave/absences/sync-attendance',
        {},
      ),
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

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-ink">
            Gestão de Ausências
          </h2>
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
            <ExportMenu
              formats={['csv', 'pdf']}
              loading={exportCsv.isPending}
              onExport={(f) => exportCsv.mutate(f)}
            />
          )}
          <Button onClick={() => setShowRegister(true)}>
            <Plus size={15} strokeWidth={1.75} /> Registar ausência
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden p-4">
        <h3 className="-mx-4 -mt-4 mb-3 bg-brand-dark px-4 py-3 text-sm font-semibold text-white">
          Filtros
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <Input
            variant="underline"
            placeholder="Procurar nome ou n.º interno"
            value={filters.search}
            onChange={(e) => set({ search: e.target.value })}
            className="w-full col-span-2"
          />
          <Select
            variant="underline"
            icon={Filter}
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
            variant="underline"
            icon={MapPin}
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
            variant="underline"
            icon={Compass}
            className="w-full"
            value={filters.source || ALL}
            onValueChange={(v) => set({ source: pick(v) })}
            items={[
              { value: ALL, label: 'Todas as origens' },
              ...Object.entries(ABSENCE_SOURCE_LABELS).map(
                ([value, label]) => ({
                  value,
                  label,
                }),
              ),
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
          wrapperClassName="space-y-2"
          itemClassName="h-10 bg-surface-sunken rounded-control"
        />
      ) : !data || data.data.length === 0 ? (
        <EmptyState
          title="Sem ocorrências para os filtros seleccionados"
          description="Ajuste os filtros ou registe uma ausência."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4">
            {data.data.map((a) => (
              <AbsenceCard
                key={a.id}
                row={a}
                showPayroll={isOrg}
                onOpen={setOpenId}
                onCancel={handleCancel}
              />
            ))}
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
        <AbsenceDetailModal
          absenceId={openId}
          onClose={() => setOpenId(null)}
        />
      )}
    </div>
  );
}
