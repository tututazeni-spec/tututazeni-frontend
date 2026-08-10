'use client';

import { usePartnersList } from '@/hooks/usePartnersList';
import { PartnersListView } from '@/components/crm/partners/PartnersListView';

export default function PartnersPage() {
  const props = usePartnersList();
  return <PartnersListView {...props} />;
}
