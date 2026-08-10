'use client';

import { useAcademicTranscript } from '@/hooks/useAcademicTranscript';
import { TranscriptView } from '@/components/academic/TranscriptView';
import { DetailSkeleton } from '@/components/academic/shared';

export default function TranscriptPage() {
  const { transcript, enrollments, loading, error, onRetry } =
    useAcademicTranscript();

  if (loading) return <DetailSkeleton />;

  if (error)
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          {error}
          <button onClick={onRetry} className="ml-4 underline">
            Tentar novamente
          </button>
        </div>
      </div>
    );

  return <TranscriptView transcript={transcript} enrollments={enrollments} />;
}
