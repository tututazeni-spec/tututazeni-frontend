// components/roles-permissions/RolesTab.tsx
// Tab "Roles": lista pesquisável + detalhe com clonagem/remoção e
// permissões/utilizadores do role. Extraído de
// app/(platform)/roles-permissions/page.tsx.

'use client';

import { useState } from 'react';
import { ChevronRight, Copy, Search, Shield, Trash2 } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { apiClient } from '@/lib/apiClient';
import { reportError } from '@/lib/errorReporting';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Role } from './types';

export function RolesTab() {
  const [selected, setSel] = useState<Role | null>(null);
  const [search, setSearch] = useState('');

  const {
    data: roles = [],
    isLoading: loading,
    refetch,
  } = useApiQuery<Role[]>(
    queryKeys.rolesPermissions.roles(),
    '/roles-permissions',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const load = () => {
    void refetch();
  };
  const confirm = useConfirm();
  const notify = useToast();

  const filtered = roles.filter(
    (r) => !search || r.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {/* List */}
      <Card>
        <div className="p-3 border-b border-border">
          <div className="relative">
            <Search
              size={14}
              strokeWidth={1.75}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar roles..."
              className="w-full pl-8"
            />
          </div>
        </div>
        {loading ? (
          <Skeleton
            wrapperClassName="space-y-3 p-3"
            itemClassName="skeleton-shimmer h-16 rounded-card"
          />
        ) : (
          <div className="divide-y divide-border max-h-[560px] overflow-y-auto">
            {filtered.map((r) => (
              <button
                key={r.id}
                onClick={() => setSel(r)}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-sunken ${selected?.id === r.id ? 'bg-primary-subtle' : ''}`}
              >
                <Avatar
                  name={r.code ?? r.name}
                  size="sm"
                  className="shrink-0"
                />
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-ink truncate">
                    {r.name}
                  </p>
                  <p className="text-[10px] text-ink-faint">
                    {r._count?.users ?? 0} users · {r.effectivePermissions ?? 0}{' '}
                    perms
                  </p>
                </div>
                <ChevronRight
                  size={14}
                  strokeWidth={1.75}
                  className="text-ink-faint shrink-0"
                />
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* Detail */}
      <Card className="md:col-span-2">
        <CardBody>
          {!selected ? (
            <EmptyState
              icon={Shield}
              title="Nenhum role seleccionado"
              description="Selecciona um role para ver e editar permissões"
            />
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-bold text-ink text-lg">
                    {selected.name}
                  </h4>
                  <p className="text-xs text-ink-faint font-data">
                    {selected.code} · {selected._count?.users ?? 0} utilizadores
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    intent="secondary"
                    onClick={() => {
                      const n = prompt('Nome do clone:');
                      if (n)
                        apiClient
                          .post(`/roles-permissions/${selected.id}/clone`, {
                            newName: n,
                          })
                          .then(load)
                          .catch((e) => {
                            reportError(e, { source: 'RolesTab.clone' });
                            notify({
                              title: e instanceof Error ? e.message : String(e),
                              intent: 'danger',
                            });
                          });
                    }}
                  >
                    <Copy size={14} strokeWidth={1.75} />
                    Clonar
                  </Button>
                  {!selected.isSystem && selected._count?.users === 0 && (
                    <Button
                      size="sm"
                      intent="danger"
                      onClick={async () => {
                        if (
                          await confirm({
                            title: 'Remover role?',
                            confirmLabel: 'Remover',
                            destructive: true,
                          })
                        )
                          apiClient
                            .delete(`/roles-permissions/${selected.id}`)
                            .then(() => {
                              setSel(null);
                              load();
                            })
                            .catch((e) => {
                              reportError(e, { source: 'RolesTab.remove' });
                              notify({
                                title:
                                  e instanceof Error ? e.message : String(e),
                                intent: 'danger',
                              });
                            });
                      }}
                    >
                      <Trash2 size={14} strokeWidth={1.75} />
                      Remover
                    </Button>
                  )}
                </div>
              </div>

              <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">
                Permissões ({selected.permissions?.length ?? 0})
              </p>
              <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto mb-4">
                {(selected.permissions ?? []).map((p, i) => (
                  <Badge key={i} intent="neutral" className="font-data">
                    {p.name}
                  </Badge>
                ))}
                {!selected.permissions?.length && (
                  <p className="text-sm text-ink-faint">Sem permissões</p>
                )}
              </div>

              {/* Users in role */}
              {(selected.users ?? []).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">
                    Utilizadores
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(selected.users ?? []).slice(0, 10).map((u, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-1.5 bg-surface-sunken rounded-control px-2.5 py-1.5"
                      >
                        <Avatar
                          name={u.fullName}
                          size="sm"
                          className="h-5 w-5 text-[9px]"
                        />
                        <span className="text-xs text-ink">{u.fullName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
