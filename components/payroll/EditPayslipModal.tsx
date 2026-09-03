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
import type { AdminPayslip } from './types';

export interface EditPayslipModalProps {
  payslip: AdminPayslip;
  onClose: () => void;
}

const NUM_FIELDS = [
  ['baseSalary', 'Salário base'],
  ['mealAllowance', 'Subsídio de alimentação'],
  ['vacationAllowance', 'Subsídio de férias'],
  ['christmasAllowance', 'Subsídio de Natal'],
  ['overtime', 'Horas extras'],
  ['bonuses', 'Prémios / Comissões'],
  ['otherAllowances', 'Outros subsídios'],
  ['healthInsurance', 'Seguro de saúde'],
  ['loanDeduction', 'Dedução empréstimo'],
  ['advanceDeduction', 'Adiantamento salarial'],
  ['otherDeductions', 'Outras deduções'],
] as const;

type NumKey = (typeof NUM_FIELDS)[number][0];

export function EditPayslipModal({ payslip, onClose }: EditPayslipModalProps) {
  const notify = useToast();
  const [paymentDate, setPaymentDate] = useState(payslip.paymentDate ?? '');
  const [notes, setNotes] = useState(payslip.notes ?? '');
  const [nums, setNums] = useState<Record<NumKey, string>>(() => {
    const init = {} as Record<NumKey, string>;
    for (const [k] of NUM_FIELDS) init[k] = String((payslip as unknown as Record<string, number>)[k] ?? 0);
    return init;
  });

  const save = useApiMutation(
    (body: Record<string, unknown>) => apiClient.put(`/payslips/${payslip.id}`, body),
    {
      invalidateKeys: [
        queryKeys.payslips.adminDetail(payslip.id),
        [...queryKeys.payslips.all, 'admin-list'],
      ],
      onSuccess: () => {
        notify({ title: 'Recibo actualizado (voltou a Rascunho)', intent: 'success' });
        onClose();
      },
      onError: (e: Error) =>
        notify({
          title:
            (e as { status?: number }).status === 403
              ? 'Recibo não editável no estado actual'
              : e.message,
          intent: 'danger',
        }),
    },
  );

  const handleSubmit = () => {
    if (save.isPending) return;
    const body: Record<string, unknown> = { paymentDate };
    for (const [k] of NUM_FIELDS) body[k] = Number(nums[k] || 0);
    if (notes.trim()) body.notes = notes.trim();
    save.mutate(body);
  };

  return (
    <Modal open onOpenChange={(o) => !o && onClose()}>
      <ModalContent title={`Editar recibo ${payslip.receiptCode ?? payslip.id}`} className="max-w-lg">
        <div className="mt-4 rounded-control bg-warning-subtle p-3 font-body text-xs text-warning-ink">
          Guardar devolve o recibo a Rascunho e recalcula IRT, INSS e líquido a partir dos valores introduzidos.
        </div>

        <div className="mt-4 space-y-4">
          <FormField label="Data de pagamento" htmlFor="epm-pay">
            <Input id="epm-pay" type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className="w-full" />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            {NUM_FIELDS.map(([key, label]) => (
              <FormField key={key} label={label} htmlFor={`epm-${key}`}>
                <Input
                  id={`epm-${key}`}
                  type="number"
                  value={nums[key]}
                  onChange={(e) => setNums((s) => ({ ...s, [key]: e.target.value }))}
                  className="w-full"
                />
              </FormField>
            ))}
          </div>
          <FormField label="Notas internas" htmlFor="epm-notes">
            <Textarea id="epm-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full" />
          </FormField>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button intent="ghost" onClick={onClose} disabled={save.isPending}>Cancelar</Button>
          <Button onClick={handleSubmit} loading={save.isPending}>Guardar</Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
