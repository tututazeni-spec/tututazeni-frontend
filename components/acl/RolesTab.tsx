// components/acl/RolesTab.tsx

import { useState } from 'react';
import { Shield, ChevronRight } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from './atoms';
import type { AclRole } from './types';

export function RolesTab() {
  const [selected, setSelected] = useState<AclRole | null>(null);
  const { data: roles = [], isLoading: loading } = useApiQuery<AclRole[]>(
    queryKeys.acl.roles(),
    '/acl/roles',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (loading) return <Skeleton />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {/* Role list */}
      <div className="bg-white rounded-xl border border-slate-100">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <h4 className="font-semibold text-slate-700">
            Roles ({roles.length})
          </h4>
        </div>
        <div className="divide-y divide-slate-50">
          {roles.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelected(r)}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors ${selected?.id === r.id ? 'bg-indigo-50' : ''}`}
            >
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700 shrink-0">
                {r.code?.[0] ?? r.name?.[0]}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-slate-700">{r.name}</p>
                <p className="text-[10px] text-slate-400">
                  {r._count?.users ?? 0} utilizadores ·{' '}
                  {r.permissions?.length ?? 0} permissões
                </p>
              </div>
              <ChevronRight size={13} className="text-slate-400" />
            </button>
          ))}
        </div>
      </div>

      {/* Role detail */}
      <div className="md:col-span-2 bg-white rounded-xl border border-slate-100 p-5">
        {!selected ? (
          <div className="text-center py-12 text-slate-400">
            <Shield size={36} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Selecciona um role para ver detalhes</p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-bold text-slate-800 text-lg">
                  {selected.name}
                </h4>
                <p className="text-xs text-slate-400 font-mono">
                  {selected.code}
                </p>
              </div>
              <div className="flex gap-2">
                <button className="text-xs px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50">
                  Clonar
                </button>
              </div>
            </div>

            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Permissões ({selected.permissions?.length ?? 0})
            </p>
            <div className="flex flex-wrap gap-1.5 max-h-64 overflow-y-auto">
              {(selected.permissions ?? []).map((p, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1 text-[10px] bg-slate-100 text-slate-700 px-2 py-1 rounded-lg"
                >
                  <span className="font-mono">{p.name}</span>
                </div>
              ))}
              {selected.permissions?.length === 0 && (
                <p className="text-sm text-slate-400">
                  Sem permissões atribuídas
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
