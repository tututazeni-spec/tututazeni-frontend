'use client';

import { useBeneficiaryFollowUps } from '@/hooks/useBeneficiaryFollowUps';
import { FollowUpsView } from '@/components/crm/beneficiaries/FollowUpsView';

export default function BeneficiaryFollowUpsPage() {
  const props = useBeneficiaryFollowUps();
  return <FollowUpsView {...props} />;
}
