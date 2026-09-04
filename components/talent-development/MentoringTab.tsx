// components/talent-development/MentoringTab.tsx
// Separador "Mentoria" — grelha de pares mentor/mentee filtrável por
// estado. Dados próprios (useApiQuery) + apresentação. Extraído de
// app/(platform)/talent-development/page.tsx.
//
// MENTOR/MENTEE: par de etiquetas de papel (não estado, não série de
// dados) — mapeadas para as duas cores de marca da fundação (primary/
// accent) só para distinguir visualmente os dois lados do par.

'use client';

import { useState } from 'react';
import { Activity, ChevronRight, Clock } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { STATUS_CFG, STATUS_LABEL } from './constants';
import type { ListMeta, MentoringPair } from './types';

const STATUS_FILTERS = ['ACTIVE', 'COMPLETED', 'PAUSED'] as const;

export function MentoringTab() {
  const [status, setStatus] = useState<string>('ACTIVE');

  const params = { status, limit: 30 };
  const { data, isLoading } = useApiQuery<{
    data: MentoringPair[];
    meta: ListMeta;
  }>(queryKeys.talentDevelopment.mentoring(status), '/talent/mentoring', {
    params,
    staleTime: STALE_TIME.SEMI_STATIC,
  });

  if (isLoading)
    return (
      <Skeleton
        rows={3}
        wrapperClassName="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
        itemClassName="skeleton-shimmer h-40 rounded-card"
      />
    );

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-2">
        {STATUS_FILTERS.map((s) => (
          <Button
            key={s}
            size="sm"
            intent={status === s ? 'primary' : 'secondary'}
            onClick={() => setStatus(s)}
          >
            {STATUS_LABEL[s] ?? s}
          </Button>
        ))}
        <span className="ml-auto font-body text-xs text-ink-faint">
          {data?.meta.total ?? 0} mentorias
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data?.data.map((m) => (
          <Card key={m.id}>
            <CardBody>
              <div className="mb-3 flex items-center justify-between">
                <StatusBadge value={m.status} map={STATUS_CFG} />
                {m.reverseMentoring && <Badge intent="info">Reversa</Badge>}
              </div>

              {/* Pair */}
              <div className="mb-3 flex items-center gap-2">
                <div className="flex flex-col items-center gap-1">
                  <Avatar
                    name={m.mentor.fullName}
                    url={m.mentor.avatarUrl}
                    size="md"
                  />
                  <span className="font-body text-[9px] font-semibold text-primary">
                    MENTOR
                  </span>
                </div>
                <div className="flex flex-1 flex-col items-center">
                  <ChevronRight
                    size={16}
                    strokeWidth={1.75}
                    className="text-ink-faint"
                  />
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Avatar
                    name={m.mentee.fullName}
                    url={m.mentee.avatarUrl}
                    size="md"
                  />
                  <span className="font-body text-[9px] font-semibold text-accent">
                    MENTEE
                  </span>
                </div>
              </div>

              <p className="mb-1 truncate font-body text-sm font-semibold text-ink">
                {m.mentor.fullName}
              </p>
              <p className="mb-2 font-body text-xs text-ink-muted">
                → {m.mentee.fullName}
              </p>

              {m.objective && (
                <p className="mb-3 line-clamp-2 font-body text-xs italic text-ink-faint">
                  &quot;{m.objective}&quot;
                </p>
              )}

              <div className="flex items-center justify-between font-body text-xs text-ink-muted">
                <span className="flex items-center gap-1">
                  <Activity size={11} strokeWidth={1.75} />
                  {m._count?.sessions ?? 0} sessões
                </span>
                {m.durationMonths && (
                  <span className="flex items-center gap-1">
                    <Clock size={11} strokeWidth={1.75} />
                    {m.durationMonths}m
                  </span>
                )}
              </div>
            </CardBody>
          </Card>
        ))}

        {(data?.data.length ?? 0) === 0 && (
          <div className="col-span-full">
            <EmptyState
              title="Nenhuma mentoria"
              description={`Não há mentorias no estado ${(
                STATUS_LABEL[status] ?? status
              ).toLowerCase()}.`}
            />
          </div>
        )}
      </div>
    </div>
  );
}
