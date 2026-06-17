'use client';
import { useState } from 'react';
import Link from 'next/link';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '../../../../hooks/useApiQuery';
import { useDebounce } from '../../../../hooks/useDebounce';
import { queryKeys } from '../../../../lib/queryKeys';
import { STALE_TIME } from '../../../../lib/queryClient';

interface Beneficiary {
  id: string;
  code: string;
  fullName: string;
  type: string;
  status: string;
  province: string | null;
  email: string | null;
  phone: string | null;
  nextFollowUpAt: string | null;
  assignedTo?: { fullName: string } | null;
  _count: { interactions: number };
}

interface BeneficiaryList {
  data: Beneficiary[];
  total: number;
  totalPages: number;
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-gray-100 text-gray-600',
  PROSPECT: 'bg-blue-100 text-blue-800',
  FORMER: 'bg-yellow-100 text-yellow-800',
  BLOCKED: 'bg-red-100 text-red-800',
};

export default function BeneficiariesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Pesquisa com debounce: 1 pedido depois de parar de escrever, não 1 por tecla.
  const debouncedSearch = useDebounce(search);

  // params enxutos — o apiClient omite os vazios (optimização de payload).
  const params = {
    page,
    limit: 20,
    search: debouncedSearch,
    status: statusFilter,
    type: typeFilter,
  };

  const { data, isLoading, isFetching, isError, error, refetch } =
    useApiQuery<BeneficiaryList>(
      queryKeys.beneficiaries.list(params),
      '/crm/beneficiaries',
      {
        params,
        staleTime: STALE_TIME.DYNAMIC,
        // Mantém a página anterior visível enquanto a próxima carrega (sem flash).
        placeholderData: keepPreviousData,
      },
    );

  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const rows = data?.data ?? [];

  function onFilterChange(setter: (v: string) => void, value: string) {
    setter(value);
    setPage(1);
  }

  // Loading inicial (sem dados em cache).
  if (isLoading)
    return (
      <div className="p-6 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );

  if (isError)
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          {error?.message || 'Erro ao carregar beneficiários'}
          <button onClick={() => refetch()} className="ml-4 underline">
            Tentar novamente
          </button>
        </div>
      </div>
    );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Beneficiários</h1>
          <p className="text-gray-500">{total} beneficiários registados</p>
        </div>
        <Link
          href="/crm/beneficiaries/novo"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + Novo Beneficiário
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex gap-4 flex-wrap items-center">
        <input
          type="text"
          placeholder="Pesquisar por nome, email, código..."
          value={search}
          onChange={(e) => onFilterChange(setSearch, e.target.value)}
          className="border rounded-lg px-4 py-2 flex-1 min-w-[200px]"
        />
        <select
          value={statusFilter}
          onChange={(e) => onFilterChange(setStatusFilter, e.target.value)}
          className="border rounded-lg px-4 py-2"
        >
          <option value="">Todos os estados</option>
          <option value="ACTIVE">Activo</option>
          <option value="PROSPECT">Prospecto</option>
          <option value="INACTIVE">Inactivo</option>
          <option value="FORMER">Ex-beneficiário</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => onFilterChange(setTypeFilter, e.target.value)}
          className="border rounded-lg px-4 py-2"
        >
          <option value="">Todos os tipos</option>
          <option value="INDIVIDUAL">Individual</option>
          <option value="FAMILY">Família</option>
          <option value="INSTITUTION">Instituição</option>
          <option value="COMMUNITY">Comunidade</option>
          <option value="GROUP">Grupo</option>
        </select>
        {/* Indicador discreto de refetch em fundo (paginação/filtros). */}
        {isFetching && (
          <span className="text-xs text-gray-400 animate-pulse">A actualizar…</span>
        )}
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left">Código</th>
              <th className="px-4 py-3 text-left">Nome</th>
              <th className="px-4 py-3 text-left">Tipo</th>
              <th className="px-4 py-3 text-left">Província</th>
              <th className="px-4 py-3 text-left">Estado</th>
              <th className="px-4 py-3 text-left">Interacções</th>
              <th className="px-4 py-3 text-left">Responsável</th>
              <th className="px-4 py-3 text-left">Acções</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                  Nenhum beneficiário encontrado
                </td>
              </tr>
            ) : (
              rows.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-blue-600">{b.code}</td>
                  <td className="px-4 py-3 font-medium">{b.fullName}</td>
                  <td className="px-4 py-3 text-gray-600">{b.type}</td>
                  <td className="px-4 py-3 text-gray-600">{b.province || '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        STATUS_COLORS[b.status] ?? 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {b._count.interactions}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {b.assignedTo?.fullName || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={`/crm/beneficiaries/${b.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      Ver
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <span className="text-gray-500">
            Página {page} de {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border rounded-lg disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border rounded-lg disabled:opacity-50"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
