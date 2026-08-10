'use client';

import { useCreateLibraryItem } from '@/hooks/useCreateLibraryItem';
import { LibraryCreateView } from '@/components/library/LibraryCreateView';

export default function NovoRecursoPage() {
  const props = useCreateLibraryItem();
  return <LibraryCreateView {...props} />;
}
