// components/payslips/DetailView.tsx
// Container: usePayslipDetail trata dados/mutações/disputa; a
// apresentação (JSX do recibo) vive em
// components/payslips/PayslipDetailView.tsx. Extraído de
// app/(platform)/payslips/page.tsx.

'use client';

import { usePayslipDetail } from '@/hooks/usePayslipDetail';
import { PayslipDetailView } from './PayslipDetailView';

interface DetailViewProps {
  payslipId: number;
  onBack: () => void;
}

export function DetailView({ payslipId, onBack }: DetailViewProps) {
  const {
    payslip,
    loading,
    error,
    acknowledging,
    acknowledge,
    dispute,
    dispatchDispute,
    submitDispute,
  } = usePayslipDetail(payslipId);

  return (
    <PayslipDetailView
      payslipId={payslipId}
      payslip={payslip}
      loading={loading}
      error={error}
      acknowledging={acknowledging}
      onAcknowledge={acknowledge}
      onBack={onBack}
      dispute={dispute}
      dispatchDispute={dispatchDispute}
      onSubmitDispute={submitDispute}
    />
  );
}
