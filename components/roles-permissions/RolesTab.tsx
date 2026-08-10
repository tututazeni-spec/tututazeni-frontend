// components/roles-permissions/RolesTab.tsx
// Tab "Roles": lista pesquisável + detalhe com clonagem/remoção e
// permissões/utilizadores do role. Extraído de
// app/(platform)/roles-permissions/page.tsx.

'use client';

import { useState } from 'react';
import { ChevronRight, Copy, Search, Shield, Trash2 } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useConfirm } from '@/providers/ConfirmProvider';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from './atoms';
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

  const filtered = roles.filter(
    (r) => !search || r.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {/* List */}
      <div className="bg-white rounded-xl border border-slate-100">
        <div className="p-3 border-b border-slate-100">
          <div className="relative">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar roles..."
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400"
            />
          </div>
        </div>
        {loading ? (
          <Skeleton />
        ) : (
          <div className="divide-y divide-slate-50 max-h-[560px] overflow-y-auto">
            {filtered.map((r) => (
              <button
                key={r.id}
                onClick={() => setSel(r)}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 ${selected?.id === r.id ? 'bg-indigo-50' : ''}`}
              >
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700 shrink-0">
                  {r.code?.[0] ?? r.name[0]}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-slate-700 truncate">
                    {r.name}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {r._count?.users ?? 0} users · {r.effectivePermissions ?? 0}{' '}
                    perms
                  </p>
                </div>
                <ChevronRight size={12} className="text-slate-400 shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Detail */}
      <div className="md:col-span-2 bg-white rounded-xl border border-slate-100 p-5">
        {!selected ? (
          <div className="text-center py-12 text-slate-400">
            <Shield size={36} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">
              Selecciona um role para ver e editar permissões
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-bold text-slate-800 text-lg">
                  {selected.name}
                </h4>
                <p className="text-xs text-slate-400 font-mono">
                  {selected.code} · {selected._count?.users ?? 0} utilizadores
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const n = prompt('Nome do clone:');
                    if (n)
                      apiClient
                        .post(`/roles-permissions/${selected.id}/clone`, {
                          newName: n,
                        })
                        .then(load);
                  }}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50"
                >
                  <Copy size={12} />
                  Clonar
                </button>
                {!selected.isSystem && selected._count?.users === 0 && (
                  <button
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
                          });
                    }}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
                  >
                    <Trash2 size={12} />
                    Remover
                  </button>
                )}
              </div>
            </div>

            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Permissões ({selected.permissions?.length ?? 0})
            </p>
            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto mb-4">
              {(selected.permissions ?? []).map((p, i) => (
                <span
                  key={i}
                  className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg"
                >
                  {p.name}
                </span>
              ))}
              {!selected.permissions?.length && (
                <p className="text-sm text-slate-400">Sem permissões</p>
              )}
            </div>

            {/* Users in role */}
            {(selected.users ?? []).length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Utilizadores
                </p>
                <div className="flex flex-wrap gap-2">
                  {(selected.users ?? []).slice(0, 10).map((u, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1.5 bg-slate-50 rounded-lg px-2.5 py-1.5"
                    >
                      <div className="w-5 h-5 rounded-full bg-indigo-200 flex items-center justify-center text-[9px] font-bold text-indigo-700">
                        {u.fullName[0]}
                      </div>
                      <span className="text-xs text-slate-700">
                        {u.fullName}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
