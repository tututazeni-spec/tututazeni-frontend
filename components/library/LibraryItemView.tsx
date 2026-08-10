// components/library/LibraryItemView.tsx

import { useRouter } from 'next/navigation';
import { formatDate } from '@/lib/format';
import { Info } from './shared';
import { TYPE_ICONS } from './types';
import type { ItemDetail } from './types';

interface LibraryItemViewProps {
  item: ItemDetail;
  score: number;
  setScore: (score: number) => void;
  comment: string;
  setComment: (comment: string) => void;
  newComment: string;
  setNewComment: (comment: string) => void;
  download: () => void;
  submitRating: (e: React.FormEvent) => void;
  submitComment: (e: React.FormEvent) => void;
  saving: boolean;
}

export function LibraryItemView({
  item,
  score,
  setScore,
  comment,
  setComment,
  newComment,
  setNewComment,
  download,
  submitRating,
  submitComment,
  saving,
}: LibraryItemViewProps) {
  const router = useRouter();

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <button
        onClick={() => router.push('/library')}
        className="text-sm text-blue-600 hover:underline"
      >
        ← Voltar à biblioteca
      </button>

      {/* Cabeçalho */}
      <div className="bg-white rounded-lg shadow p-6 flex gap-6">
        <div className="text-6xl">{TYPE_ICONS[item.type] || '📦'}</div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{item.title}</h1>
              {item.subtitle && (
                <p className="text-gray-500">{item.subtitle}</p>
              )}
              <p className="text-xs font-mono text-blue-600 mt-1">
                {item.code}
              </p>
            </div>
            {!item.isApproved && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Por aprovar
              </span>
            )}
          </div>
          <div className="flex gap-4 mt-3 text-sm text-gray-500">
            <span>👁 {item.views} visualizações</span>
            <span>⬇ {item.downloads} downloads</span>
            {item.rating > 0 && (
              <span>
                ⭐ {item.rating.toFixed(1)} ({item.ratingCount})
              </span>
            )}
          </div>
          <button
            onClick={download}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            ⬇ Descarregar
          </button>
        </div>
      </div>

      {/* Metadados */}
      <div className="bg-white rounded-lg shadow p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Info label="Autor" value={item.author} />
        <Info label="Editora" value={item.publisher} />
        <Info label="Ano" value={item.year ? String(item.year) : null} />
        <Info label="Idioma" value={item.language} />
        <Info label="Páginas" value={item.pages ? String(item.pages) : null} />
        <Info label="ISBN" value={item.isbn} />
        <Info label="Colecção" value={item.collection?.name} />
        <Info label="Carregado por" value={item.uploadedBy?.fullName} />
        <Info
          label="Categorias"
          value={item.categories?.length ? item.categories.join(', ') : null}
        />
      </div>

      {item.description && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-2">
            Descrição
          </h2>
          <p className="text-gray-700 whitespace-pre-line">
            {item.description}
          </p>
        </div>
      )}

      {/* Avaliar */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Avaliar</h2>
        <form
          onSubmit={submitRating}
          className="bg-white rounded-lg shadow p-4 space-y-3"
        >
          <div className="flex gap-1 text-2xl">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setScore(n)}
                className={n <= score ? 'text-yellow-400' : 'text-gray-300'}
              >
                ★
              </button>
            ))}
          </div>
          <input
            placeholder="Comentário (opcional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'A guardar...' : 'Submeter avaliação'}
          </button>
        </form>
      </section>

      {/* Comentários */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Comentários ({item._count.comments})
        </h2>
        <form onSubmit={submitComment} className="flex gap-2 mb-4">
          <input
            placeholder="Escreve um comentário..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="border rounded-lg px-3 py-2 flex-1"
          />
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Comentar
          </button>
        </form>
        <div className="bg-white rounded-lg shadow divide-y divide-gray-100">
          {item.comments.length === 0 ? (
            <p className="p-4 text-gray-400">Ainda sem comentários</p>
          ) : (
            item.comments.map((c) => (
              <div key={c.id} className="p-4">
                <div className="flex justify-between">
                  <span className="font-medium text-sm">
                    {c.user?.fullName || 'Utilizador'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatDate(c.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{c.content}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
