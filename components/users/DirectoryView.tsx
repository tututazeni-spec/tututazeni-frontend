// components/users/DirectoryView.tsx
// Vista "Diretório Interno": pesquisa livre de colaboradores.
// Extraído de app/(platform)/users/page.tsx.

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { PersonCard } from './PersonCard';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import type { DirectoryUser } from './types';
import { EmptyState } from '@/components/ui/EmptyState';

interface DirectoryViewProps {
  onSelect: (id: number) => void;
}

/* ── Vista principal ───────────────────────────────────────── */
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
        variant="underline"
        type="text"
        placeholder="Pesquisar colaborador, cargo, departamento…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full mb-5"
      />
      {loading ? (
        <Skeleton
          rows={8}
          wrapperClassName="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4"
          itemClassName="h-[190px] rounded-panel bg-surface-sunken"
        />
      ) : data.length === 0 ? (
        <EmptyState variant="inline" title="Nenhum colaborador encontrado" />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {data.map((user) => (
            <PersonCard
              key={user.id}
              fullName={user.fullName}
              avatarUrl={user.avatarUrl}
              departmentName={user.department?.name}
              email={user.email}
              positionName={user.position?.name}
              onOpen={() => onSelect(user.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
