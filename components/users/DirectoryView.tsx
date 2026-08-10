// components/users/DirectoryView.tsx
// Vista "Diretório Interno": pesquisa livre de colaboradores.
// Extraído de app/(platform)/users/page.tsx.

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar, Skeleton } from './shared';
import type { DirectoryUser } from './types';

interface DirectoryViewProps {
  onSelect: (id: number) => void;
}

export function DirectoryView({ onSelect }: DirectoryViewProps) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);

  const { data = [], isLoading: loading } = useApiQuery<DirectoryUser[]>(
    queryKeys.users.directory(debouncedSearch),
    '/users/directory',
    {
      params: { search: debouncedSearch },
      staleTime: STALE_TIME.SEMI_STATIC,
      placeholderData: keepPreviousData,
    },
  );

  return (
    <div>
      <input
        type="text"
        placeholder="Pesquisar colaborador, cargo, departamento…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-5"
      />
      {loading ? (
        <Skeleton />
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {data.map((user) => (
            <div
              key={user.id}
              className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all"
              onClick={() => onSelect(user.id)}
            >
              <Avatar user={user} size="md" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {user.fullName}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {user.position?.name ?? '—'}
                </div>
                <div className="text-xs text-gray-400 truncate">
                  {user.department?.name ?? '—'}
                </div>
                {user.email && (
                  <div className="text-xs text-blue-600 truncate">
                    {user.email}
                  </div>
                )}
              </div>
            </div>
          ))}
          {data.length === 0 && (
            <div className="col-span-3 py-12 text-center text-sm text-gray-400">
              Nenhum colaborador encontrado
            </div>
          )}
        </div>
      )}
    </div>
  );
}
