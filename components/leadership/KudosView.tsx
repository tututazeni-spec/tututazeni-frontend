// components/leadership/KudosView.tsx
// Separador "Kudos" — mural de reconhecimentos públicos. Dados próprios
// + apresentação. Extraído de app/(platform)/leadership/page.tsx.

'use client';

import { Star } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate as fmtDate } from '@/lib/format';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
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
      <div className="mb-5 font-body text-sm text-ink-muted">
        Mural de reconhecimentos públicos da organização
      </div>
      <div className="grid grid-cols-2 gap-4">
        {kudos.map((k) => (
          <div
            key={k.id}
            className="rounded-card border border-warning bg-warning-subtle p-4"
          >
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0">
                {k.badge ?? (
                  <Star size={22} strokeWidth={1.75} className="text-warning" />
                )}
              </span>
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <Avatar
                    name={k.receiver.fullName}
                    url={k.receiver.avatarUrl ?? undefined}
                    size="sm"
                  />
                  <div>
                    <div className="font-body text-xs font-semibold text-warning-ink">
                      {k.receiver.fullName}
                    </div>
                    <div className="font-body text-xs text-warning-ink/70">
                      de {k.sender.fullName}
                    </div>
                  </div>
                  <span className="ml-auto font-body text-xs text-warning-ink/60">
                    {fmtDate(k.createdAt)}
                  </span>
                </div>
                <p className="font-body text-sm text-warning-ink">
                  {k.message}
                </p>
              </div>
            </div>
          </div>
        ))}
        {kudos.length === 0 && (
          <div className="col-span-2 rounded-card border border-dashed border-border-strong py-12 text-center font-body text-sm text-ink-faint">
            Sem reconhecimentos ainda — sê o primeiro!
          </div>
        )}
      </div>
    </div>
  );
}
