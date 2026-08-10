'use client';

import { useParams, useRouter } from 'next/navigation';
import { useFunderDetail } from '@/hooks/useFunderDetail';
import { FunderDetailView } from '@/components/crm/funders/FunderDetailView';
import { DetailSkeleton } from '@/components/crm/shared';

export default function FunderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { funder, loading, error, ...rest } = useFunderDetail(id);

  if (loading) return <DetailSkeleton />;

  if (error || !funder)
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          {error || 'Financiador não encontrado'}
          <button onClick={() => router.back()} className="ml-4 underline">
            Voltar
          </button>
        </div>
      </div>
    );

  return <FunderDetailView funder={funder} {...rest} />;
}
