'use client';
import { useState } from 'react';
import Link from 'next/link';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';

interface OverdueReport {
  id: string;
  title: string;
  period: string;
  dueDate: string;
  status: string;
  funder: { name: string; code: string; email: string | null } | null;
  grant: { title: string; code: string } | null;
}

// Mesma linguagem visual da página de detalhe do financiador.
const REPORT_COLORS: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-600',
  SUBMITTED: 'bg-blue-100 text-blue-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-700',
  OVERDUE: 'bg-orange-100 text-orange-800',
};

const MS_PER_DAY = 86_400_000;

function daysOverdue(dueDate: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(dueDate).getTime()) / MS_PER_DAY));
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('pt-AO');
}

export default function OverdueReportsPage() {
  const [page, setPage] = useState(1);
  const params = { page, limit: 20 };

  const { data: resp, isLoading: loading, error: queryError, refetch } =
    useApiQuery<{
      data: OverdueReport[];
      total: number;
      totalPages: number;
    }>(
      queryKeys.funders.overdueReports(params), '/crm/funders/overdue-reports',
      { params, staleTime: STALE_TIME.DYNAMIC, placeholderData: keepPreviousData },
    );

  const data = resp?.data ?? [];
  const total = resp?.total ?? 0;
  const totalPages = resp?.totalPages ?? 1;
  const error = queryError?.message ?? '';

  if (loading)
    return (
      <div className="p-6 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );

  if (error)
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex justify-between">
          <span>{error}</span>
          <button onClick={() => refetch()} className="underline">
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
          <h1 className="text-2xl font-bold text-gray-900">Relatórios em Atraso</h1>
          <p className="text-gray-500">
            {total} {total === 1 ? 'relatório por entregar' : 'relatórios por entregar'}
          </p>
        </div>
        <Link
          href="/crm/funders"
          className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-gray-700"
        >
          ← Financiadores
        </Link>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left">Relatório</th>
              <th className="px-4 py-3 text-left">Financiador</th>
              <th className="px-4 py-3 text-left">Grant</th>
              <th className="px-4 py-3 text-left">Período</th>
              <th className="px-4 py-3 text-left">Prazo</th>
              <th className="px-4 py-3 text-center">Atraso</th>
              <th className="px-4 py-3 text-left">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  Nenhum relatório em atraso 🎉
                </td>
              </tr>
            ) : (
              data.map((r) => {
                const dias = daysOverdue(r.dueDate);
                return (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{r.title}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {r.funder ? (
                        <>
                          <span className="font-mono text-blue-600 mr-1">
                            {r.funder.code}
                          </span>
                          {r.funder.name}
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {r.grant ? (
                        <>
                          <span className="font-mono text-gray-500 mr-1">
                            {r.grant.code}
                          </span>
                          {r.grant.title}
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{r.period}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(r.dueDate)}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`font-medium ${
                          dias > 30 ? 'text-red-600' : 'text-orange-600'
                        }`}
                      >
                        {dias} {dias === 1 ? 'dia' : 'dias'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          REPORT_COLORS[r.status] ?? 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                  </tr>
                );
              })
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
