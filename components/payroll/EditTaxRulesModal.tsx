// components/payroll/EditTaxRulesModal.tsx
// Editar as regras fiscais do ano (INSS + escalões IRT) — PUT /payroll/taxes.
// Percentagens são digitadas em % e enviadas como fracção.
'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { useToast } from '@/providers/ToastProvider';
import type { TaxConfig } from './insightTypes';

interface BracketForm {
  min: string;
  max: string; // vazio = sem limite
  rate: string; // em %
  deduction: string;
}

const num = (s: string) => Number(s.replace(',', '.'));
const fromPct = (r: number) => String(+(r * 100).toFixed(4));

export interface EditTaxRulesModalProps {
  config: TaxConfig;
  onClose: () => void;
}

export function EditTaxRulesModal({ config, onClose }: EditTaxRulesModalProps) {
  const notify = useToast();
  const [employeeRate, setEmployeeRate] = useState(
    fromPct(config.socialSecurity.employeeRate),
  );
  const [employerRate, setEmployerRate] = useState(
    fromPct(config.socialSecurity.employerRate),
  );
  const [ceiling, setCeiling] = useState(
    config.socialSecurity.ceiling != null
      ? String(config.socialSecurity.ceiling)
      : '',
  );
  const [minimumWage, setMinimumWage] = useState(String(config.minimumWage));
  const [brackets, setBrackets] = useState<BracketForm[]>(
    config.irtBrackets.map((b) => ({
      min: String(b.min),
      max: b.max == null ? '' : String(b.max),
      rate: fromPct(b.rate),
      deduction: b.deduction == null ? '' : String(b.deduction),
    })),
  );

  const setBracket = (i: number, patch: Partial<BracketForm>) =>
    setBrackets((prev) =>
      prev.map((b, j) => (j === i ? { ...b, ...patch } : b)),
    );

  const numbersOk =
    [employeeRate, employerRate, minimumWage].every(
      (s) => s.trim() !== '' && num(s) >= 0,
    ) &&
    brackets.every(
      (b) =>
        b.min.trim() !== '' &&
        num(b.min) >= 0 &&
        b.rate.trim() !== '' &&
        num(b.rate) >= 0,
    );
  // Só o último escalão pode ficar sem limite superior.
  const openEndedOk = brackets.every(
    (b, i) => b.max.trim() !== '' || i === brackets.length - 1,
  );
  const valid = numbersOk && openEndedOk && brackets.length > 0;

  const save = useApiMutation(
    (body: Record<string, unknown>) => apiClient.put('/payroll/taxes', body),
    {
      invalidateKeys: [queryKeys.payroll.all],
      onSuccess: () => {
        notify({ title: 'Regras fiscais actualizadas', intent: 'success' });
        onClose();
      },
    },
  );

  const submit = () => {
    if (!valid || save.isPending) return;
    save.mutate({
      taxYear: config.taxYear,
      countryCode: config.countryCode,
      minimumWage: num(minimumWage),
      socialSecurity: {
        employeeRate: num(employeeRate) / 100,
        employerRate: num(employerRate) / 100,
        ceiling: ceiling.trim() === '' ? null : num(ceiling),
      },
      irtBrackets: brackets.map((b) => ({
        min: num(b.min),
        max: b.max.trim() === '' ? null : num(b.max),
        rate: num(b.rate) / 100,
        deduction: b.deduction.trim() === '' ? null : num(b.deduction),
      })),
    });
  };

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title={`Editar regras fiscais ${config.taxYear} (${config.countryCode})`}
        className="max-w-2xl"
      >
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="INSS trabalhador (%)" htmlFor="tax-emp">
            <Input
              id="tax-emp"
              type="number"
              min={0}
              step="any"
              value={employeeRate}
              onChange={(e) => setEmployeeRate(e.target.value)}
              className="w-full"
            />
          </FormField>
          <FormField label="INSS patronal (%)" htmlFor="tax-er">
            <Input
              id="tax-er"
              type="number"
              min={0}
              step="any"
              value={employerRate}
              onChange={(e) => setEmployerRate(e.target.value)}
              className="w-full"
            />
          </FormField>
          <FormField
            label="Tecto INSS (AOA)"
            htmlFor="tax-ceil"
            hint="Vazio = sem tecto"
          >
            <Input
              id="tax-ceil"
              type="number"
              min={0}
              step="any"
              value={ceiling}
              onChange={(e) => setCeiling(e.target.value)}
              className="w-full"
            />
          </FormField>
          <FormField label="Salário mínimo (AOA)" htmlFor="tax-min">
            <Input
              id="tax-min"
              type="number"
              min={0}
              step="any"
              value={minimumWage}
              onChange={(e) => setMinimumWage(e.target.value)}
              className="w-full"
            />
          </FormField>
        </div>

        <h4 className="mb-2 mt-6 font-body text-sm font-semibold text-ink">
          Escalões
        </h4>
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_1fr_80px_1fr_32px] gap-2 font-body text-xs font-bold uppercase tracking-wide text-ink-muted">
            <span>De</span>
            <span>Até</span>
            <span>Taxa %</span>
            <span>Parcela a abater</span>
            <span />
          </div>
          {brackets.map((b, i) => (
            <div
              key={i}
              className="grid grid-cols-[1fr_1fr_80px_1fr_32px] items-center gap-2"
            >
              <Input
                type="number"
                min={0}
                step="any"
                aria-label={`Escalão ${i + 1}: de`}
                value={b.min}
                onChange={(e) => setBracket(i, { min: e.target.value })}
              />
              <Input
                type="number"
                min={0}
                step="any"
                placeholder="∞"
                aria-label={`Escalão ${i + 1}: até`}
                value={b.max}
                onChange={(e) => setBracket(i, { max: e.target.value })}
              />
              <Input
                type="number"
                min={0}
                step="any"
                aria-label={`Escalão ${i + 1}: taxa`}
                value={b.rate}
                onChange={(e) => setBracket(i, { rate: e.target.value })}
              />
              <Input
                type="number"
                min={0}
                step="any"
                placeholder="—"
                aria-label={`Escalão ${i + 1}: parcela a abater`}
                value={b.deduction}
                onChange={(e) => setBracket(i, { deduction: e.target.value })}
              />
              <button
                type="button"
                aria-label={`Remover escalão ${i + 1}`}
                onClick={() =>
                  setBrackets((prev) => prev.filter((_, j) => j !== i))
                }
                className="rounded-control p-1 text-ink-muted hover:text-danger"
              >
                <Trash2 size={16} strokeWidth={1.75} />
              </button>
            </div>
          ))}
        </div>
        <Button
          intent="ghost"
          size="sm"
          className="mt-2"
          onClick={() =>
            setBrackets((prev) => [
              ...prev,
              { min: '', max: '', rate: '', deduction: '' },
            ])
          }
        >
          <Plus size={14} strokeWidth={1.75} /> Adicionar escalão
        </Button>
        {!openEndedOk && (
          <p className="mt-2 font-body text-xs text-danger">
            Só o último escalão pode ficar sem limite superior.
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <Button intent="ghost" onClick={onClose} disabled={save.isPending}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={!valid} loading={save.isPending}>
            Guardar regras
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
