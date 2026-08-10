'use client';
// src/app/(dashboard)/search/page.tsx

import { useSearch } from '@/hooks/useSearch';
import { SearchView } from '@/components/search/SearchView';

export default function SearchPage() {
  const props = useSearch();
  return <SearchView {...props} />;
}
