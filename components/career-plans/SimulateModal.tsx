// components/career-plans/SimulateModal.tsx
// Simulador de carreira: escolhe um cargo alvo e mostra readiness,
// gaps e estimativa. Extraído de app/(platform)/career-plans/page.tsx.

'use client';

import { useState } from 'react';
import { AlertCircle, BookOpen, Compass, Loader2, X, Zap } from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { ReadinessBar } from './atoms';
import { READINESS_CONFIG } from './constants';
import { SkillGapList } from './SkillGapList';
import type { ReadinessLevel, Role, SimulationResult } from './types';

interface SimulateModalProps {
  roles: Role[];
  onClose: () => void;
}

export function SimulateModal({ roles, onClose }: SimulateModalProps) {
  const [targetRoleId, setTargetRoleId] = useState(0);
  const [error, setError] = useState('');

  const simulateMutation = useApiMutation(
    (roleId: number) =>
      apiClient.post<SimulationResult>('/career-plans/simulate', {
        targetRoleId: roleId,
      }),
    { onError: (e) => setError(e.message) },
  );
  const result = simulateMutation.data ?? null;
  const loading = simulateMutation.isPending;

  const simulate = () => {
    if (!targetRoleId) {
      setError('Seleccione um cargo alvo');
      return;
    }
    setError('');
    simulateMutation.mutate(targetRoleId);
  };

  const readinessCfg = result
    ? READINESS_CONFIG[result.readiness.readinessLevel as ReadinessLevel]
    : null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Compass size={18} className="text-blue-600" /> Simulador de
              Carreira
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Veja o que é necessário para chegar ao próximo nível
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-500"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl text-sm">
              <AlertCircle size={15} />
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Cargo Alvo
            </label>
            <select
              value={targetRoleId}
              onChange={(e) => {
                setTargetRoleId(+e.target.value);
                simulateMutation.reset();
              }}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value={0}>Seleccionar...</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} — {r.department} (Nível {r.level})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={simulate}
            disabled={loading || !targetRoleId}
            className="w-full py-3 text-sm text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
          >
            {loading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Zap size={15} />
            )}{' '}
            Simular
          </button>

          {result && readinessCfg && (
            <div className="space-y-4 border-t border-gray-100 pt-4">
              <div className={`p-4 rounded-2xl border ${readinessCfg.bg}`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-gray-900">
                    {result.readiness.readinessEmoji} Prontidão para &quot;
                    {result.targetRole.name}&quot;
                  </p>
                  <span className={`text-xl font-bold ${readinessCfg.color}`}>
                    {result.readiness.score}%
                  </span>
                </div>
                <ReadinessBar
                  score={result.readiness.score}
                  level={result.readiness.readinessLevel}
                />
                <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
                  <div className="bg-white/60 rounded-xl p-2.5">
                    <p className="text-gray-400">Estimativa</p>
                    <p className="font-bold text-gray-900 mt-0.5">
                      {result.estimatedMonths} meses
                    </p>
                  </div>
                  <div className="bg-white/60 rounded-xl p-2.5">
                    <p className="text-gray-400">Data prevista</p>
                    <p className="font-bold text-gray-900 mt-0.5">
                      {new Date(result.estimatedDate).toLocaleDateString(
                        'pt-PT',
                        { month: 'short', year: 'numeric' },
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {result.readiness.missingSkills.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-red-600 mb-2">
                    Skills Obrigatórias em Falta
                  </p>
                  <SkillGapList
                    gaps={result.readiness.missingSkills}
                    mandatory
                  />
                </div>
              )}

              {result.readiness.skillGaps.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-amber-600 mb-2">
                    Gaps a Desenvolver
                  </p>
                  <SkillGapList gaps={result.readiness.skillGaps} />
                </div>
              )}

              {(result.recommendedActions?.length ?? 0) > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-600 mb-2">
                    Cursos Recomendados
                  </p>
                  <div className="space-y-1.5">
                    {result.recommendedActions?.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center gap-2 text-sm text-blue-700 hover:underline cursor-pointer"
                      >
                        <BookOpen size={13} />
                        {c.title}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
