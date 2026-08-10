// components/career/VacanciesView.tsx
// Separador "Vagas Internas" — filtro por tipo + candidatura. Dados
// próprios + apresentação. Extraído de app/(platform)/career/page.tsx.

'use client';

import { useState } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Badge, Skeleton } from './atoms';
import { VACANCY_TYPE } from './constants';
import type { InternalVacancy } from './types';

export function VacanciesView() {
  const [typeFilter, setTypeFilter] = useState('');
  const [applying, setApplying] = useState<number | null>(null);

  const {
    data: resp,
    isLoading: loading,
    refetch,
  } = useApiQuery<{ data: InternalVacancy[] }>(
    queryKeys.career.vacancies(typeFilter),
    '/career/vacancies',
    { params: { type: typeFilter }, staleTime: STALE_TIME.SEMI_STATIC },
  );
  const vacancies = resp?.data ?? [];

  const apply = async (vacancyId: number) => {
    setApplying(vacancyId);
    try {
      await apiClient.post(`/career/vacancies/${vacancyId}/apply`, {});
      await refetch();
      alert('✅ Candidatura enviada com sucesso!');
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setApplying(null);
    }
  };

  return (
    <div>
      {/* Filtros */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <button
          onClick={() => setTypeFilter('')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg ${!typeFilter ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          Todas
        </button>
        {Object.entries(VACANCY_TYPE).map(([k, v]) => (
          <button
            key={k}
            onClick={() => setTypeFilter(k)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg ${typeFilter === k ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {v.icon} {v.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Skeleton rows={4} />
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {vacancies.map((v) => {
            const typeCfg = VACANCY_TYPE[v.type] ?? {
              label: v.type,
              icon: '📋',
              cls: 'bg-gray-100 text-gray-600',
            };
            return (
              <div
                key={v.id}
                className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Badge
                    label={`${typeCfg.icon} ${typeCfg.label}`}
                    cls={typeCfg.cls}
                  />
                  {v.matchScore !== undefined && (
                    <span
                      className={`text-sm font-bold ${v.matchScore >= 80 ? 'text-emerald-600' : v.matchScore >= 60 ? 'text-amber-600' : 'text-gray-400'}`}
                    >
                      {v.matchScore}% match
                    </span>
                  )}
                </div>
                <div className="text-sm font-semibold text-gray-900 mb-1">
                  {v.title}
                </div>
                <div className="text-xs text-gray-400 mb-3">
                  {v.position?.name && <span>{v.position.name} · </span>}
                  {v.department?.name && <span>{v.department.name}</span>}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {v._count.applications} candidatura
                    {v._count.applications !== 1 ? 's' : ''}
                    {v.closingDate &&
                      ` · Fecha ${new Date(v.closingDate).toLocaleDateString('pt-AO', { day: '2-digit', month: 'short' })}`}
                  </span>
                  {v.applied ? (
                    <Badge
                      label={v.applicationStatus ?? 'Candidatado'}
                      cls={
                        v.applicationStatus === 'ACCEPTED'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-gray-100 text-gray-500'
                      }
                    />
                  ) : (
                    <button
                      onClick={() => apply(v.id)}
                      disabled={applying === v.id}
                      className="px-3 py-1.5 bg-blue-700 text-white text-xs font-medium rounded-lg hover:bg-blue-800 disabled:opacity-60"
                    >
                      {applying === v.id ? '…' : 'Candidatar-me'}
                    </button>
                  )}
                </div>
                {v.matchScore !== undefined && v.matchScore > 0 && (
                  <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${v.matchScore >= 80 ? 'bg-emerald-500' : v.matchScore >= 60 ? 'bg-amber-400' : 'bg-red-400'}`}
                      style={{ width: `${v.matchScore}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
          {vacancies.length === 0 && (
            <div className="col-span-2 py-12 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
              Sem vagas internas abertas
            </div>
          )}
        </div>
      )}
    </div>
  );
}
