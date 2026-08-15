// components/dashboard/GlobalSearch.tsx
// Modal de pesquisa global (colaboradores/cursos) — dados próprios
// (useApiQuery com debounce) + apresentação. Extraído de
// app/(platform)/dashboard/page.tsx.
//
// Overlay controlado pelo pai (`showSearch && <GlobalSearch .../>`, ver
// app/(platform)/dashboard/page.tsx) — não é o `Modal`/Dialog.Root da
// fundação (esse assume o próprio estado de open/close); mantém-se a
// mesma estrutura, só a paleta migra para tokens.

'use client';

import { useState } from 'react';
import { Search, BookOpen, X } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
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
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-ink/50 px-4 pt-20">
      <div className="w-full max-w-xl overflow-hidden rounded-panel bg-surface shadow-elevated">
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <Search size={18} strokeWidth={1.75} className="text-ink-faint" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquisar colaboradores, cursos, competências..."
            className="flex-1 font-body text-sm text-ink focus:outline-none"
          />
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="text-ink-faint hover:text-ink"
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>

        {loading && (
          <div className="animate-pulse px-5 py-4 font-body text-sm text-ink-faint">
            A pesquisar…
          </div>
        )}

        {results && (
          <div className="max-h-80 overflow-y-auto px-5 py-3">
            {(results.users?.length ?? 0) > 0 && (
              <div className="mb-3">
                <p className="mb-2 font-body text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
                  Colaboradores
                </p>
                {results.users?.map((u) => (
                  <div
                    key={u.id}
                    className="flex cursor-pointer items-center gap-2 rounded-control px-2 py-1.5 hover:bg-surface-sunken"
                  >
                    <Avatar name={u.fullName} url={u.avatarUrl} size="sm" />
                    <div>
                      <p className="font-body text-sm font-medium text-ink">
                        {u.fullName}
                      </p>
                      <p className="font-body text-[10px] text-ink-faint">
                        {u.position?.name} · {u.department?.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {(results.courses?.length ?? 0) > 0 && (
              <div className="mb-3">
                <p className="mb-2 font-body text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
                  Cursos
                </p>
                {results.courses?.map((c) => (
                  <div
                    key={c.id}
                    className="flex cursor-pointer items-center gap-2 rounded-control px-2 py-1.5 hover:bg-surface-sunken"
                  >
                    <BookOpen
                      size={14}
                      strokeWidth={1.75}
                      className="shrink-0 text-primary"
                    />
                    <p className="font-body text-sm text-ink">{c.title}</p>
                  </div>
                ))}
              </div>
            )}
            {!results.users?.length && !results.courses?.length && (
              <p className="py-4 text-center font-body text-sm text-ink-faint">
                Sem resultados para &quot;{query}&quot;
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
