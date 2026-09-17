'use client';

import { useBeneficiaryDashboard } from '@/hooks/useBeneficiaryDashboard';
import { DashboardView } from '@/components/crm/beneficiaries/DashboardView';

export default function BeneficiariesDashboardPage() {
  const props = useBeneficiaryDashboard();
  return <DashboardView {...props} />;
}
