'use client';

import { useBeneficiaryReport } from '@/hooks/useBeneficiaryReport';
import { ReportView } from '@/components/crm/beneficiaries/ReportView';

export default function BeneficiaryReportPage() {
  const props = useBeneficiaryReport();
  return <ReportView {...props} />;
}
