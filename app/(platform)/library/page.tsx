'use client';

import { useLibraryList } from '@/hooks/useLibraryList';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { LibraryListView } from '@/components/library/LibraryListView';

export default function LibraryPage() {
  const props = useLibraryList();
  const role = useCurrentRole();
  const canAdd = !!role && role !== 'COLABORADOR';
  return <LibraryListView {...props} canAdd={canAdd} />;
}
