'use client';
import { useState, useEffect } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';

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
  const [selectedCycle, setSelectedCycle] = useState<string>('');

  const { data: cycles = [], isLoading: loading, error: cyclesError, refetch } =
    useApiQuery<Cycle[]>(
      queryKeys.monitoring.okrs({ kind: 'cycles' }), '/monitoring/okr/cycles',
      { staleTime: STALE_TIME.SEMI_STATIC },
    );

  // Selecciona o 1.º ciclo assim que a lista chega.
  useEffect(() => {
    if (!selectedCycle && cycles.length > 0) setSelectedCycle(cycles[0].id);
  }, [cycles, selectedCycle]);

  // Objectivos dependem do ciclo escolhido (waterfall legítimo) → enabled.
  const { data: objectives = [] } = useApiQuery<Objective[]>(
    queryKeys.monitoring.okrs({ kind: 'objectives', cycleId: selectedCycle }),
    `/monitoring/okr/cycles/${selectedCycle}/objectives`,
    { enabled: !!selectedCycle, staleTime: STALE_TIME.DYNAMIC },
  );

  const error = cyclesError?.message ?? '';
  const fetchCycles = () => refetch();

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
