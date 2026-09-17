'use client';

import { usePartnerReport } from '@/hooks/usePartnerReport';
import { ReportView } from '@/components/crm/partners/ReportView';

export default function PartnerReportPage() {
  const props = usePartnerReport();
  return <ReportView {...props} />;
}
