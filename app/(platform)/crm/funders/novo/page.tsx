'use client';

import { useCreateFunder } from '@/hooks/useCreateFunder';
import { FunderCreateView } from '@/components/crm/funders/FunderCreateView';

export default function NovoFinanciadorPage() {
  const props = useCreateFunder();
  return <FunderCreateView {...props} />;
}
