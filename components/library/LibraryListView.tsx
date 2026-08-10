// components/library/LibraryListView.tsx

import Link from 'next/link';
import { GridSkeleton } from './shared';
import { TYPE_ICONS } from './types';
import type { Item } from './types';

interface LibraryListViewProps {
  data: Item[];
  total: number;
  totalPages: number;
  page: number;
  setPage: (updater: (p: number) => number) => void;
  search: string;
  onSearchChange: (value: string) => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  loading: boolean;
  error: string;
  onRetry: () => void;
}

export function LibraryListView({
  data,
  total,
  totalPages,
  page,
  setPage,
  search,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  loading,
  error,
  onRetry,
}: LibraryListViewProps) {
  if (loading) return <GridSkeleton />;

  if (error)
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex justify-between">
          <span>{error}</span>
          <button onClick={onRetry} className="underline">
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
          <h1 className="text-2xl font-bold text-gray-900">
            Biblioteca Digital
          </h1>
          <p className="text-gray-500">{total} recursos disponíveis</p>
        </div>
        <Link
          href="/library/novo"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + Adicionar Recurso
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex gap-4 flex-wrap">
        <input
          type="text"
          placeholder="Pesquisar por título, autor, palavra-chave..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="border rounded-lg px-4 py-2 flex-1 min-w-[200px]"
        />
        <select
          value={typeFilter}
          onChange={(e) => onTypeFilterChange(e.target.value)}
          className="border rounded-lg px-4 py-2"
        >
          <option value="">Todos os tipos</option>
          <option value="PDF">PDF</option>
          <option value="EBOOK">E-book</option>
          <option value="VIDEO">Vídeo</option>
          <option value="AUDIO">Áudio</option>
          <option value="PRESENTATION">Apresentação</option>
          <option value="DOCUMENT">Documento</option>
        </select>
      </div>

      {/* Grelha de cards */}
      {data.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          Nenhum recurso encontrado
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.map((item) => (
            <a
              key={item.id}
              href={`/library/${item.id}`}
              className="bg-white rounded-lg shadow hover:shadow-md transition p-4 flex flex-col"
            >
              <div className="text-4xl mb-3">
                {TYPE_ICONS[item.type] || '📦'}
              </div>
              <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">
                {item.title}
              </h3>
              {item.author && (
                <p className="text-sm text-gray-500 mb-2">{item.author}</p>
              )}
              <div className="mt-auto flex justify-between items-center text-xs text-gray-400 pt-3">
                <span>👁 {item.views}</span>
                <span>⬇ {item.downloads}</span>
                {item.rating > 0 && <span>⭐ {item.rating.toFixed(1)}</span>}
              </div>
            </a>
          ))}
        </div>
      )}

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
