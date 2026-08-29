// src/app/(dashboard)/instructor/page.tsx
'use client';

import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { AtRiskView } from '@/components/instructor/AtRiskView';
import { CohortDetailView } from '@/components/instructor/CohortDetailView';
import { CohortsView } from '@/components/instructor/CohortsView';
import { NAV, TITLES } from '@/components/instructor/constants';
import { DashboardView } from '@/components/instructor/DashboardView';
import type { InstructorProfile, View } from '@/components/instructor/types';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { ApiError } from '@/lib/apiClient';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { QueryError } from '@/components/ui/QueryError';
import { Skeleton } from '@/components/ui/Skeleton';

export default function InstructorPage() {
  const [view, setView] = useState<View>('dashboard');
  const [selectedCohort, setSelectedCohort] = useState<number | null>(null);

  // Ser instrutor não é um papel (role) — depende de existir um
  // InstructorProfile para o utilizador. Sem esta sonda, cada sub-vista
  // dispara logo /instructors/my/* e, para quem não é instrutor, o backend
  // responde 404 "Instrutor não encontrado"; o handler global de erro do
  // QueryClient transforma esse 404 num console.error + toast vermelho, e
  // as vistas ficam presas no skeleton. `meta.silent` desliga esse handler
  // aqui — o 404 é tratado abaixo como um estado legítimo, não uma falha.
  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError,
    refetch: refetchProfile,
  } = useApiQuery<InstructorProfile>(
    queryKeys.instructor.profile(),
    '/instructors/my/profile',
    { staleTime: STALE_TIME.SEMI_STATIC, meta: { silent: true } },
  );

  const notAnInstructor =
    profileError instanceof ApiError && profileError.status === 404;

  const handleSelectCohort = (id: number) => {
    setSelectedCohort(id);
    setView('cohort-detail');
  };
  const handleBack = () => {
    setSelectedCohort(null);
    setView('cohorts');
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">
            {TITLES[view]}
          </h1>
          <p className="mt-0.5 font-body text-sm text-ink-faint">
          </p>
        </div>
        {profile && view === 'cohort-detail' && (
          <Button intent="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft size={14} strokeWidth={1.75} />
            Voltar
          </Button>
        )}
      </div>

      {profileLoading ? (
        <Skeleton rows={4} itemClassName="skeleton-shimmer h-16 rounded-card" />
      ) : notAnInstructor ? (
        <EmptyState
          title="Não estás registado como instrutor"
          description="Esta área é reservada a instrutores com turmas atribuídas. Fala com os Recursos Humanos se achas que devias ter acesso."
        />
      ) : profileError ? (
        <QueryError error={profileError} onRetry={() => refetchProfile()} />
      ) : (
        <>
          {view !== 'cohort-detail' && (
            <div className="mb-6 flex w-fit gap-1 rounded-card bg-surface-sunken p-1">
              {NAV.map((n) => (
                <Button
                  key={n.id}
                  size="sm"
                  intent={view === n.id ? 'primary' : 'ghost'}
                  onClick={() => setView(n.id)}
                >
                  {n.label}
                </Button>
              ))}
            </div>
          )}

          {view === 'dashboard' && (
            <DashboardView onSelectCohort={handleSelectCohort} />
          )}
          {view === 'cohorts' && (
            <CohortsView onSelectCohort={handleSelectCohort} />
          )}
          {view === 'at-risk' && <AtRiskView />}
          {view === 'cohort-detail' && selectedCohort !== null && (
            <CohortDetailView cohortId={selectedCohort} onBack={handleBack} />
          )}
        </>
      )}
    </div>
  );
}
