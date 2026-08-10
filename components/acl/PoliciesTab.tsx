// components/acl/PoliciesTab.tsx

import { Lock } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from './atoms';
import type { AclPolicy } from './types';

export function PoliciesTab() {
  const { data = [], isLoading: loading } = useApiQuery<AclPolicy[]>(
    queryKeys.acl.policies(),
    '/acl/policies',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (loading) return <Skeleton />;

  return (
    <div className="space-y-3">
      {data.map((p, i) => (
        <div
          key={i}
          className={`bg-white rounded-xl border p-4 ${p.effect === 'DENY' ? 'border-red-200' : 'border-emerald-200'}`}
        >
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-semibold text-slate-800">{p.name}</h4>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${p.effect === 'DENY' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}
            >
              {p.effect}
            </span>
          </div>
          {p.description && (
            <p className="text-xs text-slate-500 mb-2">{p.description}</p>
          )}
          <div className="flex gap-2 flex-wrap text-[10px]">
            {p.subject && (
              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                Subject: {p.subject}
              </span>
            )}
            {p.action && (
              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                Action: {p.action}
              </span>
            )}
            {p.requiresJustification && (
              <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                ⚠️ Requer Justificativa
              </span>
            )}
            <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
              Priority: {p.priority}
            </span>
          </div>
          {p.condition && (
            <pre className="text-[10px] bg-slate-50 rounded p-2 mt-2 text-slate-600 overflow-x-auto">
              {JSON.stringify(JSON.parse(p.condition), null, 2)}
            </pre>
          )}
        </div>
      ))}

      {data.length === 0 && (
        <div className="py-16 text-center bg-slate-50 rounded-xl text-slate-400">
          <Lock size={36} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">Sem políticas de acesso definidas</p>
          <p className="text-xs mt-1">
            As políticas ABAC/PBAC permitem controlo granular baseado em
            contexto
          </p>
        </div>
      )}
    </div>
  );
}
