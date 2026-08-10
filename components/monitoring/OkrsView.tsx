// components/monitoring/OkrsView.tsx

import { ErrorBanner, ListSkeleton } from './shared';
import { OKR_STATUS_COLORS } from './types';
import type { Cycle, Objective } from './types';

interface OkrsViewProps {
  cycles: Cycle[];
  selectedCycle: string;
  setSelectedCycle: (id: string) => void;
  objectives: Objective[];
  loading: boolean;
  error: string;
  onRetry: () => void;
}

export function OkrsView({
  cycles,
  selectedCycle,
  setSelectedCycle,
  objectives,
  loading,
  error,
  onRetry,
}: OkrsViewProps) {
  if (loading) return <ListSkeleton />;
  if (error) return <ErrorBanner message={error} onRetry={onRetry} />;

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
                            OKR_STATUS_COLORS[kr.status] ??
                            'bg-gray-100 text-gray-600'
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
