'use client';

import { usePartnerDashboard } from '@/hooks/usePartnerDashboard';
import { DashboardView } from '@/components/crm/partners/DashboardView';

export default function PartnersDashboardPage() {
  const props = usePartnerDashboard();
  return <DashboardView {...props} />;
}
