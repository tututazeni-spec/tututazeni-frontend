'use client';

import { useBeneficiariesList } from '@/hooks/useBeneficiariesList';
import { BeneficiariesListView } from '@/components/crm/beneficiaries/BeneficiariesListView';

export default function BeneficiariesPage() {
  const props = useBeneficiariesList();
  return <BeneficiariesListView {...props} />;
}
