'use client';
import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';

interface Indicator {
  id: string;
  code: string;
  name: string;
  unit: string | null;
  baseline: number | null;
  target: number | null;
  frequency: string;
  category: string | null;
  _count?: { records: number };
}

export default function IndicatorsPage() {
  const [page, setPage] = useState(1);
  const params = { page, limit: 20 };

  const { data: resp, isLoading: loading, error: queryError, refetch } =
    useApiQuery<{ data: Indicator[]; total: number; totalPages: number }>(
      queryKeys.monitoring.indicators(params), '/monitoring/indicators',
      { params, staleTime: STALE_TIME.DYNAMIC, placeholderData: keepPreviousData },
    );

  const data = resp?.data ?? [];
  const total = resp?.total ?? 0;
  const totalPages = resp?.totalPages ?? 1;
  const error = queryError?.message ?? '';
  const fetchData = () => refetch();

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
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          {error}
          <button onClick={fetchData} className="ml-4 underline">
            Tentar novamente
          </button>
        </div>
      </div>
    );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Indicadores de Monitoria
          </h1>
          <p className="text-gray-500">{total} indicadores activos</p>
        </div>
        <a
          href="/monitoring/okrs"
          className="text-sm text-blue-600 hover:underline"
        >
          ← OKRs
        </a>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left">Código</th>
              <th className="px-4 py-3 text-left">Indicador</th>
              <th className="px-4 py-3 text-left">Categoria</th>
              <th className="px-4 py-3 text-right">Baseline</th>
              <th className="px-4 py-3 text-right">Meta</th>
              <th className="px-4 py-3 text-left">Frequência</th>
              <th className="px-4 py-3 text-center">Registos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  Nenhum indicador encontrado
                </td>
              </tr>
            ) : (
              data.map((ind) => (
                <tr key={ind.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-blue-600">
                    {ind.code}
                  </td>
                  <td className="px-4 py-3 font-medium">{ind.name}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {ind.category || '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {ind.baseline != null ? `${ind.baseline}${ind.unit || ''}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700 font-medium">
                    {ind.target != null ? `${ind.target}${ind.unit || ''}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{ind.frequency}</td>
                  <td className="px-4 py-3 text-center text-gray-600">
                    {ind._count?.records ?? 0}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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
