// components/lms/LearningPathsView.tsx

import { CardGridSkeleton, ErrorBanner } from './shared';
import { LEVEL_COLORS } from './types';
import type { Path } from './types';

interface LearningPathsViewProps {
  data: Path[];
  total: number;
  totalPages: number;
  page: number;
  setPage: (updater: (p: number) => number) => void;
  search: string;
  onSearchChange: (value: string) => void;
  loading: boolean;
  error: string;
  onRetry: () => void;
  enroll: (pathId: string) => void;
}

export function LearningPathsView({
  data,
  total,
  totalPages,
  page,
  setPage,
  search,
  onSearchChange,
  loading,
  error,
  onRetry,
  enroll,
}: LearningPathsViewProps) {
  if (loading) return <CardGridSkeleton />;
  if (error) return <ErrorBanner message={error} onRetry={onRetry} />;

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
        onChange={(e) => onSearchChange(e.target.value)}
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
