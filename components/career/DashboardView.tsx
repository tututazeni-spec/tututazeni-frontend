// components/career/DashboardView.tsx
// Separador "Minha Carreira" — perfil, gap de competências, vagas
// compatíveis, plano, simulador e histórico. Dados próprios +
// apresentação. Extraído de app/(platform)/career/page.tsx.

'use client';

import { useState } from 'react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar, Skeleton } from './atoms';
import { READINESS_CFG } from './constants';
import type { CareerProfile, SimulationResult } from './types';

export function DashboardView() {
  const [simTarget, setSimTarget] = useState('');

  const { data: profile, isLoading: loading } = useApiQuery<CareerProfile>(
    queryKeys.career.me(),
    '/career/me',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const simulateMutation = useApiMutation(
    (target: string) =>
      apiClient.get<SimulationResult>(`/career/me/simulate/${target}`),
    { onError: (e) => alert(e.message) },
  );
  const simulation = simulateMutation.data ?? null;
  const simLoading = simulateMutation.isPending;
  const runSimulation = () => {
    if (simTarget) simulateMutation.mutate(simTarget);
  };

  if (loading || !profile) return <Skeleton rows={6} />;

  const { user, insights, stats, careerPlan, careerHistory } = profile;
  const { competencyGaps, promotionEligibility, matchingVacancies } = insights;

  return (
    <div className="space-y-6">
      {/* Header do perfil */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <Avatar name={user.fullName} url={user.avatarUrl} size="lg" />
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-900">{user.fullName}</h2>
            <div className="text-sm text-gray-500">
              {user.position?.name ?? 'Sem cargo'} · {user.department?.name}
            </div>
            <div className="flex gap-3 mt-2 text-xs text-gray-400">
              <span>🎓 {stats.certificates} certificados</span>
              <span>📚 {stats.enrollments} cursos</span>
              <span>💡 {stats.userCompetencies} competências</span>
              <span>🏆 {stats.badgeAwards} badges</span>
            </div>
            {user.points && (
              <div className="mt-2 text-xs text-blue-700 font-semibold">
                {user.points.points} XP
              </div>
            )}
          </div>
          {promotionEligibility && (
            <div
              className={`px-3 py-2 rounded-xl text-center text-xs font-medium ${
                promotionEligibility.eligible
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-gray-50 text-gray-500 border border-gray-200'
              }`}
            >
              {promotionEligibility.eligible
                ? '✅ Elegível para promoção'
                : '📋 Em desenvolvimento'}
              <div className="text-xs font-normal mt-0.5 text-gray-400">
                {READINESS_CFG[promotionEligibility.recommendation]?.label}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Gap de Competências */}
        <div className="col-span-2 bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-900">
              Gap de Competências
            </span>
            <span className="text-xs text-gray-400">
              {competencyGaps.filter((g) => g.status === 'MET').length}/
              {competencyGaps.length} cumpridas
            </span>
          </div>
          {competencyGaps.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400">
              Sem cargo definido ou sem competências mapeadas
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {competencyGaps.slice(0, 6).map((g) => (
                <div
                  key={g.competency.id}
                  className="flex items-center gap-3 px-4 py-2.5"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-900 truncate">
                      {g.competency.name}
                    </div>
                    <div className="text-xs text-gray-400">
                      {g.competency.category}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((lvl) => (
                        <div
                          key={lvl}
                          className={`w-4 h-4 rounded-sm ${lvl <= g.currentLevel ? 'bg-blue-500' : lvl <= g.requiredLevel ? 'bg-blue-100' : 'bg-gray-100'}`}
                        />
                      ))}
                    </div>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded ${
                        g.status === 'MET'
                          ? 'bg-emerald-50 text-emerald-700'
                          : g.status === 'PARTIAL'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-red-50 text-red-600'
                      }`}
                    >
                      {g.status === 'MET' ? '✓' : `−${g.gap}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Vagas compatíveis + Plano de Carreira */}
        <div className="space-y-4">
          {/* Vagas compatíveis */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 text-sm font-semibold text-gray-900">
              🎯 Vagas compatíveis
            </div>
            {matchingVacancies.length === 0 ? (
              <div className="px-4 py-4 text-xs text-gray-400 text-center">
                Sem vagas compatíveis
              </div>
            ) : (
              matchingVacancies.slice(0, 3).map((v) => (
                <div
                  key={v.id}
                  className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-900 truncate">
                      {v.title}
                    </div>
                    <div className="text-xs text-gray-400">
                      {v.department?.name}
                    </div>
                  </div>
                  <div
                    className={`text-xs font-bold flex-shrink-0 ${(v.matchScore ?? 0) >= 80 ? 'text-emerald-600' : (v.matchScore ?? 0) >= 60 ? 'text-amber-600' : 'text-gray-400'}`}
                  >
                    {v.matchScore}%
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Plano de Carreira */}
          {careerPlan && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="text-xs text-blue-600 font-semibold mb-1">
                📋 Plano activo
              </div>
              <div className="text-sm font-medium text-gray-900 truncate">
                {careerPlan.title}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {careerPlan.goals?.length ?? 0} objetivos
              </div>
              {careerPlan.targetDate && (
                <div className="text-xs text-blue-600 mt-1">
                  Alvo:{' '}
                  {new Date(careerPlan.targetDate).toLocaleDateString('pt-AO', {
                    month: 'short',
                    year: 'numeric',
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Critérios de Elegibilidade */}
      {promotionEligibility && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="text-sm font-semibold text-gray-900 mb-4">
            📈 Critérios de Promoção
          </div>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(promotionEligibility.criteria).map(([key, c]) => (
              <div
                key={key}
                className={`rounded-xl p-4 border ${c.met ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 bg-gray-50'}`}
              >
                <div className="text-xs text-gray-500 mb-2">{c.label}</div>
                <div
                  className={`text-2xl font-bold font-mono ${c.met ? 'text-emerald-700' : 'text-gray-700'}`}
                >
                  {typeof c.value === 'number' && c.value % 1 !== 0
                    ? c.value.toFixed(1)
                    : c.value}
                  <span className="text-sm font-normal text-gray-400 ml-1">
                    / {c.required}
                  </span>
                </div>
                <div
                  className={`text-xs mt-1 font-medium ${c.met ? 'text-emerald-600' : 'text-amber-600'}`}
                >
                  {c.met ? '✓ Cumprido' : '⚠ Pendente'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Simulador de Carreira */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="text-sm font-semibold text-gray-900 mb-3">
          🔭 Simulador de Carreira
        </div>
        <div className="flex gap-3 mb-4">
          <input
            type="number"
            placeholder="ID do cargo alvo (Position ID)…"
            value={simTarget}
            onChange={(e) => setSimTarget(e.target.value)}
            className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={runSimulation}
            disabled={simLoading || !simTarget}
            className="px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800 disabled:opacity-60"
          >
            {simLoading ? '…' : 'Simular'}
          </button>
        </div>

        {simulation && (
          <div className="bg-blue-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-bold text-gray-900">
                  {simulation.targetPosition.name}
                </div>
                <div className="text-xs text-gray-500">Cargo alvo</div>
              </div>
              <div
                className={`text-3xl font-bold font-mono ${simulation.readinessScore >= 80 ? 'text-emerald-600' : simulation.readinessScore >= 60 ? 'text-amber-600' : 'text-red-600'}`}
              >
                {simulation.readinessScore}%
              </div>
            </div>
            <div className="w-full h-2 bg-white rounded-full overflow-hidden mb-3">
              <div
                className={`h-full rounded-full ${simulation.readinessScore >= 80 ? 'bg-emerald-500' : simulation.readinessScore >= 60 ? 'bg-amber-400' : 'bg-red-400'}`}
                style={{ width: `${simulation.readinessScore}%` }}
              />
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs mb-3">
              <div className="bg-white rounded-lg p-2">
                <div className="text-gray-400">Requisitos</div>
                <div className="font-bold text-gray-900">
                  {simulation.summary.requirementsMet}/
                  {simulation.summary.totalRequirements}
                </div>
              </div>
              <div className="bg-white rounded-lg p-2">
                <div className="text-gray-400">Pronto?</div>
                <div
                  className={`font-bold ${simulation.summary.ready ? 'text-emerald-600' : 'text-amber-600'}`}
                >
                  {simulation.summary.ready
                    ? 'Sim'
                    : `~${simulation.summary.estimatedTimeMonths}m`}
                </div>
              </div>
              <div className="bg-white rounded-lg p-2">
                <div className="text-gray-400">Cursos rec.</div>
                <div className="font-bold text-gray-900">
                  {simulation.recommendedCourses.length}
                </div>
              </div>
            </div>
            {simulation.recommendedCourses.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-gray-700 mb-1">
                  Cursos recomendados para fechar gaps:
                </div>
                {simulation.recommendedCourses.slice(0, 3).map((c) => (
                  <div key={c.id} className="text-xs text-blue-700 truncate">
                    📚 {c.title}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Histórico de Carreira */}
      {careerHistory.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 text-sm font-semibold text-gray-900">
            🕐 Histórico de Carreira
          </div>
          {careerHistory.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0"
            >
              <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">
                  {c.position?.name}
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(c.startedAt).toLocaleDateString('pt-AO', {
                    month: 'short',
                    year: 'numeric',
                  })}
                  {c.endedAt &&
                    ` → ${new Date(c.endedAt).toLocaleDateString('pt-AO', { month: 'short', year: 'numeric' })}`}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
