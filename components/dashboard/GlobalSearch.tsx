// components/dashboard/GlobalSearch.tsx
// Modal de pesquisa global (colaboradores/cursos) — dados próprios
// (useApiQuery com debounce) + apresentação. Extraído de
// app/(platform)/dashboard/page.tsx.

'use client';

import { useState } from 'react';
import { Search, BookOpen } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from './atoms';
import type { SearchResults } from './types';

export interface GlobalSearchProps {
  onClose: () => void;
}

export function GlobalSearch({ onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const enabled = debouncedQuery.length >= 2;

  // enabled controla quando dispara; pedidos obsoletos são cancelados (signal).
  const { data: results, isFetching: loading } = useApiQuery<SearchResults>(
    queryKeys.dashboard.search(debouncedQuery),
    '/dashboard/search',
    {
      params: { q: debouncedQuery, limit: 5 },
      enabled,
      staleTime: STALE_TIME.DYNAMIC,
    },
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-start justify-center pt-20 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <Search size={18} className="text-slate-400" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquisar colaboradores, cursos, competências..."
            className="flex-1 text-sm focus:outline-none"
          />
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="text-slate-400 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        {loading && (
          <div className="px-5 py-4 text-sm text-slate-400 animate-pulse">
            A pesquisar…
          </div>
        )}

        {results && (
          <div className="px-5 py-3 max-h-80 overflow-y-auto">
            {(results.users?.length ?? 0) > 0 && (
              <div className="mb-3">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">
                  Colaboradores
                </p>
                {results.users?.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center gap-2 py-1.5 hover:bg-slate-50 rounded-lg px-2 cursor-pointer"
                  >
                    <Avatar name={u.fullName} url={u.avatarUrl} size={7} />
                    <div>
                      <p className="text-sm font-medium text-slate-700">
                        {u.fullName}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {u.position?.name} · {u.department?.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {(results.courses?.length ?? 0) > 0 && (
              <div className="mb-3">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">
                  Cursos
                </p>
                {results.courses?.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-2 py-1.5 hover:bg-slate-50 rounded-lg px-2 cursor-pointer"
                  >
                    <BookOpen size={14} className="text-indigo-500 shrink-0" />
                    <p className="text-sm text-slate-700">{c.title}</p>
                  </div>
                ))}
              </div>
            )}
            {!results.users?.length && !results.courses?.length && (
              <p className="text-sm text-slate-400 text-center py-4">
                Sem resultados para &quot;{query}&quot;
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
