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
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
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
      <Input
        type="text"
        placeholder="Pesquisar colaborador, cargo, departamento…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full mb-5"
      />
      {loading ? (
        <Skeleton
          rows={5}
          wrapperClassName="space-y-2 animate-pulse"
          itemClassName="h-14 rounded-card bg-surface-sunken"
        />
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {data.map((user) => (
            <Card
              key={user.id}
              className="p-4 flex items-center gap-3 cursor-pointer hover:shadow-hover transition-shadow"
              onClick={() => onSelect(user.id)}
            >
              <Avatar name={user.fullName} url={user.avatarUrl ?? undefined} size="md" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-ink truncate">
                  {user.fullName}
                </div>
                <div className="text-xs text-ink-muted truncate">
                  {user.position?.name ?? '—'}
                </div>
                <div className="text-xs text-ink-faint truncate">
                  {user.department?.name ?? '—'}
                </div>
                {user.email && (
                  <div className="text-xs text-primary truncate">
                    {user.email}
                  </div>
                )}
              </div>
            </Card>
          ))}
          {data.length === 0 && (
            <div className="col-span-3 py-12 text-center text-sm text-ink-faint">
              Nenhum colaborador encontrado
            </div>
          )}
        </div>
      )}
    </div>
  );
}
