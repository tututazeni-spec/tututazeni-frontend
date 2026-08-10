'use client';

import { useParams, useRouter } from 'next/navigation';
import { usePartnerDetail } from '@/hooks/usePartnerDetail';
import { PartnerDetailView } from '@/components/crm/partners/PartnerDetailView';
import { DetailSkeleton } from '@/components/crm/shared';

export default function PartnerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { partner, loading, error, ...rest } = usePartnerDetail(id);

  if (loading) return <DetailSkeleton />;

  if (error || !partner)
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          {error || 'Parceiro não encontrado'}
          <button onClick={() => router.back()} className="ml-4 underline">
            Voltar
          </button>
        </div>
      </div>
    );

  return <PartnerDetailView partner={partner} {...rest} />;
}
