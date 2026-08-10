'use client';

import { useParams, useRouter } from 'next/navigation';
import { useAcademicProgramDetail } from '@/hooks/useAcademicProgramDetail';
import { ProgramDetailView } from '@/components/academic/ProgramDetailView';
import { DetailSkeleton } from '@/components/academic/shared';

export default function ProgramDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { program, loading, error, ...rest } = useAcademicProgramDetail(id);

  if (loading) return <DetailSkeleton />;

  if (error || !program)
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          {error || 'Programa não encontrado'}
          <button onClick={() => router.back()} className="ml-4 underline">
            Voltar
          </button>
        </div>
      </div>
    );

  return <ProgramDetailView program={program} {...rest} />;
}
