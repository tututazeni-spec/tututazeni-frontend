// components/payroll/CreateRunModal.tsx
// Criar um PayrollRun novo (DRAFT). Campos: period/payGroup/countryCode/notes
// + âmbito opcional por departamento (departmentIds). Sem selector de âmbito
// escolhido, o run abrange todos os colaboradores activos (comportamento do
// backend resolveTargetUsers). Selecção por utilizador (userIds) continua
// disponível na API mas sem UI aqui. onCreated navega logo para o detalhe.
'use client';

import { useState } from 'react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/providers/ToastProvider';
import { useDepartmentOptions } from './runData';
import type { PayrollRun } from './types';

const OPTION_FIELDS = [
  ['includeNewEmployees', 'Incluir novos colaboradores'],
  ['includeAbsences', 'Incluir ausências'],
  ['includeOvertime', 'Incluir horas extra'],
  ['includeSubsidies', 'Incluir subsídios'],
  ['includePrizes', 'Incluir prémios'],
  ['includeBonuses', 'Incluir bónus'],
  ['applyDeductions', 'Aplicar deduções'],
  ['calculateInss', 'Calcular INSS'],
  ['calculateIrt', 'Calcular IRT'],
  ['applyFaults', 'Aplicar faltas'],
  ['applyDiscounts', 'Aplicar descontos'],
] as const;

type OptionKey = (typeof OPTION_FIELDS)[number][0];
type RunOptions = Record<OptionKey, boolean>;

const DEFAULT_OPTIONS = Object.fromEntries(
  OPTION_FIELDS.map(([k]) => [k, true]),
) as RunOptions;

export interface CreateRunModalProps {
  onClose: () => void;
  onCreated: (runId: number) => void;
}

export function CreateRunModal({ onClose, onCreated }: CreateRunModalProps) {
  const notify = useToast();
  const [period, setPeriod] = useState('');
  const [payGroup, setPayGroup] = useState('');
  const [countryCode, setCountryCode] = useState('AO');
  const [notes, setNotes] = useState('');
  const [expectedPaymentDate, setExpectedPaymentDate] = useState('');
  const [options, setOptions] = useState<RunOptions>(DEFAULT_OPTIONS);
  const [depIds, setDepIds] = useState<Set<number>>(new Set());
  const { options: depOptions, loading: depLoading } = useDepartmentOptions();

  const toggleDep = (id: number) =>
    setDepIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const create = useApiMutation(
    (body: Record<string, unknown>) =>
      apiClient.post<PayrollRun>('/payroll/runs', body),
    {
      invalidateKeys: [queryKeys.payroll.all],
      onSuccess: (run) => {
        notify({ title: 'Run criado', intent: 'success' });
        onCreated(run.id);
      },
    },
  );

  const valid = period.trim().length > 0;

  const handleSubmit = () => {
    if (!valid || create.isPending) return;
    create.mutate({
      period: period.trim(),
      payGroup: payGroup.trim() || undefined,
      countryCode: countryCode.trim() || undefined,
      notes: notes.trim() || undefined,
      expectedPaymentDate: expectedPaymentDate || undefined,
      // Só envia opções quando alguma foi desligada (omitido = tudo incluído).
      options: OPTION_FIELDS.some(([k]) => !options[k]) ? options : undefined,
      departmentIds: depIds.size ? [...depIds] : undefined,
    });
  };

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent title="Novo run" className="max-w-lg">
        <div className="mt-5 space-y-4">
          <FormField
            label="Período *"
            htmlFor="crm-period"
            hint="Formato AAAA-MM"
          >
            <Input
              id="crm-period"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              placeholder="2026-09"
              className="w-full"
            />
          </FormField>
          <FormField label="Grupo" htmlFor="crm-paygroup">
            <Input
              id="crm-paygroup"
              value={payGroup}
              onChange={(e) => setPayGroup(e.target.value)}
              placeholder="Mensais"
              className="w-full"
            />
          </FormField>
          <FormField label="País" htmlFor="crm-country">
            <Input
              id="crm-country"
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
              className="w-full"
            />
          </FormField>
          <FormField label="Data prevista de pagamento" htmlFor="crm-paydate">
            <Input
              id="crm-paydate"
              type="date"
              value={expectedPaymentDate}
              onChange={(e) => setExpectedPaymentDate(e.target.value)}
              className="w-full"
            />
          </FormField>
          <FormField
            label="Opções de cálculo"
            htmlFor="crm-options"
            hint="Tudo activo por omissão; desmarque o que não deve entrar neste processamento."
          >
            <div
              id="crm-options"
              className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2"
            >
              {OPTION_FIELDS.map(([key, label]) => (
                <label
                  key={key}
                  className="flex cursor-pointer items-center gap-2 py-1"
                >
                  <input
                    type="checkbox"
                    checked={options[key]}
                    onChange={(e) =>
                      setOptions((prev) => ({
                        ...prev,
                        [key]: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-border-strong accent-primary"
                  />
                  <span className="font-body text-sm text-ink">{label}</span>
                </label>
              ))}
            </div>
          </FormField>
          <FormField label="Notas" htmlFor="crm-notes">
            <Textarea
              id="crm-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full"
            />
          </FormField>
          <FormField
            label="Âmbito"
            htmlFor="crm-scope"
            hint="Sem departamentos escolhidos, o run abrange todos os colaboradores activos."
          >
            <div
              id="crm-scope"
              className="max-h-40 overflow-y-auto rounded-card border border-border"
            >
              {depLoading ? (
                <div className="p-3">
                  <Skeleton
                    rows={3}
                    wrapperClassName="space-y-2 animate-pulse"
                    itemClassName="h-8 rounded-card bg-surface-sunken"
                  />
                </div>
              ) : depOptions.length === 0 ? (
                <div className="px-3 py-6 text-center font-body text-sm text-ink-faint">
                  Sem departamentos.
                </div>
              ) : (
                depOptions.map((d) => (
                  <label
                    key={d.value}
                    className="flex cursor-pointer items-center gap-3 border-b border-border px-3 py-2 last:border-0 hover:bg-surface-sunken"
                  >
                    <input
                      type="checkbox"
                      checked={depIds.has(d.value)}
                      onChange={() => toggleDep(d.value)}
                      className="h-4 w-4 rounded border-border-strong accent-primary"
                    />
                    <span className="font-body text-sm text-ink">
                      {d.label}
                    </span>
                  </label>
                ))
              )}
            </div>
          </FormField>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button intent="ghost" onClick={onClose} disabled={create.isPending}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!valid}
            loading={create.isPending}
          >
            Criar
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
