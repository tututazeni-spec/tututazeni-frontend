// components/departments/ListView.tsx
// Separador "Lista" — tabela paginada de departamentos. Dados próprios
// + apresentação. Extraído de app/(platform)/departments/page.tsx.

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { ChevronRight } from 'lucide-react';
import { departmentIcon } from './departmentIcon';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import type { PaginatedDepts } from './types';

// Mesma grelha no cabeçalho e nos cartões para as colunas alinharem.
const GRID =
  'grid items-center gap-3 grid-cols-[minmax(0,1fr)_auto_auto] md:grid-cols-[minmax(0,2fr)_90px_minmax(0,1.4fr)_70px_90px_90px_20px]';

function DeptIcon({ name, hasChildren }: { name: string; hasChildren: boolean }) {
  const Icon = departmentIcon(name, hasChildren);
  return <Icon size={20} strokeWidth={1.75} />;
}

interface ListViewProps {
  onSelect: (id: number) => void;
}

export function ListView({ onSelect }: ListViewProps) {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);
  const params = {
    page,
    limit: 20,
    search: debouncedSearch,
    active: activeFilter || undefined,
  };

  const {
    data,
    isLoading: loading,
    error: queryError,
  } = useApiQuery<PaginatedDepts>(
    queryKeys.departments.list(params),
    '/departments',
    {
      params,
      staleTime: STALE_TIME.SEMI_STATIC,
      placeholderData: keepPreviousData,
    },
  );
  const error = queryError?.message ?? null;

  return (
    <div>
      {/* Filtros */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Input
          type="text"
          placeholder="Pesquisar por nome, código ou gestor…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="min-w-[160px] flex-1"
        />
        <select
          value={activeFilter}
          onChange={(e) => {
            setActiveFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-control border-[1.5px] border-border-strong bg-surface px-3 py-[9px] font-body text-sm text-ink focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent-subtle"
        >
          <option value="">Todos os estados</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </select>
      </div>

      {/* Tabela */}
      {loading && (
        <Skeleton
          rows={5}
          wrapperClassName="space-y-2 animate-pulse"
          itemClassName="h-14 rounded-card bg-surface-sunken"
        />
      )}
      {error && (
        <div className="px-4 py-8 text-center text-sm text-danger">{error}</div>
      )}
      {!loading && (
        <div>
          <div
            className={`${GRID} hidden rounded-t-2xl bg-[#0F1F3D]/60 px-4 py-3 text-xs font-medium uppercase tracking-wide text-white md:grid`}
          >
            <span>Departamento</span>
            <span>Código</span>
            <span>Gestor</span>
            <span>Membros</span>
            <span>Estado</span>
            <span>Sub-deptos</span>
            <span />
          </div>
          <div className="md:mt-1.5">
            {data?.data.length === 0 && (
              <div className="py-12 text-center text-sm text-ink-faint">
                Nenhum departamento encontrado
              </div>
            )}
            {data?.data.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => onSelect(d.id)}
                className={`${GRID} mb-1.5 w-full rounded-[14px] border border-[#E1EAF6] bg-[#F0F6FF] px-4 py-3 text-left transition-colors hover:bg-[#E5F0FF]`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#0F1F3D] text-white">
                    <DeptIcon name={d.name} hasChildren={d._count.children > 0} />
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-[#0F1F3D]">
                      {d.name}
                    </div>
                    {d.parent && (
                      <div className="truncate text-[11px] text-[#7890AC]">
                        ↳ {d.parent.name}
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-[11px] text-[#0F1F3D]">{d.code}</span>
                <div className="min-w-0 text-[11px] text-[#0F1F3D]">
                  {d.head ? (
                    <span className="flex items-center gap-1.5">
                      <Avatar name={d.head.fullName} size="sm" />
                      <span className="truncate">{d.head.fullName}</span>
                    </span>
                  ) : (
                    '—'
                  )}
                </div>
                <span className="text-xs text-[#0F1F3D]">{d._count.users}</span>
                <span>
                  <Badge intent={d.active ? 'success' : 'neutral'}>
                    {d.active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </span>
                <span className="text-xs text-[#0F1F3D]">{d._count.children}</span>
                <ChevronRight
                  size={18}
                  strokeWidth={1.75}
                  className="flex-shrink-0 text-[#526B89]"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-ink-faint">
            Página {data.page} de {data.totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              intent="secondary"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </Button>
            <Button
              intent="secondary"
              size="sm"
              disabled={page === data.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
