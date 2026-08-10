'use client';

import { useParams, useRouter } from 'next/navigation';
import { useLibraryItem } from '@/hooks/useLibraryItem';
import { LibraryItemView } from '@/components/library/LibraryItemView';
import { DetailSkeleton } from '@/components/library/shared';

export default function LibraryItemPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { item, loading, error, ...rest } = useLibraryItem(id);

  if (loading) return <DetailSkeleton />;

  if (error || !item)
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          {error || 'Recurso não encontrado'}
          <button onClick={() => router.back()} className="ml-4 underline">
            Voltar
          </button>
        </div>
      </div>
    );

  return <LibraryItemView item={item} {...rest} />;
}
