// components/engagement/SurveysTab.tsx
// Separador "Surveys" — grelha de surveys filtrável por estado. Dados
// próprios (useApiQuery) + apresentação. Extraído de
// app/(platform)/engagement/page.tsx.

'use client';

import { useState } from 'react';
import { BarChart2 } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { ProgressBar, Skeleton } from './atoms';
import type { SurveyItem } from './types';

const TYPE_ICON: Record<string, string> = {
  CLIMATE: '🌡️',
  PULSE: '💓',
  ENPS: '📊',
  ONBOARDING: '👋',
  OFFBOARDING: '🚪',
  WELLBEING: '🌿',
  CUSTOM: '⚙️',
};

const STATUS_COLOR: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  PAUSED: 'bg-amber-100 text-amber-700',
  COMPLETED: 'bg-blue-100 text-blue-700',
  ARCHIVED: 'bg-slate-100 text-slate-400',
};

export function SurveysTab() {
  const [status, setStatus] = useState('ACTIVE');

  const params = { limit: 30, ...(status ? { status } : {}) };
  const { data, isLoading } = useApiQuery<{
    data: SurveyItem[];
    meta: { total: number };
  }>(queryKeys.engagement.surveys(params), '/engagement/surveys', {
    params,
    staleTime: STALE_TIME.SEMI_STATIC,
  });

  if (isLoading) return <Skeleton />;

  return (
    <div className="space-y-4">
      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        {['ACTIVE', 'DRAFT', 'COMPLETED', ''].map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              status === s
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600'
            }`}
          >
            {s || 'Todos'}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-400 self-center">
          {data?.meta.total ?? 0} surveys
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {data?.data.map((s) => (
          <div
            key={s.id}
            className="bg-white rounded-xl border border-slate-100 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-2xl">{TYPE_ICON[s.type] ?? '📋'}</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[s.status]}`}
              >
                {s.status}
              </span>
            </div>
            <h4 className="text-sm font-semibold text-slate-800 mb-1">
              {s.title}
            </h4>
            <p className="text-xs text-slate-400 mb-3 line-clamp-2">
              {s.description}
            </p>

            <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
              <span>📝 {s._count?.questions ?? 0} perguntas</span>
              <span>👥 {s._count?.responses ?? 0} respostas</span>
            </div>

            {s.status === 'ACTIVE' && (
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Participação</span>
                  <span className="font-semibold text-indigo-600">
                    {s.participationRate ?? 0}%
                  </span>
                </div>
                <ProgressBar
                  value={s.participationRate ?? 0}
                  color="bg-indigo-500"
                />
              </div>
            )}

            {s.endDate && (
              <p className="text-[10px] text-slate-400 mt-2">
                ⏳ Termina: {new Date(s.endDate).toLocaleDateString('pt')}
              </p>
            )}
          </div>
        ))}

        {(data?.data.length ?? 0) === 0 && (
          <div className="col-span-3 py-16 text-center text-slate-400">
            <BarChart2 size={40} className="mx-auto mb-3 opacity-30" />
            <p>Nenhum survey encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
}
