'use client';

import { useState } from 'react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { useToast } from '@/providers/ToastProvider';
import type { RunPayslip } from './types';

export interface RecalcPayslipModalProps {
  runId: number;
  payslip: RunPayslip;
  onClose: () => void;
}

const toInputValue = (n: number | null | undefined) =>
  n == null ? '' : String(n);

export function RecalcPayslipModal({
  runId,
  payslip,
  onClose,
}: RecalcPayslipModalProps) {
  const notify = useToast();
  const [absenceDays, setAbsenceDays] = useState(
    toInputValue(payslip.calcInputs?.absenceDays),
  );
  const [overtimeHours, setOvertimeHours] = useState(
    toInputValue(payslip.calcInputs?.overtimeHours),
  );
  const [bonusAmount, setBonusAmount] = useState(
    toInputValue(payslip.calcInputs?.bonusAmount),
  );
  const [advanceDeduction, setAdvanceDeduction] = useState(
    toInputValue(payslip.calcInputs?.advanceDeduction),
  );

  const recalc = useApiMutation(
    (body: Record<string, number>) =>
      apiClient.patch(
        `/payroll/runs/${runId}/payslips/${payslip.id}/recalc`,
        body,
      ),
    {
      invalidateKeys: [
        queryKeys.payroll.runDetail(runId),
        queryKeys.payroll.runPayslipsAll(runId),
        queryKeys.payroll.runExceptions(runId),
      ],
      onSuccess: () => {
        notify({ title: 'Recibo recalculado', intent: 'success' });
        onClose();
      },
    },
  );

  const handleSubmit = () => {
    const body: Record<string, number> = {};
    if (absenceDays.trim() !== '') body.absenceDays = Number(absenceDays);
    if (overtimeHours.trim() !== '') body.overtimeHours = Number(overtimeHours);
    if (bonusAmount.trim() !== '') body.bonusAmount = Number(bonusAmount);
    if (advanceDeduction.trim() !== '')
      body.advanceDeduction = Number(advanceDeduction);
    recalc.mutate(body);
  };

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title={`Recalcular — ${payslip.user.fullName}`}
        className="max-w-md"
      >
        <div className="mt-5 grid grid-cols-2 gap-3">
          <FormField label="Dias de falta" htmlFor="rpm-absence">
            <Input
              id="rpm-absence"
              type="number"
              step="any"
              value={absenceDays}
              onChange={(e) => setAbsenceDays(e.target.value)}
              className="w-full"
            />
          </FormField>
          <FormField label="Horas extra" htmlFor="rpm-overtime">
            <Input
              id="rpm-overtime"
              type="number"
              step="any"
              value={overtimeHours}
              onChange={(e) => setOvertimeHours(e.target.value)}
              className="w-full"
            />
          </FormField>
          <FormField label="Bónus (Kz)" htmlFor="rpm-bonus">
            <Input
              id="rpm-bonus"
              type="number"
              step="any"
              value={bonusAmount}
              onChange={(e) => setBonusAmount(e.target.value)}
              className="w-full"
            />
          </FormField>
          <FormField label="Adiantamento (Kz)" htmlFor="rpm-advance">
            <Input
              id="rpm-advance"
              type="number"
              step="any"
              value={advanceDeduction}
              onChange={(e) => setAdvanceDeduction(e.target.value)}
              className="w-full"
            />
          </FormField>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button intent="ghost" onClick={onClose} disabled={recalc.isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} loading={recalc.isPending}>
            Recalcular
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
