// components/organization/DepartmentsView.tsx
// Vista "Departamentos": lista pesquisável + painel de detalhe.
// Extraído de app/(platform)/organization/page.tsx.

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatKz as fmtKz } from '@/lib/format';
import { Avatar, Skeleton } from './atoms';
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
          <input
            type="text"
            placeholder="Pesquisar departamentos…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-sm"
          />
        </div>

        {loading ? (
          <Skeleton />
        ) : (
          <div className="space-y-2">
            {data?.data.map((dept) => (
              <div
                key={dept.id}
                onClick={() => loadDetail(dept.id)}
                className={`flex items-center gap-4 bg-white border rounded-xl p-4 cursor-pointer transition-all hover:shadow-sm ${
                  selected?.id === dept.id
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-gray-200'
                }`}
              >
                {dept.color ? (
                  <div
                    className="w-10 h-10 rounded-xl flex-shrink-0"
                    style={{ background: dept.color }}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex-shrink-0 flex items-center justify-center text-sm font-bold text-gray-400">
                    {dept.code.slice(0, 2)}
                  </div>
                )}
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-900">
                    {dept.name}
                  </div>
                  <div className="text-xs text-gray-400 flex items-center gap-3">
                    <span>Código: {dept.code}</span>
                    {dept.parent && <span>↑ {dept.parent.name}</span>}
                    {dept.unit && <span>📍 {dept.unit.name}</span>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-mono font-medium text-gray-900">
                    {dept._count.users}
                  </div>
                  <div className="text-xs text-gray-400">pessoas</div>
                </div>
                {dept._count.children > 0 && (
                  <div className="text-xs text-gray-400 flex-shrink-0">
                    📂 {dept._count.children}
                  </div>
                )}
                <div
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${dept.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-gray-300'}`}
                />
              </div>
            ))}
            {data?.data.length === 0 && (
              <div className="py-12 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
                Sem departamentos
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail panel */}
      <div>
        {!selected && !loadingDetail && (
          <div className="h-48 flex items-center justify-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
            Seleccione um departamento
          </div>
        )}
        {loadingDetail && <Skeleton rows={4} />}
        {selected && !loadingDetail && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                {selected.color ? (
                  <div
                    className="w-10 h-10 rounded-xl flex-shrink-0"
                    style={{ background: selected.color }}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex-shrink-0 flex items-center justify-center text-sm font-bold text-gray-400">
                    {selected.code.slice(0, 2)}
                  </div>
                )}
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    {selected.name}
                  </div>
                  <div className="text-xs text-gray-400">{selected.code}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  ['Colaboradores', selected._count.users],
                  ['Sub-depts', selected._count.children],
                  ['Centro custo', selected.costCenter ?? '—'],
                  [
                    'Orçamento',
                    selected.annualBudget ? fmtKz(selected.annualBudget) : '—',
                  ],
                ].map(([l, v]) => (
                  <div key={String(l)} className="bg-gray-50 rounded-lg p-2">
                    <div className="text-gray-400">{l}</div>
                    <div className="font-medium text-gray-900">{v}</div>
                  </div>
                ))}
              </div>
            </div>

            {selected.head && (
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                <Avatar
                  name={selected.head.fullName}
                  avatarUrl={selected.head.avatarUrl}
                  size="sm"
                />
                <div>
                  <div className="text-xs text-gray-400">Responsável</div>
                  <div className="text-xs font-medium text-gray-900">
                    {selected.head.fullName}
                  </div>
                </div>
              </div>
            )}

            <div className="max-h-64 overflow-y-auto">
              {selected.users?.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 last:border-0 hover:bg-gray-50"
                >
                  <Avatar name={u.fullName} avatarUrl={u.avatarUrl} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-900 truncate">
                      {u.fullName}
                    </div>
                    <div className="text-xs text-gray-400 truncate">
                      {u.position?.name}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
