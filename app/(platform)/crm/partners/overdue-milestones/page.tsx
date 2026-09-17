'use client';

import { usePartnerOverdueMilestones } from '@/hooks/usePartnerOverdueMilestones';
import { OverdueMilestonesView } from '@/components/crm/partners/OverdueMilestonesView';

export default function PartnerOverdueMilestonesPage() {
  const props = usePartnerOverdueMilestones();
  return <OverdueMilestonesView {...props} />;
}
