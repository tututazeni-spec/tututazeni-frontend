'use client';

import { useParams, useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { useAcademicProgramDetail } from '@/hooks/useAcademicProgramDetail';
import { ProgramDetailView } from '@/components/academic/ProgramDetailView';
import { DetailSkeleton } from '@/components/academic/shared';
import { EmptyState } from '@/components/ui/EmptyState';

export default function ProgramDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { program, loading, error, ...rest } = useAcademicProgramDetail(id);

  if (loading) return <DetailSkeleton />;

  if (error || !program)
    return (
      <div className="p-6">
        <EmptyState
          icon={AlertCircle}
          title="Erro ao carregar o programa"
          description={error || 'Programa não encontrado'}
          action={{ label: 'Voltar', onClick: () => router.back() }}
        />
      </div>
    );

  return <ProgramDetailView program={program} {...rest} />;
}
