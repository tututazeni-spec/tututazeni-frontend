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
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import type { LearningPath } from './types';

export function PathsTab() {
  const { data: resp, isLoading } = useApiQuery<{ data: LearningPath[] }>(
    queryKeys.contentLibrary.paths(),
    '/content-library/paths/all',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const data = resp?.data ?? [];

  if (isLoading) return <Skeleton rows={3} />;

  if (data.length === 0) {
    return (
      <EmptyState
        icon={Layers}
        title="Nenhuma trilha de aprendizagem disponível"
        description="Ainda não existem trilhas de aprendizagem publicadas."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {data.map((path) => {
        const completed = path.overallProgress === 100;
        return (
          <Card
            key={path.id}
            className="overflow-hidden transition-shadow hover:shadow-hover"
          >
            <div className="relative flex h-28 items-center justify-center bg-gradient-to-br from-primary to-primary-active">
              {path.thumbnailUrl ? (
                <Image
                  src={path.thumbnailUrl}
                  alt={path.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <Layers
                  size={24}
                  strokeWidth={1.75}
                  className="text-canvas/60"
                />
              )}
              {path.hasCertification && (
                <div className="absolute right-2 top-2 flex items-center gap-1 rounded-pill bg-accent px-2 py-0.5 font-body text-[10px] font-bold text-canvas">
                  <Award size={14} strokeWidth={1.75} /> CERTIF.
                </div>
              )}
            </div>
            <CardBody>
              <h4 className="mb-1 font-body font-semibold text-ink">
                {path.title}
              </h4>
              {path.description && (
                <p className="mb-3 line-clamp-2 font-body text-xs text-ink-faint">
                  {path.description}
                </p>
              )}

              {path.overallProgress !== undefined && (
                <div className="mb-3">
                  <div className="mb-1 flex items-center justify-between font-body text-xs">
                    <span className="text-ink-muted">Progresso</span>
                    <span
                      className={cn(
                        'font-semibold',
                        completed ? 'text-success' : 'text-primary',
                      )}
                    >
                      {path.overallProgress}%{completed ? ' · Concluída' : ''}
                    </span>
                  </div>
                  <ProgressBar value={path.overallProgress} className="h-1.5" />
                </div>
              )}

              <div className="flex items-center justify-between font-body text-xs text-ink-faint">
                <span>{path.totalItems ?? 0} conteúdos</span>
                {path.xpReward && (
                  <span className="flex items-center gap-1 font-semibold text-accent">
                    <Zap size={14} strokeWidth={1.75} />
                    {path.xpReward} XP
                  </span>
                )}
              </div>

              <Button
                className="mt-3 w-full"
                onClick={() =>
                  apiClient.post(`/content-library/paths/${path.id}/enroll`, {})
                }
              >
                {(path.overallProgress ?? 0) > 0 ? 'Continuar' : 'Iniciar Trilha'}
              </Button>
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}
