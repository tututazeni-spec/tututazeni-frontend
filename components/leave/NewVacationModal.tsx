// components/leave/NewVacationModal.tsx
// Modal "Novo pedido de férias" (docs/Modulo_Leave.md §3.2). O total de dias,
// feriados, saldo e sobreposições vêm de GET /leave/duration-preview — o
// frontend não recalcula nada; o backend revalida tudo na submissão.

'use client';

import { useState } from 'react';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { apiClient } from '@/lib/apiClient';
import { formatDate } from '@/lib/format';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Button } from '@/components/ui/Button';
import { Combobox } from '@/components/ui/Combobox';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import {
  CAN_PICK_EMPLOYEE_LEAVE,
  useEmployeeOptions,
} from './useEmployeeOptions';
import type { ConflictCheck, DurationPreview } from './types';

const VACATION_CODE = 'VACATION';

export interface NewVacationModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function NewVacationModal({ onClose, onSuccess }: NewVacationModalProps) {
  const role = useCurrentRole();
  const { data: me } = useCurrentUser();
  const canPick = !!role && CAN_PICK_EMPLOYEE_LEAVE.includes(role);
  const employees = useEmployeeOptions('leave-vacation', canPick);

  const thisYear = new Date().getFullYear();
  const [form, setForm] = useState({
    userId: '',
    referenceYear: String(thisYear),
    startDate: '',
    endDate: '',
    contactDuringLeave: '',
    substituteId: '',
    reason: '',
  });
  const [submitError, setSubmitError] = useState('');
  const set = (patch: Partial<typeof form>) =>
    setForm((f) => ({ ...f, ...patch }));

  const targetUserId = canPick && form.userId ? Number(form.userId) : me?.id;
  const datesReady =
    !!form.startDate && !!form.endDate && form.endDate >= form.startDate;

  const previewParams = {
    leaveTypeCode: VACATION_CODE,
    startDate: form.startDate,
    endDate: form.endDate,
    userId: targetUserId,
  };
  const preview = useApiQuery<DurationPreview>(
    [...queryKeys.leave.all, 'duration-preview', previewParams],
    '/leave/duration-preview',
    {
      params: previewParams,
      staleTime: STALE_TIME.DYNAMIC,
      enabled: datesReady && !!targetUserId,
    },
  );
  const conflicts = useApiQuery<ConflictCheck>(
    [...queryKeys.leave.all, 'vacation-conflicts', previewParams],
    '/leave/conflict-check',
    {
      params: {
        userId: targetUserId,
        startDate: form.startDate,
        endDate: form.endDate,
      },
      staleTime: STALE_TIME.DYNAMIC,
      enabled: datesReady && !!targetUserId,
    },
  );
  const p = datesReady ? (preview.data ?? null) : null;
  const c = datesReady ? (conflicts.data ?? null) : null;

  const create = useApiMutation(
    () =>
      apiClient.post('/leave', {
        userId: targetUserId,
        leaveTypeCode: VACATION_CODE,
        startDate: form.startDate,
        endDate: form.endDate,
        referenceYear: Number(form.referenceYear),
        contactDuringLeave: form.contactDuringLeave || undefined,
        substituteId: form.substituteId ? Number(form.substituteId) : undefined,
        reason: form.reason || undefined,
      }),
    {
      invalidateKeys: [queryKeys.leave.all],
      onSuccess: () => {
        onSuccess();
        onClose();
      },
      onError: (e) => setSubmitError(e.message),
    },
  );

  const missing =
    !targetUserId || !datesReady
      ? 'Preencha o colaborador e as datas de início e fim.'
      : '';
  const blocked = !!p?.exceedsBalance || !!p?.selfOverlap;

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Novo pedido de férias"
        description="O saldo, os feriados e as sobreposições são validados antes da submissão."
        className="max-w-xl max-h-[90vh] overflow-y-auto"
      >
        <div className="mt-4 space-y-4">
          {submitError && (
            <div className="flex items-center gap-2 p-3 bg-danger-subtle text-danger-ink rounded-card text-sm">
              <AlertCircle size={16} strokeWidth={1.75} />
              {submitError}
            </div>
          )}

          {canPick && (
            <FormField label="Colaborador *" htmlFor="nvm-user">
              <Combobox
                items={employees}
                value={form.userId}
                onValueChange={(v) => set({ userId: v })}
                placeholder="Seleccionar colaborador"
                searchPlaceholder="Procurar colaborador…"
                emptyText="Nenhum colaborador encontrado"
                className="w-full"
              />
            </FormField>
          )}

          <FormField label="Ano de referência *" htmlFor="nvm-year">
            <Select
              className="w-full"
              value={form.referenceYear}
              onValueChange={(v) => set({ referenceYear: v })}
              placeholder="Seleccionar ano"
              items={[thisYear - 1, thisYear, thisYear + 1].map((y) => ({
                value: String(y),
                label: String(y),
              }))}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Data de início *" htmlFor="nvm-start">
              <Input
                id="nvm-start"
                type="date"
                value={form.startDate}
                onChange={(e) => set({ startDate: e.target.value })}
                className="w-full"
              />
            </FormField>
            <FormField label="Data de fim *" htmlFor="nvm-end">
              <Input
                id="nvm-end"
                type="date"
                min={form.startDate}
                value={form.endDate}
                onChange={(e) => set({ endDate: e.target.value })}
                className="w-full"
              />
            </FormField>
          </div>

          <FormField
            label="Total de dias"
            htmlFor="nvm-days"
            hint="Calculado automaticamente pelas regras aplicáveis (dias úteis e feriados)"
          >
            <Input
              id="nvm-days"
              readOnly
              value={p ? `${p.workDays} dia(s) úteis · ${p.calendarDays} de calendário` : '—'}
              className="w-full bg-surface-sunken"
            />
          </FormField>

          {p && (
            <div className="space-y-2 text-sm">
              <p className="text-ink-muted">
                Saldo disponível:{' '}
                <strong className="text-ink">{p.availableBalance ?? 0} dia(s)</strong>
                {!!p.reservedDays && (
                  <span className="text-ink-faint">
                    {' '}
                    ({p.reservedDays} reservado(s) em pedidos pendentes)
                  </span>
                )}
              </p>
              {p.holidays.length > 0 && (
                <p className="text-ink-muted">
                  Feriados no período (não contam):{' '}
                  {p.holidays
                    .map((h) => `${h.name} (${formatDate(h.date)})`)
                    .join(', ')}
                </p>
              )}
              {p.exceedsBalance && (
                <p className="flex items-center gap-2 p-3 rounded-card bg-danger-subtle text-danger-ink">
                  <AlertTriangle size={14} strokeWidth={1.75} />
                  O pedido excede o saldo disponível.
                </p>
              )}
              {p.selfOverlap && (
                <p className="flex items-center gap-2 p-3 rounded-card bg-danger-subtle text-danger-ink">
                  <AlertTriangle size={14} strokeWidth={1.75} />
                  Já existe um pedido de {formatDate(p.selfOverlap.startDate)} a{' '}
                  {formatDate(p.selfOverlap.endDate)} que sobrepõe este período.
                </p>
              )}
            </div>
          )}
          {c && c.teamConflictCount > 0 && (
            <p className="flex items-center gap-2 p-3 rounded-card bg-warning-subtle text-warning-ink text-sm">
              <AlertTriangle size={14} strokeWidth={1.75} />
              {c.teamConflictCount} colega(s) da equipa ausente(s) no mesmo
              período — o gestor será alertado.
            </p>
          )}

          <FormField label="Contacto durante as férias" htmlFor="nvm-contact">
            <Input
              id="nvm-contact"
              value={form.contactDuringLeave}
              maxLength={120}
              onChange={(e) => set({ contactDuringLeave: e.target.value })}
              placeholder="Telefone ou contacto alternativo (opcional)"
              className="w-full"
            />
          </FormField>

          <FormField label="Pessoa de substituição" htmlFor="nvm-sub">
            <Combobox
              items={employees}
              value={form.substituteId}
              onValueChange={(v) => set({ substituteId: v })}
              placeholder="Seleccionar colaborador, se aplicável"
              searchPlaceholder="Procurar colaborador…"
              emptyText="Nenhum colaborador encontrado"
              className="w-full"
              disabled={!canPick}
            />
          </FormField>

          <FormField label="Observações" htmlFor="nvm-reason">
            <Textarea
              id="nvm-reason"
              rows={3}
              value={form.reason}
              onChange={(e) => set({ reason: e.target.value })}
              placeholder="Motivo ou informação complementar"
              className="w-full resize-none"
            />
          </FormField>
        </div>

        <div className="mt-6 flex items-center gap-3 border-t border-border pt-4">
          {missing && <span className="text-xs text-ink-faint">{missing}</span>}
          <div className="flex-1" />
          <Button intent="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            loading={create.isPending}
            disabled={!!missing || blocked}
            onClick={() => {
              setSubmitError('');
              create.mutate(undefined);
            }}
          >
            Submeter pedido
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
