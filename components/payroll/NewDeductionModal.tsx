// components/payroll/NewDeductionModal.tsx
// Nova dedução/imposto (ADMIN e RH). Nasce em rascunho; só aparece em
// "Por tipo de dedução" depois de publicada.
'use client';

import { useState } from 'react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/providers/ToastProvider';

const METHOD_ITEMS = [
  { value: 'PERCENT', label: 'Percentagem do salário bruto' },
  { value: 'FIXED', label: 'Montante fixo (AOA)' },
];

export interface NewDeductionModalProps {
  onClose: () => void;
}

export function NewDeductionModal({ onClose }: NewDeductionModalProps) {
  const notify = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [method, setMethod] = useState<'PERCENT' | 'FIXED'>('PERCENT');
  const [value, setValue] = useState('');
  const [mandatory, setMandatory] = useState(false);

  const amount = Number(value.replace(',', '.'));
  const valid =
    name.trim().length >= 2 &&
    value.trim() !== '' &&
    Number.isFinite(amount) &&
    amount >= 0 &&
    (method === 'FIXED' || amount <= 100);

  const create = useApiMutation(
    (body: Record<string, unknown>) =>
      apiClient.post('/payroll/deduction-types', body),
    {
      invalidateKeys: [queryKeys.payroll.all],
      onSuccess: () => {
        notify({
          title: 'Dedução criada em rascunho',
          description: 'Publique-a para aparecer em "Por tipo de dedução".',
          intent: 'success',
        });
        onClose();
      },
    },
  );

  const submit = () => {
    if (!valid || create.isPending) return;
    create.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      calcMethod: method,
      // Percentagem digitada em %, guardada como fracção (3 → 0.03).
      value: method === 'PERCENT' ? amount / 100 : amount,
      mandatory,
    });
  };

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent title="Nova dedução ou imposto" className="max-w-lg">
        <div className="mt-5 space-y-4">
          <FormField label="Nome *" htmlFor="ded-name">
            <Input
              id="ded-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Seguro de vida"
              className="w-full"
            />
          </FormField>
          <FormField label="Descrição" htmlFor="ded-desc">
            <Textarea
              id="ded-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full"
            />
          </FormField>
          <FormField label="Tipo de cálculo *" htmlFor="ded-method">
            <Select
              items={METHOD_ITEMS}
              value={method}
              onValueChange={(v) => setMethod(v as 'PERCENT' | 'FIXED')}
              className="w-full"
            />
          </FormField>
          <FormField
            label={method === 'PERCENT' ? 'Taxa (%) *' : 'Montante (AOA) *'}
            htmlFor="ded-value"
          >
            <Input
              id="ded-value"
              type="number"
              min={0}
              max={method === 'PERCENT' ? 100 : undefined}
              step="any"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full"
            />
          </FormField>
          <label className="flex cursor-pointer items-center gap-2">
            <Checkbox
              checked={mandatory}
              onChange={(e) => setMandatory(e.target.checked)}
            />
            <span className="font-body text-sm text-ink">Obrigatória</span>
          </label>
          <p className="font-body text-xs text-ink-muted">
            Fica em rascunho até ser publicada.
          </p>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button intent="ghost" onClick={onClose} disabled={create.isPending}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={!valid} loading={create.isPending}>
            Guardar rascunho
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
