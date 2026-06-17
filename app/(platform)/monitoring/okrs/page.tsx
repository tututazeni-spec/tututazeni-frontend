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

interface KeyResult {
  id: string;
  title: string;
  currentValue: number;
  targetValue: number;
  unit: string | null;
  progress: number;
  status: string;
}
interface Objective {
  id: string;
  title: string;
  type: string;
  progress: number;
  owner?: { fullName: string } | null;
  keyResults?: KeyResult[];
}
interface Cycle {
  id: string;
  name: string;
}

const STATUS_COLORS: Record<string, string> = {
  ON_TRACK: 'bg-green-100 text-green-800',
  AT_RISK: 'bg-yellow-100 text-yellow-800',
  OFF_TRACK: 'bg-red-100 text-red-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
};

export default function OkrsPage() {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<string>('');
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCycles = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/monitoring/okr/cycles`, {
        credentials: 'include',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Erro ao carregar ciclos');
      const json = await res.json();
      setCycles(json);
      if (json.length > 0) setSelectedCycle(json[0].id);
    } catch (e: any) {
      setError(e.message || 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchObjectives = useCallback(async (cycleId: string) => {
    try {
      const res = await fetch(
        `${API}/monitoring/okr/cycles/${cycleId}/objectives`,
        { credentials: 'include', headers: authHeaders() },
      );
      if (res.ok) setObjectives(await res.json());
    } catch {
      /* silencioso */
    }
  }, []);

  useEffect(() => {
    fetchCycles();
  }, [fetchCycles]);
  useEffect(() => {
    if (selectedCycle) fetchObjectives(selectedCycle);
  }, [selectedCycle, fetchObjectives]);

  if (loading)
    return (
      <div className="p-6 space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );

  if (error)
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          {error}
          <button onClick={fetchCycles} className="ml-4 underline">
            Tentar novamente
          </button>
        </div>
      </div>
    );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          OKRs — Objectivos e Resultados-Chave
        </h1>
        <div className="flex gap-2">
          <a
            href="/monitoring/indicators"
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Indicadores
          </a>
          <a
            href="/monitoring/evaluations"
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Avaliações
          </a>
        </div>
      </div>

      {cycles.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          Nenhum ciclo OKR criado
        </div>
      ) : (
        <>
          <select
            value={selectedCycle}
            onChange={(e) => setSelectedCycle(e.target.value)}
            className="border rounded-lg px-4 py-2"
          >
            {cycles.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {objectives.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              Nenhum objectivo neste ciclo
            </div>
          ) : (
            <div className="space-y-4">
              {objectives.map((obj) => (
                <div key={obj.id} className="bg-white rounded-lg shadow p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-xs text-gray-400 uppercase">
                        {obj.type}
                      </span>
                      <h3 className="font-semibold text-gray-900">
                        {obj.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {obj.owner?.fullName}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-blue-600">
                        {Math.round(obj.progress)}%
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${Math.min(100, obj.progress)}%` }}
                    />
                  </div>

                  <div className="space-y-2">
                    {obj.keyResults?.map((kr) => (
                      <div
                        key={kr.id}
                        className="flex justify-between items-center bg-gray-50 rounded-lg p-3"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium">{kr.title}</p>
                          <p className="text-xs text-gray-400">
                            {kr.currentValue} / {kr.targetValue} {kr.unit || ''}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            STATUS_COLORS[kr.status] ?? 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {Math.round(kr.progress)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
