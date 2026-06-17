'use client';
import { useState } from 'react';
import Link from 'next/link';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';

interface Item {
  id: string;
  code: string;
  title: string;
  type: string;
  author: string | null;
  views: number;
  downloads: number;
  rating: number;
}

const TYPE_ICONS: Record<string, string> = {
  PDF: '📄',
  EBOOK: '📚',
  VIDEO: '🎬',
  AUDIO: '🎵',
  PRESENTATION: '📊',
  SPREADSHEET: '📈',
  DOCUMENT: '📝',
  IMAGE: '🖼️',
  LINK: '🔗',
  SCORM: '🎓',
  OTHER: '📦',
};

export default function LibraryPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const debouncedSearch = useDebounce(search);
  const params = { page, limit: 20, search: debouncedSearch, type: typeFilter };

  const { data: resp, isLoading: loading, error: queryError, refetch } =
    useApiQuery<{ data: Item[]; total: number; totalPages: number }>(
      queryKeys.library.items(params), '/library/items',
      { params, staleTime: STALE_TIME.SEMI_STATIC, placeholderData: keepPreviousData },
    );

  const data = resp?.data ?? [];
  const total = resp?.total ?? 0;
  const totalPages = resp?.totalPages ?? 1;
  const error = queryError?.message ?? '';
  const fetchData = () => refetch();

  if (loading)
    return (
      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-48 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );

  if (error)
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex justify-between">
          <span>{error}</span>
          <button onClick={fetchData} className="underline">
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
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="border rounded-lg px-4 py-2 flex-1 min-w-[200px]"
        />
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
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
