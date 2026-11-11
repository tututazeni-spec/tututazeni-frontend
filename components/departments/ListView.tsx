// components/departments/ListView.tsx
// Separador "Lista" — painel com imagem à esquerda (departamentoscard.jpeg) e
// lista/cartões de departamentos à direita, conforme departamentoslayout.jpeg.
// Dados próprios + apresentação. Extraído de app/(platform)/departments/page.tsx.

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { ChevronRight, Filter, LayoutGrid, List } from 'lucide-react';
import { departmentIcon } from './departmentIcon';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Department, PaginatedDepts } from './types';
import { DepartmentExportMenu, fetchAllRows } from './DepartmentExportMenu';

import { SearchInput } from '@/components/ui/SearchInput';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/EmptyState';

// Mesma grelha no cabeçalho e nas linhas para as colunas alinharem.
const GRID =
  'grid items-center gap-1.5 grid-cols-[minmax(0,1fr)_auto_auto] md:grid-cols-[minmax(0,1.5fr)_72px_minmax(0,1.1fr)_52px_92px_56px_14px]';

function DeptIcon({
  name,
  hasChildren,
}: {
  name: string;
  hasChildren: boolean;
}) {
  const Icon = departmentIcon(name, hasChildren);
  return <Icon size={20} strokeWidth={1.75} />;
}

const STATUS_ITEMS = [
  { value: 'ALL', label: 'Todos os estados' },
  { value: 'true', label: 'Activos' },
  { value: 'false', label: 'Inactivos' },
];

interface ListViewProps {
  onSelect: (id: number) => void;
}

export function ListView({ onSelect }: ListViewProps) {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [page, setPage] = useState(1);
  const [layout, setLayout] = useState<'grid' | 'list'>('list');
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
  const rows = data?.data ?? [];

  return (
    <div>
      {/* Filtros */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="min-w-[200px] flex-1">
          <SearchInput
            variant="underline"
            placeholder="Pesquisar por nome, código ou gestor…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="min-w-[180px]">
          <Select
            variant="underline"
            icon={Filter}
            items={STATUS_ITEMS}
            value={activeFilter || 'ALL'}
            onValueChange={(v) => {
              setActiveFilter(v === 'ALL' ? '' : v);
              setPage(1);
            }}
          />
        </div>
        <DepartmentExportMenu
          build={async () => {
            const all = await fetchAllRows<Department>('/departments', {
              search: debouncedSearch,
              active: activeFilter || undefined,
            });
            return {
              title: 'Departamentos',
              headers: [
                'Departamento',
                'Código',
                'Departamento superior',
                'Gestor',
                'Membros',
                'Subdepartamentos',
                'Estado',
              ],
              rows: all.map((d) => [
                d.name,
                d.code,
                d.parent?.name,
                d.head?.fullName,
                d._count.users,
                d._count.children,
                d.active ? 'Activo' : 'Inactivo',
              ]),
            };
          }}
        />
        <div className="flex gap-1 rounded-[14px] bg-[#EAF1FC] p-1">
          {(
            [
              ['grid', LayoutGrid, 'Ver em cartões'],
              ['list', List, 'Ver em lista'],
            ] as const
          ).map(([mode, Icon, label]) => (
            <button
              key={mode}
              type="button"
              aria-label={label}
              aria-pressed={layout === mode}
              onClick={() => setLayout(mode)}
              className={`flex h-9 w-9 items-center justify-center rounded-[10px] transition-colors ${
                layout === mode
                  ? 'bg-brand text-white'
                  : 'text-brand hover:bg-white'
              }`}
            >
              <Icon size={18} strokeWidth={1.75} />
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <Skeleton
          rows={5}
          wrapperClassName="space-y-2"
          itemClassName="h-12 rounded-card bg-surface-sunken"
        />
      )}
      {error && (
        <div className="px-4 py-8 text-center text-sm text-danger">{error}</div>
      )}
      {!loading && rows.length === 0 && (
        <EmptyState variant="inline" title="Nenhum departamento encontrado" />
      )}

      {!loading && layout === 'list' && rows.length > 0 && (
        <div>
          <div
            className={`${GRID} hidden rounded-[10px] bg-[#DCE8FA] px-2 py-2 text-[11px] font-bold uppercase text-brand md:grid`}
          >
            <span>Departamento</span>
            <span>Código</span>
            <span>Gestor</span>
            <span>Membros</span>
            <span className="pl-4">Estado</span>
            <span>Sub-dep.</span>
            <span />
          </div>
          {rows.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => onSelect(d.id)}
              className={`${GRID} w-full border-b border-brand-line px-2 py-2 text-left transition-colors hover:bg-brand-soft`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand text-white">
                  <DeptIcon name={d.name} hasChildren={d._count.children > 0} />
                </span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-brand">
                    {d.name}
                  </div>
                  {d.parent && (
                    <div className="truncate text-micro text-[#7890AC]">
                      ↳ {d.parent.name}
                    </div>
                  )}
                </div>
              </div>
              <span className="break-words text-xs font-semibold text-brand">
                {d.code}
              </span>
              <div className="min-w-0 text-xs font-semibold text-brand">
                {d.head ? (
                  <span className="flex items-center gap-1.5">
                    <Avatar name={d.head.fullName} size="sm" />
                    <span className="truncate">{d.head.fullName}</span>
                  </span>
                ) : (
                  <span className="text-brand-muted">—</span>
                )}
              </div>
              <span className="text-xs font-semibold text-brand">
                {d._count.users}
              </span>
              <span className="pl-4">
                <Badge intent={d.active ? 'success' : 'neutral'}>
                  {d.active ? 'Activo' : 'Inactivo'}
                </Badge>
              </span>
              <span className="text-xs font-semibold text-brand">
                {d._count.children}
              </span>
              <ChevronRight
                size={18}
                strokeWidth={1.75}
                className="flex-shrink-0 text-brand"
              />
            </button>
          ))}
        </div>
      )}

      {!loading && layout === 'grid' && rows.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => onSelect(d.id)}
              className="rounded-[14px] border border-brand-line bg-white p-4 text-left transition-colors hover:bg-brand-soft"
            >
              <div className="mb-3 flex items-center gap-3">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand text-white">
                  <DeptIcon name={d.name} hasChildren={d._count.children > 0} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold text-brand">
                    {d.name}
                  </div>
                  <div className="text-micro font-semibold text-brand-muted">
                    {d.code}
                  </div>
                </div>
                <Badge intent={d.active ? 'success' : 'neutral'}>
                  {d.active ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
              <div className="mb-2 truncate text-xs text-brand">
                {d.head ? d.head.fullName : 'Sem gestor'}
              </div>
              <div className="flex gap-4 text-xs text-brand-muted">
                <span>
                  <b className="text-brand">{d._count.users}</b> membros
                </span>
                <span>
                  <b className="text-brand">{d._count.children}</b> sub-deptos
                </span>
              </div>
            </button>
          ))}
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
