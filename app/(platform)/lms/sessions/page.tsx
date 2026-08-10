'use client';

import { useLiveSessionsLms } from '@/hooks/useLiveSessionsLms';
import { LiveSessionsView } from '@/components/lms/LiveSessionsView';

export default function LiveSessionsPage() {
  const props = useLiveSessionsLms();
  return <LiveSessionsView {...props} />;
}
