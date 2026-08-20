// components/career/VacanciesView.tsx
// Separador "Vagas Internas" — filtro por tipo + candidatura. Dados
// próprios + apresentação. Extraído de app/(platform)/career/page.tsx.

'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useToast } from '@/providers/ToastProvider';
import { apiClient } from '@/lib/apiClient';
import { reportError } from '@/lib/errorReporting';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { cn } from '@/lib/cn';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { VACANCY_TYPE } from './constants';
import type { InternalVacancy } from './types';

function scoreClass(score: number): string {
  if (score >= 80) return 'text-success';
  if (score >= 60) return 'text-warning';
  return 'text-ink-faint';
}

export function VacanciesView() {
  const notify = useToast();
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
      notify({
        title: 'Candidatura enviada com sucesso!',
        intent: 'success',
      });
    } catch (e) {
      reportError(e, { source: 'VacanciesView.apply' });
      notify({
        title: e instanceof Error ? e.message : String(e),
        intent: 'danger',
      });
    } finally {
      setApplying(null);
    }
  };

  return (
    <div>
      {/* Filtros */}
      <div className="mb-5 flex flex-wrap gap-2">
        <Button
          size="sm"
          intent={!typeFilter ? 'primary' : 'ghost'}
          onClick={() => setTypeFilter('')}
        >
          Todas
        </Button>
        {Object.entries(VACANCY_TYPE).map(([k, v]) => (
          <Button
            key={k}
            size="sm"
            intent={typeFilter === k ? 'primary' : 'ghost'}
            onClick={() => setTypeFilter(k)}
          >
            {v.icon} {v.label}
          </Button>
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
              intent: 'neutral' as const,
            };
            return (
              <Card
                key={v.id}
                className="p-4 transition-shadow duration-150 hover:shadow-hover"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <Badge intent={typeCfg.intent}>
                    {typeCfg.icon} {typeCfg.label}
                  </Badge>
                  {v.matchScore !== undefined && (
                    <span
                      className={cn(
                        'font-body text-sm font-bold',
                        scoreClass(v.matchScore),
                      )}
                    >
                      {v.matchScore}% match
                    </span>
                  )}
                </div>
                <div className="mb-1 font-body text-sm font-semibold text-ink">
                  {v.title}
                </div>
                <div className="mb-3 font-body text-xs text-ink-faint">
                  {v.position?.name && <span>{v.position.name} · </span>}
                  {v.department?.name && <span>{v.department.name}</span>}
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-body text-xs text-ink-faint">
                    {v._count.applications} candidatura
                    {v._count.applications !== 1 ? 's' : ''}
                    {v.closingDate &&
                      ` · Fecha ${new Date(v.closingDate).toLocaleDateString('pt-AO', { day: '2-digit', month: 'short' })}`}
                  </span>
                  {v.applied ? (
                    <Badge
                      intent={
                        v.applicationStatus === 'ACCEPTED'
                          ? 'success'
                          : 'neutral'
                      }
                    >
                      {v.applicationStatus ?? 'Candidatado'}
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => apply(v.id)}
                      loading={applying === v.id}
                    >
                      Candidatar-me
                    </Button>
                  )}
                </div>
                {v.matchScore !== undefined && v.matchScore > 0 && (
                  <ProgressBar value={v.matchScore} className="mt-2" />
                )}
              </Card>
            );
          })}
          {vacancies.length === 0 && (
            <div className="col-span-2">
              <EmptyState
                icon={Search}
                title="Sem vagas internas abertas"
                description="Ainda não há vagas internas disponíveis para o filtro seleccionado."
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
