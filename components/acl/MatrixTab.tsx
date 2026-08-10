// components/acl/MatrixTab.tsx

import { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from './atoms';
import type { AclMatrixData } from './types';

export function MatrixTab() {
  const [subjectFilter, setSubjectFilter] = useState('');
  const { data, isLoading: loading } = useApiQuery<AclMatrixData>(
    queryKeys.acl.matrix(),
    '/acl/matrix',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (loading) return <Skeleton />;

  const subjects: string[] = [
    ...new Set<string>((data?.permissions ?? []).map((p) => String(p.subject))),
  ];
  const filtered = (data?.permissions ?? []).filter(
    (p) => !subjectFilter || p.subject === subjectFilter,
  );

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSubjectFilter('')}
          className={`text-xs px-3 py-1.5 rounded-lg ${!subjectFilter ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}
        >
          Todos
        </button>
        {subjects.map((s) => (
          <button
            key={s}
            onClick={() => setSubjectFilter(s)}
            className={`text-xs px-3 py-1.5 rounded-lg ${subjectFilter === s ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Matrix table */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead className="bg-slate-50 sticky top-0">
            <tr>
              <th className="px-3 py-2 text-left text-slate-500 font-medium whitespace-nowrap">
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
                  <div>
                    <p className="font-mono text-slate-700">{p.name}</p>
                    <p className="text-[10px] text-slate-400">
                      {p.subject} · {p.action}
                    </p>
                  </div>
                </td>
                {(data?.roles ?? []).map((r) => (
                  <td key={r.id} className="px-2 py-1.5 text-center">
                    {data?.matrix[i]?.[r.name] ? (
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
