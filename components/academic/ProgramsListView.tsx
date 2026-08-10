// components/academic/ProgramsListView.tsx

import { CardGridSkeleton } from './shared';
import { LEVEL_COLORS } from './types';
import type { Program } from './types';

interface ProgramsListViewProps {
  data: Program[];
  total: number;
  totalPages: number;
  page: number;
  setPage: (updater: (p: number) => number) => void;
  search: string;
  onSearchChange: (value: string) => void;
  levelFilter: string;
  onLevelFilterChange: (value: string) => void;
  loading: boolean;
  error: string;
  onRetry: () => void;
}

export function ProgramsListView({
  data,
  total,
  totalPages,
  page,
  setPage,
  search,
  onSearchChange,
  levelFilter,
  onLevelFilterChange,
  loading,
  error,
  onRetry,
}: ProgramsListViewProps) {
  if (loading) return <CardGridSkeleton />;

  if (error)
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          {error}
          <button onClick={onRetry} className="ml-4 underline">
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
            Programas Académicos
          </h1>
          <p className="text-gray-500">{total} programas disponíveis</p>
        </div>
        <a
          href="/academic/transcript"
          className="px-4 py-2 border rounded-lg hover:bg-gray-50"
        >
          A minha transcrição
        </a>
      </div>

      <div className="flex gap-4 flex-wrap">
        <input
          type="text"
          placeholder="Pesquisar por nome ou código..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="border rounded-lg px-4 py-2 flex-1 min-w-[200px]"
        />
        <select
          value={levelFilter}
          onChange={(e) => onLevelFilterChange(e.target.value)}
          className="border rounded-lg px-4 py-2"
        >
          <option value="">Todos os níveis</option>
          <option value="BASIC">Básico</option>
          <option value="INTERMEDIATE">Intermédio</option>
          <option value="ADVANCED">Avançado</option>
          <option value="EXPERT">Especialista</option>
        </select>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          Nenhum programa encontrado
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.map((p) => (
            <a
              key={p.id}
              href={`/academic/programs/${p.id}`}
              className="bg-white rounded-lg shadow hover:shadow-md transition p-5 flex flex-col"
            >
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
                {p.description || 'Sem descrição'}
              </p>
              <div className="mt-auto flex justify-between text-xs text-gray-400 pt-3 border-t">
                <span>{p.durationHours}h</span>
                <span>{p._count?.enrollments || 0} alunos</span>
                <span>{p._count?.classes || 0} turmas</span>
              </div>
            </a>
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
