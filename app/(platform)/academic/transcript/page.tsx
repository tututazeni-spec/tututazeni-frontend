'use client';

import { AlertCircle } from 'lucide-react';
import { useAcademicTranscript } from '@/hooks/useAcademicTranscript';
import { TranscriptView } from '@/components/academic/TranscriptView';
import { DetailSkeleton } from '@/components/academic/shared';
import { EmptyState } from '@/components/ui/EmptyState';

export default function TranscriptPage() {
  const { transcript, enrollments, loading, error, onRetry } =
    useAcademicTranscript();

  if (loading) return <DetailSkeleton />;

  if (error)
    return (
      <div className="p-6">
        <EmptyState
          icon={AlertCircle}
          title="Erro ao carregar a transcrição"
          description={error}
          action={{ label: 'Tentar novamente', onClick: onRetry }}
        />
      </div>
    );

  return <TranscriptView transcript={transcript} enrollments={enrollments} />;
}
