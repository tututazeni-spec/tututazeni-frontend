// components/acl/AuditTab.tsx

import { useState } from 'react';
import { Activity, Circle } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import type { AclAuditResponse } from './types';

export function AuditTab() {
  const [view, setView] = useState<'all' | 'denied'>('all');
  const [page, setPage] = useState(1);
  const { data, isLoading: loading } = useApiQuery<AclAuditResponse>(
    queryKeys.acl.audit(view, page),
    view === 'denied' ? '/acl/audit/denied' : '/acl/audit',
    { params: { page }, staleTime: STALE_TIME.DYNAMIC },
  );

  if (loading)
    return <Skeleton rows={3} itemClassName="h-16 bg-surface rounded-xl" />;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['all', 'denied'] as const).map((v) => (
          <Button
            key={v}
            intent={view === v ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => {
              setView(v);
              setPage(1);
            }}
          >
            {v === 'all' ? (
              'Todas as Alterações'
            ) : (
              <span className="inline-flex items-center gap-1">
                <Circle
                  size={11}
                  strokeWidth={1.75}
                  className="fill-danger text-danger"
                />{' '}
                Acessos Negados
              </span>
            )}
          </Button>
        ))}
        <span className="self-center ml-auto text-ink-faint text-xs">
          {data?.meta?.total ?? 0} registos
        </span>
      </div>

      <Card className="divide-y divide-border overflow-hidden">
        <div className="max-h-[500px] divide-y divide-border overflow-y-auto">
          {(data?.data ?? []).map((log, i) => {
            const changes = log.changes
              ? (() => {
                  try {
                    return JSON.parse(log.changes);
                  } catch {
                    return null;
                  }
                })()
              : null;
            return (
              <div key={i} className="flex items-start gap-3 px-4 py-3">
                <div
                  className={`h-2 w-2 shrink-0 rounded-full mt-1.5 ${log.action === 'ACCESS_DENIED' ? 'bg-danger' : 'bg-primary'}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-ink text-xs">
                      {log.user?.fullName ?? `User ${log.userId}`}
                    </span>
                    <span className="rounded bg-surface px-1.5 py-0.5 font-mono text-ink-muted text-[10px]">
                      {log.action}
                    </span>
                    {changes?.subject && (
                      <span className="text-ink-faint text-[10px]">
                        {changes.subject}
                      </span>
                    )}
                  </div>
                  {changes?.reason && (
                    <p className="mt-0.5 text-ink-faint text-[10px]">
                      {changes.reason}
                    </p>
                  )}
                </div>
                <span className="shrink-0 text-ink-faint text-[10px]">
                  {new Date(log.timestamp).toLocaleString('pt')}
                </span>
              </div>
            );
          })}
          {(data?.data?.length ?? 0) === 0 && (
            <div className="py-12 text-center text-ink-faint">
              <Activity
                size={32}
                strokeWidth={1.75}
                className="mx-auto mb-2 opacity-30"
              />
              <p className="text-sm">Sem registos de auditoria</p>
            </div>
          )}
        </div>
      </Card>

      <Pagination
        page={page}
        totalPages={data?.meta?.totalPages ?? 1}
        onPageChange={setPage}
      />
    </div>
  );
}
