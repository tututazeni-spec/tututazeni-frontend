// components/leadership/ProgramsView.tsx
// Separador "Programas" — listagem filtrável de programas de liderança
// com auto-inscrição. Dados próprios + apresentação. Extraído de
// app/(platform)/leadership/page.tsx.

'use client';

import { useState } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Skeleton } from './atoms';
import { LEVEL_CFG } from './constants';
import type { LeadershipProgram, ProgramLevel } from './types';

export function ProgramsView() {
  const [filter, setFilter] = useState<ProgramLevel | ''>('');

  const params = { status: 'ACTIVE', ...(filter ? { level: filter } : {}) };
  const { data, isLoading } = useApiQuery<{ data: LeadershipProgram[] }>(
    queryKeys.leadership.programs(filter),
    '/leadership/programs',
    { params, staleTime: STALE_TIME.SEMI_STATIC },
  );

  const handleEnroll = async (programId: number) => {
    try {
      await apiClient.post(`/leadership/programs/${programId}/self-enroll`, {});
      alert('Inscrito com sucesso!');
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    }
  };

  if (isLoading) return <Skeleton />;

  return (
    <div>
      <div className="flex gap-2 mb-5">
        {(['', 'INITIAL', 'INTERMEDIATE', 'ADVANCED'] as const).map((l) => (
          <button
            key={l}
            onClick={() => setFilter(l)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filter === l
                ? 'bg-blue-700 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {l === '' ? 'Todos' : LEVEL_CFG[l as ProgramLevel].label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {data?.data.map((prog) => (
          <div
            key={prog.id}
            className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-900 mb-1">
                  {prog.name}
                </div>
                <StatusBadge value={prog.level} map={LEVEL_CFG} />
              </div>
              {prog.mandatory && (
                <span className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded flex-shrink-0">
                  Obrigatório
                </span>
              )}
            </div>

            {prog.description && (
              <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                {prog.description}
              </p>
            )}

            <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
              <span>👥 {prog._count.participants} participantes</span>
              {prog.durationWeeks && (
                <span>📅 {prog.durationWeeks} semanas</span>
              )}
            </div>

            <button
              onClick={() => handleEnroll(prog.id)}
              className="w-full py-2 bg-blue-700 text-white text-xs font-medium rounded-lg hover:bg-blue-800"
            >
              Inscrever-me
            </button>
          </div>
        ))}
        {data?.data.length === 0 && (
          <div className="col-span-3 py-12 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
            Sem programas disponíveis
          </div>
        )}
      </div>
    </div>
  );
}
