'use client';

import { useFundersList } from '@/hooks/useFundersList';
import { FundersListView } from '@/components/crm/funders/FundersListView';

export default function FundersPage() {
  const props = useFundersList();
  return <FundersListView {...props} />;
}
