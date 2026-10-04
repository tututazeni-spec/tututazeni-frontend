// components/leave/NewLicenseModal.tsx
// Modal "Nova licença" (docs/Modulo_Leave.md §4): colaborador, tipo, datas e
// horas, fundamento, comprovativos, observações, responsável pelo registo,
// encaminhamento de aprovação e (só ADMIN/RH) impacto salarial. A duração, o
// saldo, as sobreposições e o encaminhamento vêm do backend — o frontend não
// recalcula nada; o backend revalida tudo na submissão.

'use client';

import { useState } from 'react';
import { AlertCircle, AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { apiClient } from '@/lib/apiClient';
import { formatDate } from '@/lib/format';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Button, IconButton } from '@/components/ui/Button';
import { Combobox } from '@/components/ui/Combobox';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { PAY_REGIME_LABELS } from './constants';
import {
  CAN_PICK_EMPLOYEE_LEAVE,
  useEmployeeOptions,
} from './useEmployeeOptions';
import type {
  ApprovalRoute,
  ConflictCheck,
  DurationPreview,
  LeaveType,
  PayRegime,
} from './types';

interface DocDraft {
  name: string;
  fileUrl: string;
}

const EMPTY_DOC: DocDraft = { name: '', fileUrl: '' };

export interface NewLicenseModalProps {
  /** Tipos de licença activos (sem férias). */
  leaveTypes: LeaveType[];
  onClose: () => void;
  onSuccess: () => void;
}

function payRegimeOf(t: LeaveType): PayRegime {
  if (!t.isPaid) return 'UNPAID';
  return t.requiresPayrollValidation ? 'TO_VALIDATE' : 'PAID';
}

export function NewLicenseModal({
  leaveTypes,
  onClose,
  onSuccess,
}: NewLicenseModalProps) {
  const role = useCurrentRole();
  const { data: me } = useCurrentUser();
  const canPick = !!role && CAN_PICK_EMPLOYEE_LEAVE.includes(role);
  const showPayroll = role === 'ADMIN' || role === 'RH';
  const employees = useEmployeeOptions('leave-license', canPick);

  const [form, setForm] = useState({
    userId: '',
    leaveTypeCode: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    reason: '',
    notes: '',
  });
  const [docs, setDocs] = useState<DocDraft[]>([{ ...EMPTY_DOC }]);
  const [submitError, setSubmitError] = useState('');
  const set = (patch: Partial<typeof form>) =>
    setForm((f) => ({ ...f, ...patch }));

  const type = leaveTypes.find((t) => t.code === form.leaveTypeCode);
  const targetUserId = canPick && form.userId ? Number(form.userId) : me?.id;
  const onBehalf = !!targetUserId && !!me && targetUserId !== me.id;
  const datesReady =
    !!form.startDate && !!form.endDate && form.endDate >= form.startDate;
  // A janela horária só faz sentido num único dia.
  const sameDay = datesReady && form.startDate === form.endDate;
  const hasTimes = sameDay && !!form.startTime && !!form.endTime;
  const timesInvalid = hasTimes && form.endTime <= form.startTime;

  const filledDocs = docs.filter((d) => d.name.trim() && d.fileUrl.trim());
  const docsIncomplete = docs.some(
    (d) => !!d.name.trim() !== !!d.fileUrl.trim(),
  );

  const previewParams = {
    leaveTypeCode: form.leaveTypeCode,
    startDate: form.startDate,
    endDate: form.endDate,
    userId: targetUserId,
  };
  const ready = !!type && datesReady && !!targetUserId;
  const preview = useApiQuery<DurationPreview>(
    [...queryKeys.leave.all, 'license-duration-preview', previewParams],
    '/leave/duration-preview',
    { params: previewParams, staleTime: STALE_TIME.DYNAMIC, enabled: ready },
  );
  const conflicts = useApiQuery<ConflictCheck>(
    [...queryKeys.leave.all, 'license-conflicts', previewParams],
    '/leave/conflict-check',
    {
      params: {
        userId: targetUserId,
        startDate: form.startDate,
        endDate: form.endDate,
      },
      staleTime: STALE_TIME.DYNAMIC,
      enabled: ready,
    },
  );
  const routeParams = {
    leaveTypeCode: form.leaveTypeCode,
    userId: targetUserId,
    workDays: preview.data?.workDays,
  };
  const route = useApiQuery<ApprovalRoute>(
    queryKeys.leave.approvalRoute(routeParams),
    '/leave/approval-route',
    {
      params: routeParams,
      staleTime: STALE_TIME.DYNAMIC,
      enabled: !!type && !!targetUserId,
    },
  );
  const p = ready ? (preview.data ?? null) : null;
  const c = ready ? (conflicts.data ?? null) : null;
  const r = type ? (route.data ?? null) : null;

  const reason =
    [form.reason.trim(), form.notes.trim() && `Observações: ${form.notes.trim()}`]
      .filter(Boolean)
      .join('\n\n') || undefined;

  const create = useApiMutation(
    (saveAsDraft: boolean) =>
      apiClient.post('/leave', {
        userId: targetUserId,
        leaveTypeCode: form.leaveTypeCode,
        startDate: form.startDate,
        endDate: form.endDate,
        startTime: hasTimes ? form.startTime : undefined,
        endTime: hasTimes ? form.endTime : undefined,
        reason,
        documents: filledDocs.length
          ? filledDocs.map((d) => ({
              name: d.name.trim(),
              fileUrl: d.fileUrl.trim(),
            }))
          : undefined,
        saveAsDraft,
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

  const missing = !targetUserId
    ? 'Seleccione o colaborador.'
    : !type
      ? 'Seleccione o tipo de licença.'
      : !datesReady
        ? 'Preencha as datas de início e fim.'
        : timesInvalid
          ? 'A hora de fim tem de ser posterior ao início.'
          : docsIncomplete
            ? 'Preencha o nome e o endereço (https) de cada documento.'
            : '';
  const needsDoc = !!type?.requiresDocument && filledDocs.length === 0;
  const blocked = !!p?.exceedsBalance || !!p?.selfOverlap;

  const submit = (saveAsDraft: boolean) => {
    setSubmitError('');
    create.mutate(saveAsDraft);
  };

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Nova licença"
        description="A duração, o saldo e as sobreposições são validados antes da submissão."
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="mt-4 space-y-4">
          {submitError && (
            <div className="flex items-center gap-2 p-3 bg-danger-subtle text-danger-ink rounded-card text-sm">
              <AlertCircle size={16} strokeWidth={1.75} />
              {submitError}
            </div>
          )}

          {canPick && (
            <FormField label="Colaborador *" htmlFor="nlc-user">
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

          <FormField label="Tipo de licença *" htmlFor="nlc-type">
            <Select
              className="w-full"
              value={form.leaveTypeCode}
              onValueChange={(v) => set({ leaveTypeCode: v })}
              placeholder="Seleccionar tipo de licença"
              items={leaveTypes.map((t) => ({ value: t.code, label: t.name }))}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Data de início *" htmlFor="nlc-start">
              <Input
                id="nlc-start"
                type="date"
                value={form.startDate}
                onChange={(e) => set({ startDate: e.target.value })}
                className="w-full"
              />
            </FormField>
            <FormField label="Data de fim prevista *" htmlFor="nlc-end">
              <Input
                id="nlc-end"
                type="date"
                min={form.startDate}
                value={form.endDate}
                onChange={(e) => set({ endDate: e.target.value })}
                className="w-full"
              />
            </FormField>
            <FormField
              label="Hora de início"
              htmlFor="nlc-stime"
              hint={sameDay ? undefined : 'Só para licenças de um único dia'}
            >
              <Input
                id="nlc-stime"
                type="time"
                disabled={!sameDay}
                value={form.startTime}
                onChange={(e) => set({ startTime: e.target.value })}
                className="w-full"
              />
            </FormField>
            <FormField label="Hora de fim prevista" htmlFor="nlc-etime">
              <Input
                id="nlc-etime"
                type="time"
                disabled={!sameDay}
                value={form.endTime}
                onChange={(e) => set({ endTime: e.target.value })}
                className="w-full"
              />
            </FormField>
          </div>

          {p && (
            <div className="space-y-2 text-sm">
              <p className="text-ink-muted">
                Duração:{' '}
                <strong className="text-ink">
                  {p.workDays} dia(s) úteis · {p.calendarDays} de calendário
                </strong>
                {p.availableBalance !== null && (
                  <>
                    {' '}
                    · Saldo disponível:{' '}
                    <strong className="text-ink">
                      {p.availableBalance} dia(s)
                    </strong>
                  </>
                )}
              </p>
              {p.holidays.length > 0 && (
                <p className="text-ink-muted">
                  Feriados no período:{' '}
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

          <FormField label="Motivo ou fundamento" htmlFor="nlc-reason">
            <Textarea
              id="nlc-reason"
              rows={3}
              value={form.reason}
              onChange={(e) => set({ reason: e.target.value })}
              placeholder="Fundamento do pedido"
              className="w-full resize-none"
            />
          </FormField>

          <div className="space-y-2">
            <p className="text-sm font-medium text-ink">
              Documentação comprovativa{type?.requiresDocument ? ' *' : ''}
            </p>
            {type?.isSensitive && (
              <p className="text-xs text-ink-faint">
                Este tipo contém dados sensíveis: os documentos só ficam
                acessíveis ao colaborador e ao RH.
              </p>
            )}
            {docs.map((d, i) => (
              <div key={i} className="flex items-start gap-2">
                <Input
                  aria-label={`Nome do documento ${i + 1}`}
                  placeholder="Nome (ex.: Atestado médico)"
                  value={d.name}
                  onChange={(e) =>
                    setDocs((all) =>
                      all.map((x, j) =>
                        j === i ? { ...x, name: e.target.value } : x,
                      ),
                    )
                  }
                  className="w-full"
                />
                <Input
                  aria-label={`Endereço do documento ${i + 1}`}
                  placeholder="https://…"
                  value={d.fileUrl}
                  onChange={(e) =>
                    setDocs((all) =>
                      all.map((x, j) =>
                        j === i ? { ...x, fileUrl: e.target.value } : x,
                      ),
                    )
                  }
                  className="w-full"
                />
                <IconButton
                  icon={Trash2}
                  label="Remover documento"
                  intent="ghost"
                  disabled={docs.length === 1 && !d.name && !d.fileUrl}
                  onClick={() =>
                    setDocs((all) =>
                      all.length === 1
                        ? [{ ...EMPTY_DOC }]
                        : all.filter((_, j) => j !== i),
                    )
                  }
                />
              </div>
            ))}
            {docs.length < 10 && (
              <Button
                intent="ghost"
                size="sm"
                onClick={() => setDocs((all) => [...all, { ...EMPTY_DOC }])}
              >
                <Plus size={13} strokeWidth={1.75} /> Adicionar documento
              </Button>
            )}
            {needsDoc && (
              <p className="text-xs text-warning-ink">
                Este tipo exige comprovativo — pode guardar como rascunho e
                anexá-lo depois, mas só submete com o documento.
              </p>
            )}
          </div>

          <FormField label="Observações" htmlFor="nlc-notes">
            <Textarea
              id="nlc-notes"
              rows={2}
              value={form.notes}
              onChange={(e) => set({ notes: e.target.value })}
              placeholder="Informação complementar"
              className="w-full resize-none"
            />
          </FormField>

          {onBehalf && (
            <FormField label="Registado por" htmlFor="nlc-by">
              <Input
                id="nlc-by"
                readOnly
                value={me?.fullName ?? ''}
                className="w-full bg-surface-sunken"
              />
            </FormField>
          )}

          {type && (
            <div className="rounded-card border border-border p-3 text-sm space-y-1.5">
              <p className="font-medium text-ink">Encaminhamento para aprovação</p>
              {r === null ? (
                <p className="text-ink-faint">A calcular…</p>
              ) : r.autoApprove ? (
                <p className="text-ink-muted">
                  Aprovação automática para esta duração.
                </p>
              ) : r.steps.length === 0 ? (
                <p className="text-ink-muted">
                  Sem gestor atribuído — o pedido será aprovado
                  automaticamente na submissão.
                </p>
              ) : (
                <ol className="space-y-0.5 text-ink-muted">
                  {r.steps.map((s) => (
                    <li key={s.level}>
                      {s.level}.º nível ({s.role === 'RH' ? 'RH' : 'Gestor'}):{' '}
                      <strong className="text-ink">{s.approver.fullName}</strong>
                    </li>
                  ))}
                </ol>
              )}
              {showPayroll && (
                <p className="text-ink-muted pt-1 border-t border-border">
                  Regime remuneratório:{' '}
                  <strong className="text-ink">
                    {PAY_REGIME_LABELS[payRegimeOf(type)]}
                  </strong>
                  {(!type.isPaid || type.requiresPayrollValidation) &&
                    ' · o registo seguirá para validação do Payroll'}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center gap-3 border-t border-border pt-4">
          {missing && <span className="text-xs text-ink-faint">{missing}</span>}
          <div className="flex-1" />
          <Button intent="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            intent="secondary"
            loading={create.isPending}
            disabled={!!missing}
            onClick={() => submit(true)}
          >
            Guardar rascunho
          </Button>
          <Button
            loading={create.isPending}
            disabled={!!missing || blocked || needsDoc}
            onClick={() => submit(false)}
          >
            Submeter
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
