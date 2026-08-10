// components/crm/beneficiaries/BeneficiariesListView.tsx

import Link from 'next/link';
import { ListSkeleton } from '@/components/crm/shared';
import { STATUS_COLORS } from './types';
import type { Beneficiary } from './types';

interface BeneficiariesListViewProps {
  rows: Beneficiary[];
  total: number;
  totalPages: number;
  page: number;
  setPage: (updater: (p: number) => number) => void;
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  errorMessage: string;
  onRetry: () => void;
}

export function BeneficiariesListView({
  rows,
  total,
  totalPages,
  page,
  setPage,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  typeFilter,
  onTypeFilterChange,
  isLoading,
  isFetching,
  isError,
  errorMessage,
  onRetry,
}: BeneficiariesListViewProps) {
  // Loading inicial (sem dados em cache).
  if (isLoading) return <ListSkeleton />;

  if (isError)
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          {errorMessage}
          <button onClick={onRetry} className="ml-4 underline">
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
          onChange={(e) => onSearchChange(e.target.value)}
          className="border rounded-lg px-4 py-2 flex-1 min-w-[200px]"
        />
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
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
          onChange={(e) => onTypeFilterChange(e.target.value)}
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
          <span className="text-xs text-gray-400 animate-pulse">
            A actualizar…
          </span>
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
                  <td className="px-4 py-3 font-mono text-blue-600">
                    {b.code}
                  </td>
                  <td className="px-4 py-3 font-medium">{b.fullName}</td>
                  <td className="px-4 py-3 text-gray-600">{b.type}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {b.province || '—'}
                  </td>
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
