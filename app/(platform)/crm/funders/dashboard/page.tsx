'use client';

import { useFunderDashboard } from '@/hooks/useFunderDashboard';
import { DashboardView } from '@/components/crm/funders/DashboardView';

export default function FundersDashboardPage() {
  const props = useFunderDashboard();
  return <DashboardView {...props} />;
}
