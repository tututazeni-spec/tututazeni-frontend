// components/acl/PoliciesTab.tsx

import { Lock } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import type { AclPolicy } from './types';

export function PoliciesTab() {
  const { data = [], isLoading: loading } = useApiQuery<AclPolicy[]>(
    queryKeys.acl.policies(),
    '/acl/policies',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (loading) return <Skeleton rows={3} itemClassName="h-16 bg-surface rounded-xl" />;

  return (
    <div className="space-y-3">
      {data.map((p, i) => {
        const isDeny = p.effect === 'DENY';
        return (
          <Card
            key={i}
            className={`border p-4 ${isDeny ? 'border-danger-subtle' : 'border-success-subtle'}`}
          >
            <div className="mb-2 flex items-start justify-between">
              <h4 className="font-semibold text-ink">{p.name}</h4>
              <span
                className={`rounded-control px-2 py-0.5 font-bold text-[10px] ${isDeny ? 'bg-danger-subtle text-danger' : 'bg-success-subtle text-success-ink'}`}
              >
                {p.effect}
              </span>
            </div>
            {p.description && (
              <p className="mb-2 text-ink-muted text-xs">{p.description}</p>
            )}
            <div className="flex flex-wrap gap-2 text-[10px]">
              {p.subject && (
                <span className="rounded bg-surface px-2 py-0.5 text-ink-muted">
                  Subject: {p.subject}
                </span>
              )}
              {p.action && (
                <span className="rounded bg-surface px-2 py-0.5 text-ink-muted">
                  Action: {p.action}
                </span>
              )}
              {p.requiresJustification && (
                <span className="rounded bg-warning-subtle px-2 py-0.5 text-warning-ink">
                  ⚠️ Requer Justificativa
                </span>
              )}
              <span className="rounded bg-surface px-2 py-0.5 text-ink-muted">
                Priority: {p.priority}
              </span>
            </div>
            {p.condition && (
              <pre className="mt-2 overflow-x-auto rounded bg-surface p-2 text-ink-muted text-[10px]">
                {JSON.stringify(JSON.parse(p.condition), null, 2)}
              </pre>
            )}
          </Card>
        );
      })}

      {data.length === 0 && (
        <EmptyState
          icon={Lock}
          title="Sem políticas de acesso definidas"
          description="As políticas ABAC/PBAC permitem controlo granular baseado em contexto"
        />
      )}
    </div>
  );
}
