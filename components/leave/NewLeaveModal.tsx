// components/leave/NewLeaveModal.tsx
// Wizard de 3 passos para solicitar uma nova licença — validação
// (useFormValidation) + verificação de conflitos + mutação de criação.
// Extraído de app/(platform)/leave/page.tsx. Migrado para a fundação de
// design: backdrop+painel bespoke passam a Modal/ModalContent (Radix
// Dialog, components/ui/Modal) — mesmo padrão de
// components/work-declaration/CreateModal.tsx; campos passam a
// FormField/Input/Textarea; botões passam a Button. Mesmos
// endpoints/payload/validação — só apresentação. A cor de cada tipo de
// licença (`leaveType.color`) continua dinâmica — é codificação de dados
// por categoria (qual tipo escolhido), não decoração.

'use client';

import { useState } from 'react';
import { AlertCircle, Calendar, Check } from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { apiClient } from '@/lib/apiClient';
import { reportError } from '@/lib/errorReporting';
import { queryKeys } from '@/lib/queryKeys';
import { useFormValidation } from '@/hooks/useFormValidation';
import { required } from '@/lib/validation';
import { cn } from '@/lib/cn';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { CATEGORY_LABELS } from './constants';
import type {
  ConflictCheck,
  DurationMode,
  LeaveBalance,
  LeaveType,
} from './types';

export interface NewLeaveModalProps {
  leaveTypes: LeaveType[];
  balances: LeaveBalance[];
  onClose: () => void;
  onSuccess: () => void;
}

export function NewLeaveModal({
  leaveTypes,
  balances,
  onClose,
  onSuccess,
}: NewLeaveModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const notify = useToast();
  const { data: currentUser } = useCurrentUser();
  const {
    values: form,
    setValues: setForm,
    errorMessage: validationError,
    handleSubmit: withValidation,
  } = useFormValidation(
    {
      leaveTypeCode: '',
      startDate: '',
      endDate: '',
      durationMode: 'FULL_DAY' as DurationMode,
      reason: '',
      saveAsDraft: false,
    },
    {
      leaveTypeCode: [required()],
      startDate: [required()],
      endDate: [required()],
    },
  );
  const [conflicts, setConflicts] = useState<ConflictCheck | null>(null);
  const [submitError, setSubmitError] = useState('');
  const error = validationError || submitError;

  const selectedType = leaveTypes.find((t) => t.code === form.leaveTypeCode);
  const selectedBalance = balances.find(
    (b) => b.leaveTypeCode === form.leaveTypeCode,
  );

  const checkConflicts = async () => {
    if (!form.startDate || !form.endDate || !currentUser) return;
    try {
      const r = await apiClient.get<ConflictCheck>('/leave/conflict-check', {
        params: {
          userId: currentUser.id,
          startDate: form.startDate,
          endDate: form.endDate,
        },
      });
      setConflicts(r);
    } catch (e) {
      reportError(e, { source: 'NewLeaveModal.checkConflicts' });
      notify({
        title: 'Não foi possível verificar conflitos',
        intent: 'danger',
      });
    }
  };

  const create = useApiMutation(() => apiClient.post('/leave', form), {
    invalidateKeys: [queryKeys.leave.all],
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: (e) => setSubmitError(e.message),
  });
  const loading = create.isPending;

  const handleSubmit = withValidation(() => {
    setSubmitError('');
    create.mutate(undefined);
  });

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Solicitar Licença"
        description={`Passo ${step} de 3`}
        className="max-w-lg max-h-[90vh] overflow-y-auto"
      >
        {/* Progress */}
        <div className="mt-4 flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                'h-1.5 w-8 rounded-pill transition-colors',
                step >= s ? 'bg-primary' : 'bg-surface-sunken',
              )}
            />
          ))}
        </div>

        <div className="mt-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-danger-subtle text-danger-ink rounded-card text-sm">
              <AlertCircle size={16} strokeWidth={1.75} />
              {error}
            </div>
          )}

          {/* STEP 1: Tipo */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-ink-muted">
                Seleccione o tipo de licença
              </p>
              <div className="grid grid-cols-1 gap-2 max-h-72 overflow-y-auto pr-1">
                {leaveTypes.map((lt) => {
                  const bal = balances.find((b) => b.leaveTypeCode === lt.code);
                  return (
                    <button
                      key={lt.code}
                      onClick={() =>
                        setForm((f) => ({ ...f, leaveTypeCode: lt.code }))
                      }
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-card border-2 text-left transition-all',
                        form.leaveTypeCode === lt.code
                          ? 'border-primary bg-primary-subtle'
                          : 'border-border hover:border-border-strong hover:bg-surface-sunken',
                      )}
                    >
                      <div
                        className="w-9 h-9 rounded-control flex items-center justify-center flex-shrink-0"
                        style={{
                          backgroundColor: lt.color + '20',
                          color: lt.color,
                        }}
                      >
                        <Calendar size={16} strokeWidth={1.75} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-ink">
                          {lt.name}
                        </p>
                        <p className="text-xs text-ink-faint">
                          {CATEGORY_LABELS[lt.category]} ·{' '}
                          {lt.isPaid ? 'Remunerada' : 'Não remunerada'}
                        </p>
                      </div>
                      {bal && (
                        <div className="text-right flex-shrink-0">
                          <p
                            className="text-sm font-bold"
                            style={{ color: lt.color }}
                          >
                            {bal.effectiveBalance}
                          </p>
                          <p className="text-xs text-ink-faint">dias</p>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Datas */}
          {step === 2 && (
            <div className="space-y-4">
              {selectedType && (
                <div
                  className="flex items-center gap-3 p-3 rounded-card"
                  style={{ backgroundColor: selectedType.color + '15' }}
                >
                  <Calendar
                    size={16}
                    strokeWidth={1.75}
                    style={{ color: selectedType.color }}
                  />
                  <span
                    className="text-sm font-medium"
                    style={{ color: selectedType.color }}
                  >
                    {selectedType.name}
                  </span>
                  {selectedBalance && (
                    <span
                      className="text-xs ml-auto"
                      style={{ color: selectedType.color }}
                    >
                      {selectedBalance.effectiveBalance} dias disponíveis
                    </span>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Início *" htmlFor="nlm-start">
                  <Input
                    id="nlm-start"
                    type="date"
                    value={form.startDate}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, startDate: e.target.value }));
                      setConflicts(null);
                    }}
                    className="w-full"
                  />
                </FormField>
                <FormField label="Fim *" htmlFor="nlm-end">
                  <Input
                    id="nlm-end"
                    type="date"
                    value={form.endDate}
                    min={form.startDate}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, endDate: e.target.value }));
                      setConflicts(null);
                    }}
                    className="w-full"
                  />
                </FormField>
              </div>

              {selectedType?.allowHalfDay && (
                <div>
                  <p className="block text-xs font-medium text-ink-muted mb-1">
                    Duração
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {['FULL_DAY', 'HALF_AM', 'HALF_PM'].map((mode) => (
                      <button
                        key={mode}
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            durationMode: mode as DurationMode,
                          }))
                        }
                        className={cn(
                          'py-2 text-xs rounded-control border-2 font-medium transition-colors',
                          form.durationMode === mode
                            ? 'border-primary bg-primary-subtle text-primary'
                            : 'border-border text-ink-muted hover:bg-surface-sunken',
                        )}
                      >
                        {mode === 'FULL_DAY'
                          ? 'Dia inteiro'
                          : mode === 'HALF_AM'
                            ? 'Manhã'
                            : 'Tarde'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {form.startDate && form.endDate && !conflicts && (
                <Button
                  intent="secondary"
                  size="sm"
                  className="w-full"
                  onClick={checkConflicts}
                >
                  Verificar conflitos
                </Button>
              )}

              {conflicts && (
                <div
                  className={cn(
                    'p-3 rounded-card text-sm',
                    conflicts.hasUserConflict || conflicts.isAtRisk
                      ? 'bg-danger-subtle text-danger-ink'
                      : 'bg-success-subtle text-success-ink',
                  )}
                >
                  {conflicts.hasUserConflict && (
                    <p className="font-medium">
                      ⚠️ Já tem uma ausência neste período
                    </p>
                  )}
                  {!conflicts.hasUserConflict && conflicts.isAtRisk && (
                    <p>
                      ⚠️ {conflicts.teamConflictCount} colega(s) ausente(s) no
                      mesmo período
                    </p>
                  )}
                  {!conflicts.hasUserConflict && !conflicts.isAtRisk && (
                    <p>✓ Sem conflitos detectados</p>
                  )}
                </div>
              )}

              <FormField
                label={`Motivo ${selectedType?.requiresDocument ? '*' : '(opcional)'}`}
                htmlFor="nlm-reason"
              >
                <Textarea
                  id="nlm-reason"
                  value={form.reason}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, reason: e.target.value }))
                  }
                  rows={3}
                  placeholder="Descreva o motivo da ausência..."
                  className="w-full resize-none"
                />
              </FormField>
            </div>
          )}

          {/* STEP 3: Confirmação */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="divide-y divide-border rounded-card border border-border bg-surface-sunken px-4">
                {[
                  { label: 'Tipo', value: selectedType?.name },
                  {
                    label: 'Período',
                    value: `${form.startDate} → ${form.endDate}`,
                  },
                  {
                    label: 'Duração',
                    value:
                      form.durationMode === 'FULL_DAY'
                        ? 'Dia inteiro'
                        : form.durationMode === 'HALF_AM'
                          ? 'Manhã'
                          : 'Tarde',
                  },
                  { label: 'Motivo', value: form.reason || '—' },
                  {
                    label: 'Remunerada',
                    value: selectedType?.isPaid ? 'Sim' : 'Não',
                  },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex justify-between text-sm py-3"
                  >
                    <span className="text-ink-muted">{row.label}</span>
                    <span className="font-medium text-ink">{row.value}</span>
                  </div>
                ))}
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.saveAsDraft}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, saveAsDraft: e.target.checked }))
                  }
                  className="w-4 h-4 rounded border-border-strong accent-primary"
                />
                <span className="text-sm text-ink-muted">
                  Guardar como rascunho (não enviar ainda)
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex gap-3 border-t border-border pt-4">
          {step > 1 && (
            <Button
              intent="ghost"
              onClick={() => setStep((s) => Math.max(1, s - 1) as 1 | 2 | 3)}
            >
              ← Voltar
            </Button>
          )}
          <Button intent="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <div className="flex-1" />
          {step < 3 ? (
            <Button
              onClick={() => setStep((s) => Math.min(3, s + 1) as 1 | 2 | 3)}
              disabled={step === 1 && !form.leaveTypeCode}
            >
              Continuar →
            </Button>
          ) : (
            <Button onClick={handleSubmit} loading={loading}>
              {!loading && <Check size={15} strokeWidth={1.75} />}
              {form.saveAsDraft ? 'Guardar Rascunho' : 'Enviar Pedido'}
            </Button>
          )}
        </div>
      </ModalContent>
    </Modal>
  );
}
