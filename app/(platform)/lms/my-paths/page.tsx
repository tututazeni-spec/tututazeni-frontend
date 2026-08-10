'use client';

import { useMyPathsLms } from '@/hooks/useMyPathsLms';
import { MyPathsView } from '@/components/lms/MyPathsView';

export default function MyPathsPage() {
  const props = useMyPathsLms();
  return <MyPathsView {...props} />;
}
