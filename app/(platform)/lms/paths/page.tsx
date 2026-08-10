'use client';

import { useLearningPathsLms } from '@/hooks/useLearningPathsLms';
import { LearningPathsView } from '@/components/lms/LearningPathsView';

export default function LearningPathsPage() {
  const props = useLearningPathsLms();
  return <LearningPathsView {...props} />;
}
