'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL ?? '/api';

function authHeaders(): Record<string, string> {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user?: { fullName: string } | null;
}
interface Rating {
  id: string;
  score: number;
  comment: string | null;
  user?: { fullName: string } | null;
}
interface ItemDetail {
  id: string;
  code: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  type: string;
  fileUrl: string;
  author: string | null;
  publisher: string | null;
  year: number | null;
  language: string;
  pages: number | null;
  isbn: string | null;
  categories: string[];
  keywords: string[];
  views: number;
  downloads: number;
  rating: number;
  ratingCount: number;
  isApproved: boolean;
  collection?: { name: string } | null;
  uploadedBy?: { fullName: string } | null;
  comments: Comment[];
  ratings: Rating[];
  _count: { comments: number; ratings: number };
}

const TYPE_ICONS: Record<string, string> = {
  PDF: '📄', EBOOK: '📚', VIDEO: '🎬', AUDIO: '🎵',
  PRESENTATION: '📊', SPREADSHEET: '📈', DOCUMENT: '📝',
  IMAGE: '🖼️', LINK: '🔗', SCORM: '🎓', OTHER: '📦',
};

export default function LibraryItemPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [item, setItem] = useState<ItemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState('');
  const [newComment, setNewComment] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/library/items/${id}`, {
        credentials: 'include',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Erro ao carregar o recurso');
      setItem(await res.json());
      // Regista visualização (best-effort)
      void fetch(`${API}/library/items/${id}/view`, {
        method: 'POST',
        credentials: 'include',
        headers: authHeaders(),
      });
    } catch (e: any) {
      setError(e.message || 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchData();
  }, [id, fetchData]);

  async function download() {
    try {
      const res = await fetch(`${API}/library/items/${id}/download`, {
        method: 'POST',
        credentials: 'include',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Erro ao obter o ficheiro');
      const json = await res.json();
      if (json.fileUrl) window.open(json.fileUrl, '_blank');
    } catch (e: any) {
      alert(e.message || 'Erro inesperado');
    }
  }

  async function submitRating(e: React.FormEvent) {
    e.preventDefault();
    if (!score) {
      alert('Selecciona uma pontuação');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API}/library/items/${id}/rate`, {
        method: 'POST',
        credentials: 'include',
        headers: authHeaders(),
        body: JSON.stringify({ score, ...(comment && { comment }) }),
      });
      if (!res.ok) throw new Error('Erro ao avaliar');
      setScore(0);
      setComment('');
      await fetchData();
    } catch (e: any) {
      alert(e.message || 'Erro inesperado');
    } finally {
      setSaving(false);
    }
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/library/items/${id}/comments`, {
        method: 'POST',
        credentials: 'include',
        headers: authHeaders(),
        body: JSON.stringify({ content: newComment }),
      });
      if (!res.ok) throw new Error('Erro ao comentar');
      setNewComment('');
      await fetchData();
    } catch (e: any) {
      alert(e.message || 'Erro inesperado');
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return (
      <div className="p-6 space-y-4">
        <div className="h-32 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
      </div>
    );

  if (error || !item)
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          {error || 'Recurso não encontrado'}
          <button onClick={() => router.back()} className="ml-4 underline">
            Voltar
          </button>
        </div>
      </div>
    );

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
              <p className="text-xs font-mono text-blue-600 mt-1">{item.code}</p>
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

function Info({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <p className="text-xs text-gray-400 uppercase">{label}</p>
      <p className="text-sm text-gray-800">{value || '—'}</p>
    </div>
  );
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}
