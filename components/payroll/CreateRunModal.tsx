// components/payroll/CreateRunModal.tsx
// Criar um PayrollRun novo (DRAFT). Só os campos com UI nesta entrega:
// period/payGroup/countryCode/notes — departmentIds/userIds ficam fora de
// âmbito (spec, decisão #2). onCreated navega logo para o detalhe do run.
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
import { useToast } from '@/providers/ToastProvider';
import type { PayrollRun } from './types';

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
    });
  };

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent title="Novo run" className="max-w-md">
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
          <FormField label="Notas" htmlFor="crm-notes">
            <Textarea
              id="crm-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full"
            />
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
