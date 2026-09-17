'use client';

import { usePartnerExpiringContracts } from '@/hooks/usePartnerExpiringContracts';
import { ExpiringContractsView } from '@/components/crm/partners/ExpiringContractsView';

export default function PartnerExpiringContractsPage() {
  const props = usePartnerExpiringContracts();
  return <ExpiringContractsView {...props} />;
}
