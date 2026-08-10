'use client';

import { useParams, useRouter } from 'next/navigation';
import { useBeneficiaryDetail } from '@/hooks/useBeneficiaryDetail';
import { BeneficiaryDetailView } from '@/components/crm/beneficiaries/BeneficiaryDetailView';
import { DetailSkeleton } from '@/components/crm/shared';

export default function BeneficiaryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { beneficiary, isLoading, isError, errorMessage, ...rest } =
    useBeneficiaryDetail(id);

  if (isLoading) return <DetailSkeleton />;

  if (isError || !beneficiary)
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          {errorMessage}
          <button onClick={() => router.back()} className="ml-4 underline">
            Voltar
          </button>
        </div>
      </div>
    );

  return <BeneficiaryDetailView beneficiary={beneficiary} {...rest} />;
}
