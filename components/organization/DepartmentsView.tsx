// components/organization/DepartmentsView.tsx
// Vista "Departamentos": lista pesquisável + painel de detalhe.
// Extraído de app/(platform)/organization/page.tsx.

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { Building2, MapPin, FolderTree } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatKz as fmtKz } from '@/lib/format';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Department, DepartmentDetail } from './types';

export function DepartmentsView() {
  const [search, setSearch] = useState('');

  const debouncedSearch = useDebounce(search, 300);
  const params = {
    limit: 50,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  };
  const { data, isLoading: loading } = useApiQuery<{
    data: Department[];
    total: number;
  }>(
    queryKeys.organization.departments(debouncedSearch),
    '/organization/departments',
    {
      params,
      staleTime: STALE_TIME.SEMI_STATIC,
      placeholderData: keepPreviousData,
    },
  );

  const detailMutation = useApiMutation((id: number) =>
    apiClient.get<DepartmentDetail>(`/organization/departments/${id}`),
  );
  const selected = detailMutation.data ?? null;
  const loadingDetail = detailMutation.isPending;
  const loadDetail = (id: number) => detailMutation.mutate(id);

  return (
    <div className="grid grid-cols-[1fr_320px] gap-5">
      {/* List */}
      <div>
        <div className="mb-4">
          <Input
            type="text"
            placeholder="Pesquisar departamentos…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-sm"
          />
        </div>

        {loading ? (
          <Skeleton />
        ) : (
          <div className="space-y-2">
            {data?.data.map((dept) => (
              <Card
                key={dept.id}
                onClick={() => loadDetail(dept.id)}
                className={`flex cursor-pointer items-center gap-4 p-4 transition-shadow hover:shadow-hover ${
                  selected?.id === dept.id
                    ? 'border-primary bg-primary-subtle'
                    : ''
                }`}
              >
                {dept.color ? (
                  <div
                    className="h-10 w-10 flex-shrink-0 rounded-card"
                    style={{ background: dept.color }}
                  />
                ) : (
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-card bg-surface-sunken font-body text-sm font-bold text-ink-faint">
                    {dept.code.slice(0, 2)}
                  </div>
                )}
                <div className="flex-1">
                  <div className="font-body text-sm font-semibold text-ink">
                    {dept.name}
                  </div>
                  <div className="flex items-center gap-3 font-body text-xs text-ink-faint">
                    <span>Código: {dept.code}</span>
                    {dept.parent && <span>↑ {dept.parent.name}</span>}
                    {dept.unit && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={12} strokeWidth={1.75} /> {dept.unit.name}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <div className="font-mono font-body text-sm font-medium text-ink">
                    {dept._count.users}
                  </div>
                  <div className="font-body text-xs text-ink-faint">
                    pessoas
                  </div>
                </div>
                {dept._count.children > 0 && (
                  <div className="flex-shrink-0 font-body text-xs text-ink-faint">
                    <FolderTree
                      size={12}
                      strokeWidth={1.75}
                      className="inline align-[-2px]"
                    />{' '}
                    {dept._count.children}
                  </div>
                )}
                <div
                  className={`h-2 w-2 flex-shrink-0 rounded-full ${dept.status === 'ACTIVE' ? 'bg-success' : 'bg-border-strong'}`}
                />
              </Card>
            ))}
            {data?.data.length === 0 && (
              <EmptyState
                icon={Building2}
                title="Sem departamentos"
                description="Ainda não existem departamentos registados."
              />
            )}
          </div>
        )}
      </div>

      {/* Detail panel */}
      <div>
        {!selected && !loadingDetail && (
          <div className="flex h-48 items-center justify-center rounded-card border border-dashed border-border-strong font-body text-sm text-ink-faint">
            Seleccione um departamento
          </div>
        )}
        {loadingDetail && <Skeleton rows={4} />}
        {selected && !loadingDetail && (
          <Card className="overflow-hidden">
            <div className="border-b border-border p-4">
              <div className="mb-3 flex items-center gap-3">
                {selected.color ? (
                  <div
                    className="h-10 w-10 flex-shrink-0 rounded-card"
                    style={{ background: selected.color }}
                  />
                ) : (
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-card bg-surface-sunken font-body text-sm font-bold text-ink-faint">
                    {selected.code.slice(0, 2)}
                  </div>
                )}
                <div>
                  <div className="font-body text-sm font-semibold text-ink">
                    {selected.name}
                  </div>
                  <div className="font-body text-xs text-ink-faint">
                    {selected.code}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 font-body text-xs">
                {[
                  ['Colaboradores', selected._count.users],
                  ['Sub-depts', selected._count.children],
                  ['Centro custo', selected.costCenter ?? '—'],
                  [
                    'Orçamento',
                    selected.annualBudget ? fmtKz(selected.annualBudget) : '—',
                  ],
                ].map(([l, v]) => (
                  <div
                    key={String(l)}
                    className="rounded-control bg-surface-sunken p-2"
                  >
                    <div className="text-ink-faint">{l}</div>
                    <div className="font-medium text-ink">{v}</div>
                  </div>
                ))}
              </div>
            </div>

            {selected.head && (
              <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                <Avatar
                  name={selected.head.fullName}
                  url={selected.head.avatarUrl ?? undefined}
                  size="sm"
                />
                <div>
                  <div className="font-body text-xs text-ink-faint">
                    Responsável
                  </div>
                  <div className="font-body text-xs font-medium text-ink">
                    {selected.head.fullName}
                  </div>
                </div>
              </div>
            )}

            <div className="max-h-64 overflow-y-auto">
              {selected.users?.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-2 border-b border-border px-4 py-2.5 last:border-0 hover:bg-surface-sunken"
                >
                  <Avatar
                    name={u.fullName}
                    url={u.avatarUrl ?? undefined}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-body text-xs font-medium text-ink">
                      {u.fullName}
                    </div>
                    <div className="truncate font-body text-xs text-ink-faint">
                      {u.position?.name}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
