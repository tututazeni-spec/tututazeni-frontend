'use client';

import { useFunderReport } from '@/hooks/useFunderReport';
import { ReportView } from '@/components/crm/funders/ReportView';

export default function FunderReportPage() {
  const props = useFunderReport();
  return <ReportView {...props} />;
}
