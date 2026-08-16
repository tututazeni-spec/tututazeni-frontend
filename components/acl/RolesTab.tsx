// components/acl/RolesTab.tsx

import { useState } from 'react';
import { Shield, ChevronRight } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { AclRole } from './types';

export function RolesTab() {
  const [selected, setSelected] = useState<AclRole | null>(null);
  const { data: roles = [], isLoading: loading } = useApiQuery<AclRole[]>(
    queryKeys.acl.roles(),
    '/acl/roles',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (loading) return <Skeleton rows={3} itemClassName="h-16 bg-surface rounded-xl" />;

  return (
    <div className="gap-5 grid grid-cols-1 md:grid-cols-3">
      {/* Role list */}
      <Card className="divide-y divide-border overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h4 className="font-semibold text-ink">
            Roles ({roles.length})
          </h4>
        </div>
        <div className="divide-y divide-border">
          {roles.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelected(r)}
              className={`flex w-full items-center gap-3 px-4 py-3 transition-colors hover:bg-surface ${selected?.id === r.id ? 'bg-primary-subtle' : ''}`}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-subtle font-bold text-primary text-xs">
                {r.code?.[0] ?? r.name?.[0]}
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="font-medium text-ink text-sm">{r.name}</p>
                <p className="text-ink-faint text-[10px]">
                  {r._count?.users ?? 0} utilizadores ·{' '}
                  {r.permissions?.length ?? 0} permissões
                </p>
              </div>
              <ChevronRight size={13} strokeWidth={1.75} className="text-ink-faint" />
            </button>
          ))}
        </div>
      </Card>

      {/* Role detail */}
      <Card className="md:col-span-2 p-5">
        {!selected ? (
          <div className="py-12 text-center text-ink-faint">
            <Shield size={36} strokeWidth={1.75} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Selecciona um role para ver detalhes</p>
          </div>
        ) : (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-ink text-lg">
                  {selected.name}
                </h4>
                <p className="font-mono text-ink-faint text-xs">
                  {selected.code}
                </p>
              </div>
              <div className="flex gap-2">
                <Button intent="secondary" size="sm">
                  Clonar
                </Button>
              </div>
            </div>

            <p className="mb-2 font-semibold text-ink-muted text-xs uppercase tracking-wide">
              Permissões ({selected.permissions?.length ?? 0})
            </p>
            <div className="flex max-h-64 flex-wrap gap-1.5 overflow-y-auto">
              {(selected.permissions ?? []).map((p, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1 rounded-control bg-surface px-2 py-1 text-ink text-[10px]"
                >
                  <span className="font-mono">{p.name}</span>
                </div>
              ))}
              {selected.permissions?.length === 0 && (
                <p className="text-ink-faint text-sm">
                  Sem permissões atribuídas
                </p>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
