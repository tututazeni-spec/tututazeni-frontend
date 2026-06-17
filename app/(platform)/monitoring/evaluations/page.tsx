'use client';
import { useState, useEffect, useCallback } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? '/api';

function authHeaders(): Record<string, string> {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

interface MyEvaluation {
  id: string;
  type: string;
  status: string;
  finalScore: number | null;
  cycle?: { name: string; type: string } | null;
  evaluator?: { fullName: string } | null;
}
interface ToComplete {
  id: string;
  type: string;
  status: string;
  user?: { fullName: string } | null;
  cycle?: { name: string } | null;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-600',
  OPEN: 'bg-blue-100 text-blue-800',
  CLOSED: 'bg-green-100 text-green-800',
};

export default function EvaluationsPage() {
  const [mine, setMine] = useState<MyEvaluation[]>([]);
  const [toComplete, setToComplete] = useState<ToComplete[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const opts = { credentials: 'include' as const, headers: authHeaders() };
      const [mineRes, todoRes] = await Promise.all([
        fetch(`${API}/monitoring/evaluation/my-evaluations`, opts),
        fetch(`${API}/monitoring/evaluation/to-complete`, opts),
      ]);
      if (!mineRes.ok) throw new Error('Erro ao carregar avaliações');
      setMine(await mineRes.json());
      if (todoRes.ok) setToComplete(await todoRes.json());
    } catch (e: any) {
      setError(e.message || 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function submit(id: string) {
    const scoreStr = window.prompt('Pontuação (0-100):');
    if (!scoreStr) return;
    const score = Number(scoreStr);
    if (isNaN(score) || score < 0 || score > 100) {
      alert('Pontuação inválida');
      return;
    }
    const feedback = window.prompt('Feedback (opcional):') || undefined;
    setSubmittingId(id);
    try {
      const res = await fetch(`${API}/monitoring/evaluation/${id}/submit`, {
        method: 'PUT',
        credentials: 'include',
        headers: authHeaders(),
        body: JSON.stringify({ score, ...(feedback && { feedback }) }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({ message: 'Erro' }));
        throw new Error(
          Array.isArray(j.message) ? j.message.join(', ') : j.message,
        );
      }
      await fetchData();
    } catch (e: any) {
      alert(e.message || 'Erro inesperado');
    } finally {
      setSubmittingId(null);
    }
  }

  if (loading)
    return (
      <div className="p-6 space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
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
    <div className="p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Avaliação de Desempenho
        </h1>
        <a
          href="/monitoring/okrs"
          className="text-sm text-blue-600 hover:underline"
        >
          ← OKRs
        </a>
      </div>

      {/* A completar */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Avaliações a Completar ({toComplete.length})
        </h2>
        <div className="bg-white rounded-lg shadow divide-y divide-gray-100">
          {toComplete.length === 0 ? (
            <p className="p-4 text-gray-400">Nada pendente.</p>
          ) : (
            toComplete.map((e) => (
              <div
                key={e.id}
                className="p-4 flex justify-between items-center"
              >
                <div>
                  <p className="font-medium">
                    {e.user?.fullName || 'Colaborador'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {e.cycle?.name} · {e.type}
                  </p>
                </div>
                <button
                  onClick={() => submit(e.id)}
                  disabled={submittingId === e.id}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50"
                >
                  {submittingId === e.id ? 'A submeter...' : 'Avaliar'}
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      {/* As minhas */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          As Minhas Avaliações ({mine.length})
        </h2>
        <div className="bg-white rounded-lg shadow divide-y divide-gray-100">
          {mine.length === 0 ? (
            <p className="p-4 text-gray-400">Ainda sem avaliações.</p>
          ) : (
            mine.map((e) => (
              <div
                key={e.id}
                className="p-4 flex justify-between items-center"
              >
                <div>
                  <p className="font-medium">{e.cycle?.name}</p>
                  <p className="text-xs text-gray-500">
                    {e.type} · Avaliador: {e.evaluator?.fullName || '—'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {e.finalScore != null && (
                    <span className="text-sm font-bold text-gray-700">
                      {e.finalScore}%
                    </span>
                  )}
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      STATUS_COLORS[e.status] ?? 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {e.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
