'use client';

import { useCreatePartner } from '@/hooks/useCreatePartner';
import { PartnerCreateView } from '@/components/crm/partners/PartnerCreateView';

export default function NovoParceiroPage() {
  const props = useCreatePartner();
  return <PartnerCreateView {...props} />;
}
