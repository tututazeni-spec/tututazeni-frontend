'use client';

import { useParams, useRouter } from 'next/navigation';
import { useLibraryItem } from '@/hooks/useLibraryItem';
import { Button } from '@/components/ui/Button';
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
        <div className="flex items-center justify-between rounded-card border border-danger bg-danger-subtle p-4 font-body text-sm text-danger-ink">
          {error || 'Recurso não encontrado'}
          <Button intent="secondary" size="sm" onClick={() => router.back()}>
            Voltar
          </Button>
        </div>
      </div>
    );

  return <LibraryItemView item={item} {...rest} />;
}
