'use client';
import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';

interface Path {
  id: string;
  code: string;
  name: string;
  description: string | null;
  level: string;
  estimatedHours: number | null;
  _count?: { enrollments: number };
}

const LEVEL_COLORS: Record<string, string> = {
  BASIC: 'bg-green-100 text-green-800',
  INTERMEDIATE: 'bg-blue-100 text-blue-800',
  ADVANCED: 'bg-purple-100 text-purple-800',
  EXPERT: 'bg-red-100 text-red-800',
};

export default function LearningPathsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const params = { page, limit: 20, search: debouncedSearch };

  const { data: resp, isLoading: loading, error: queryError, refetch } =
    useApiQuery<{ data: Path[]; total: number; totalPages: number }>(
      queryKeys.lms.paths(params), '/lms/paths',
      { params, staleTime: STALE_TIME.SEMI_STATIC, placeholderData: keepPreviousData },
    );

  const data = resp?.data ?? [];
  const total = resp?.total ?? 0;
  const totalPages = resp?.totalPages ?? 1;
  const error = queryError?.message ?? '';
  const fetchData = () => refetch();

  const enrollMut = useApiMutation(
    (pathId: string) => apiClient.post(`/lms/paths/${pathId}/enroll`, {}),
    {
      invalidateKeys: [queryKeys.lms.all],
      onSuccess: () => alert('Inscrição realizada com sucesso!'),
      onError: (e) => alert(e.message || 'Erro ao inscrever'),
    },
  );
  const enroll = (pathId: string) => enrollMut.mutate(pathId);

  if (loading)
    return (
      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-48 bg-gray-100 rounded-lg animate-pulse" />
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
            Percursos de Aprendizagem
          </h1>
          <p className="text-gray-500">{total} percursos disponíveis</p>
        </div>
        <div className="flex gap-2">
          <a
            href="/lms/sessions"
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Sessões ao Vivo
          </a>
          <a
            href="/lms/my-paths"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Os Meus Percursos
          </a>
        </div>
      </div>

      <input
        type="text"
        placeholder="Pesquisar percursos..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
        className="border rounded-lg px-4 py-2 w-full max-w-md"
      />

      {data.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          Nenhum percurso encontrado
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-lg shadow hover:shadow-md transition overflow-hidden flex flex-col"
            >
              <div className="h-32 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl">
                🎓
              </div>
              <div className="p-5 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-mono text-xs text-blue-600">
                    {p.code}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      LEVEL_COLORS[p.level] ?? 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {p.level}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{p.name}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                  {p.description || ''}
                </p>
                <div className="mt-auto flex justify-between items-center text-xs text-gray-400 mb-3">
                  <span>{p.estimatedHours || '—'}h</span>
                  <span>{p._count?.enrollments || 0} inscritos</span>
                </div>
                <button
                  onClick={() => enroll(p.id)}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-sm"
                >
                  Inscrever-me
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

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
