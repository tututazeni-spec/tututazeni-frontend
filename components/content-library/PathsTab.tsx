// components/content-library/PathsTab.tsx
// Separador "Trilhas" — grelha de learning paths com progresso + inscrição.
// Dados próprios (useApiQuery + apiClient.post directo) + apresentação.
// Extraído de app/(platform)/content-library/page.tsx.

'use client';

import Image from 'next/image';
import { Award, Layers, Zap } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { ProgressBar, Skeleton } from './atoms';
import type { LearningPath } from './types';

export function PathsTab() {
  const { data: resp, isLoading } = useApiQuery<{ data: LearningPath[] }>(
    queryKeys.contentLibrary.paths(),
    '/content-library/paths/all',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const data = resp?.data ?? [];

  if (isLoading) return <Skeleton count={3} />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {data.map((path) => (
        <div
          key={path.id}
          className="bg-white rounded-xl border border-slate-100 overflow-hidden hover:shadow-md transition-all"
        >
          <div className="h-28 bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center relative">
            {path.thumbnailUrl ? (
              <Image
                src={path.thumbnailUrl}
                alt={path.title}
                fill
                className="object-cover"
              />
            ) : (
              <Layers size={36} className="text-white opacity-60" />
            )}
            {path.hasCertification && (
              <div className="absolute top-2 right-2 flex items-center gap-1 bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                <Award size={10} /> CERTIF.
              </div>
            )}
          </div>
          <div className="p-4">
            <h4 className="font-semibold text-slate-800 mb-1">{path.title}</h4>
            {path.description && (
              <p className="text-xs text-slate-400 mb-3 line-clamp-2">
                {path.description}
              </p>
            )}

            {path.overallProgress !== undefined && (
              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-500">Progresso</span>
                  <span className="font-semibold text-indigo-600">
                    {path.overallProgress}%
                  </span>
                </div>
                <ProgressBar
                  value={path.overallProgress}
                  color={
                    path.overallProgress === 100
                      ? 'bg-emerald-500'
                      : 'bg-indigo-500'
                  }
                  height="h-1.5"
                />
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{path.totalItems ?? 0} conteúdos</span>
              {path.xpReward && (
                <span className="flex items-center gap-1 text-amber-500 font-semibold">
                  <Zap size={11} />
                  {path.xpReward} XP
                </span>
              )}
            </div>

            <button
              onClick={() =>
                apiClient.post(`/content-library/paths/${path.id}/enroll`, {})
              }
              className="mt-3 w-full py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              {(path.overallProgress ?? 0) > 0 ? 'Continuar' : 'Iniciar Trilha'}
            </button>
          </div>
        </div>
      ))}

      {data.length === 0 && (
        <div className="col-span-3 py-16 text-center text-slate-400">
          <Layers size={40} className="mx-auto mb-3 opacity-30" />
          <p>Nenhuma learning path disponível</p>
        </div>
      )}
    </div>
  );
}
