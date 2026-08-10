// components/roles-permissions/MatrixTab.tsx
// Tab "Matriz": tabela role × permissão filtrável por subject.
// Extraído de app/(platform)/roles-permissions/page.tsx.

'use client';

import { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from './atoms';
import type { MatrixData } from './types';

export function MatrixTab() {
  const [subject, setSubject] = useState('');
  const { data, isLoading: loading } = useApiQuery<MatrixData>(
    queryKeys.rolesPermissions.matrix(),
    '/roles-permissions/matrix',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (loading) return <Skeleton />;

  const subjects = (data?.grouped ?? []).map((g) => g.subject);
  const filtered = subject
    ? (data?.permissions ?? []).filter((p) => p.subject === subject)
    : (data?.permissions ?? []);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSubject('')}
          className={`text-xs px-3 py-1.5 rounded-lg ${!subject ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}
        >
          Todos
        </button>
        {subjects.map((s: string) => (
          <button
            key={s}
            onClick={() => setSubject(s)}
            className={`text-xs px-3 py-1.5 rounded-lg ${subject === s ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-100 overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left text-slate-500 font-medium">
                Permissão
              </th>
              {(data?.roles ?? []).map((r) => (
                <th
                  key={r.id}
                  className="px-2 py-2 text-center text-slate-500 font-medium whitespace-nowrap"
                >
                  {r.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map((p, i) => (
              <tr key={i} className="hover:bg-slate-50">
                <td className="px-3 py-1.5">
                  <p className="font-mono text-slate-700">{p.name}</p>
                  <p className="text-[10px] text-slate-400">
                    {p.subject} · {p.action}
                  </p>
                </td>
                {(data?.roles ?? []).map((r) => (
                  <td key={r.id} className="px-2 py-1.5 text-center">
                    {data?.matrix?.[i]?.[r.name] ? (
                      <CheckCircle
                        size={14}
                        className="text-emerald-500 mx-auto"
                      />
                    ) : (
                      <span className="text-slate-200">—</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
