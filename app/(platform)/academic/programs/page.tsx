'use client';

import { useAcademicPrograms } from '@/hooks/useAcademicPrograms';
import { ProgramsListView } from '@/components/academic/ProgramsListView';

export default function AcademicProgramsPage() {
  const props = useAcademicPrograms();
  return <ProgramsListView {...props} />;
}
