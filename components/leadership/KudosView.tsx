// components/leadership/KudosView.tsx
// Separador "Kudos" — mural de reconhecimentos públicos. Dados próprios
// + apresentação. Extraído de app/(platform)/leadership/page.tsx.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate as fmtDate } from '@/lib/format';
import { Avatar, Skeleton } from './atoms';
import type { KudosItem } from './types';

export function KudosView() {
  const { data: kudos = [], isLoading } = useApiQuery<KudosItem[]>(
    queryKeys.leadership.kudos(),
    '/leadership/kudos',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (isLoading) return <Skeleton />;

  return (
    <div>
      <div className="text-sm text-gray-500 mb-5">
        Mural de reconhecimentos públicos da organização
      </div>
      <div className="grid grid-cols-2 gap-4">
        {kudos.map((k) => (
          <div
            key={k.id}
            className="bg-amber-50 border border-amber-200 rounded-xl p-4"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">{k.badge ?? '⭐'}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar
                    name={k.receiver.fullName}
                    avatarUrl={k.receiver.avatarUrl}
                    size="sm"
                  />
                  <div>
                    <div className="text-xs font-semibold text-amber-900">
                      {k.receiver.fullName}
                    </div>
                    <div className="text-xs text-amber-600">
                      de {k.sender.fullName}
                    </div>
                  </div>
                  <span className="text-xs text-amber-400 ml-auto">
                    {fmtDate(k.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-amber-800">{k.message}</p>
              </div>
            </div>
          </div>
        ))}
        {kudos.length === 0 && (
          <div className="col-span-2 py-12 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
            Sem reconhecimentos ainda — sê o primeiro!
          </div>
        )}
      </div>
    </div>
  );
}
