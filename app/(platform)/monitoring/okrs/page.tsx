'use client';

import { useOkrs } from '@/hooks/useOkrs';
import { OkrsView } from '@/components/monitoring/OkrsView';

export default function OkrsPage() {
  const props = useOkrs();
  return <OkrsView {...props} />;
}
