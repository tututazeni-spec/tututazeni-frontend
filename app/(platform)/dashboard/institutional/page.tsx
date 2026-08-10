'use client';

import { useInstitutionalDashboard } from '@/hooks/useInstitutionalDashboard';
import { InstitutionalDashboardView } from '@/components/dashboard-institutional/InstitutionalDashboardView';

export default function InstitutionalDashboardPage() {
  const props = useInstitutionalDashboard();
  return <InstitutionalDashboardView {...props} />;
}
