'use client';

import { useLibraryList } from '@/hooks/useLibraryList';
import { LibraryListView } from '@/components/library/LibraryListView';

export default function LibraryPage() {
  const props = useLibraryList();
  return <LibraryListView {...props} />;
}
