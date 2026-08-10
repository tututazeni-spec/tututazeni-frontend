// components/roi-impact/ProgramsTab.tsx
// Tab "Programas": ranking de programas por ROI. Extraído de
// app/(platform)/roi-impact/page.tsx.

'use client';

import { BarChart2 } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from './atoms';
import type { ProgramsData } from './types';

export function ProgramsTab() {
  const { data, isLoading: loading } = useApiQuery<ProgramsData>(
    queryKeys.roiImpact.programs(),
    '/roi-impact/programs',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  if (loading) return <Skeleton count={3} />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-100 p-4 text-center">
          <p className="text-2xl font-bold text-slate-800">
            {data?.total ?? 0}
          </p>
          <p className="text-xs text-slate-400">Programas</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4 text-center">
          <p
            className={`text-2xl font-bold ${(data?.avgRoi ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}
          >
            {data?.avgRoi ?? 0}%
          </p>
          <p className="text-xs text-slate-400">ROI Médio</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4 text-center">
          <p className="text-2xl font-bold text-indigo-600">
            {data?.topByRoi?.length ?? 0}
          </p>
          <p className="text-xs text-slate-400">Acima de 100% ROI</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h4 className="font-semibold text-slate-700">
            Ranking de Programas por ROI
          </h4>
        </div>
        <div className="divide-y divide-slate-50 max-h-96 overflow-y-auto">
          {(data?.programs ?? []).map((p, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50"
            >
              <span className="text-xs text-slate-300 font-bold w-5 text-right">
                #{i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">
                  {p.course?.title ?? `Curso ${i + 1}`}
                </p>
                <p className="text-[10px] text-slate-400">
                  {p.course?.category} · {p.completions} conclusões
                </p>
              </div>
              <div className="text-right shrink-0">
                <p
                  className={`text-sm font-bold ${(p.roi ?? 0) >= 100 ? 'text-emerald-600' : (p.roi ?? 0) >= 0 ? 'text-amber-600' : 'text-red-500'}`}
                >
                  {p.roi}%
                </p>
                <p className="text-[10px] text-slate-400">BCR: {p.bcr}</p>
              </div>
            </div>
          ))}
          {(data?.programs?.length ?? 0) === 0 && (
            <div className="py-12 text-center text-slate-400">
              <BarChart2 size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Sem dados de programas para o período</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
