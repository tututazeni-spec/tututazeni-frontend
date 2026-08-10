'use client';

import { useFunderOverdueReports } from '@/hooks/useFunderOverdueReports';
import { OverdueReportsView } from '@/components/crm/funders/OverdueReportsView';

export default function OverdueReportsPage() {
  const props = useFunderOverdueReports();
  return <OverdueReportsView {...props} />;
}
