// components/users/DirectoryView.tsx
// Vista "Diretório Interno": pesquisa livre de colaboradores.
// Extraído de app/(platform)/users/page.tsx.

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { Briefcase, Building2 } from 'lucide-react';
import { PersonCard } from './PersonCard';
import { usePositionOptions } from './createUserData';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Card, CardBody } from '@/components/ui/Card';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import type { DirectoryUser } from './types';
import { EmptyState } from '@/components/ui/EmptyState';

interface DepartmentRow {
  id: number;
  name: string;
}

interface DirectoryViewProps {
  onSelect: (id: number) => void;
}

/* ── Vista principal ───────────────────────────────────────── */
export function DirectoryView({ onSelect }: DirectoryViewProps) {
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [positionId, setPositionId] = useState('');
  const debouncedSearch = useDebounce(search);

  const deptParams = { limit: 200 };
  const { data: depts } = useApiQuery<{ data: DepartmentRow[] }>(
    queryKeys.departments.list(deptParams),
    '/departments',
    { params: deptParams, staleTime: STALE_TIME.SEMI_STATIC },
  );
  const { options: positionOptions } = usePositionOptions();
  const departmentItems = [
    { value: 'ALL', label: 'Todos os departamentos' },
    ...(depts?.data ?? []).map((d) => ({
      value: String(d.id),
      label: d.name,
    })),
  ];
  const positionItems = [
    { value: 'ALL', label: 'Todos os cargos' },
    ...positionOptions.map((p) => ({ value: p.value, label: p.label })),
  ];

  // Por omissão o diretório não lista ninguém: só pesquisa quando há filtro.
  const hasFilter =
    search.trim() !== '' || departmentId !== '' || positionId !== '';

  const { data = [], isLoading: loading } = useApiQuery<DirectoryUser[]>(
    queryKeys.users.directory(
      debouncedSearch,
      [departmentId, positionId].join('|'),
    ),
    '/users/directory',
    {
      params: {
        search: debouncedSearch,
        departmentId: departmentId || undefined,
        positionId: positionId || undefined,
      },
      staleTime: STALE_TIME.SEMI_STATIC,
      placeholderData: keepPreviousData,
      enabled: hasFilter,
    },
  );

  return (
    <div>
      <Card className="mb-5">
        <CardBody className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-3">
          <SearchInput
            variant="underline"
            placeholder="Pesquisar colaborador, cargo, departamento…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            variant="underline"
            icon={Building2}
            items={departmentItems}
            value={departmentId || 'ALL'}
            onValueChange={(v) => setDepartmentId(v === 'ALL' ? '' : v)}
          />
          <Select
            variant="underline"
            icon={Briefcase}
            items={positionItems}
            value={positionId || 'ALL'}
            onValueChange={(v) => setPositionId(v === 'ALL' ? '' : v)}
          />
        </CardBody>
      </Card>
      {!hasFilter ? (
        <EmptyState
          variant="inline"
          title="Pesquise ou filtre para ver colaboradores"
        />
      ) : loading ? (
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
