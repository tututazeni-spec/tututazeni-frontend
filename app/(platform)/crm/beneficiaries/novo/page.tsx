'use client';

import { useCreateBeneficiary } from '@/hooks/useCreateBeneficiary';
import { BeneficiaryCreateView } from '@/components/crm/beneficiaries/BeneficiaryCreateView';

export default function NovoBeneficiarioPage() {
  const props = useCreateBeneficiary();
  return <BeneficiaryCreateView {...props} />;
}
