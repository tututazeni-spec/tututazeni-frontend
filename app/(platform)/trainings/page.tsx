// src/app/(dashboard)/trainings/page.tsx
'use client';

// Container: gere a navegação (catálogo/detalhe/os meus treinamentos/
// dashboard); delega dados+apresentação de cada separador aos
// componentes auto-contidos em components/trainings/. Ver memory
// project_innova_component_separation_audit.

import { useState } from 'react';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { CAN_MANAGE_TRAININGS_ROLES, NAV, TITLES } from '@/components/trainings/constants';
import { CalendarView } from '@/components/trainings/CalendarView';
import { CatalogView } from '@/components/trainings/CatalogView';
import { DashboardView } from '@/components/trainings/DashboardView';
import { DetailView } from '@/components/trainings/DetailView';
import { GestaoView } from '@/components/trainings/GestaoView';
import { ManageTrainingView } from '@/components/trainings/ManageTrainingView';
import { MyTrainingsView } from '@/components/trainings/MyTrainingsView';
import { PlanDetailView } from '@/components/trainings/plans/PlanDetailView';
import { PlansView } from '@/components/trainings/plans/PlansView';
import type { Nav } from '@/components/trainings/types';

export default function TrainingsPage() {
  const [nav, setNav] = useState<Nav>({ view: 'catalog' });
  const role = useCurrentRole();

  const canManage = !!role && (CAN_MANAGE_TRAININGS_ROLES as readonly string[]).includes(role);
  const isAdminOrRh = role === 'ADMIN' || role === 'RH';
  // Só a UI — a autorização real é sempre feita no backend (403 se o
  // separador for forçado por URL/estado sem o papel certo).
  const visibleNav = NAV.filter((n) => {
    if (n.id === 'manage') return canManage;
    if (n.id === 'plans') return canManage;
    if (n.id === 'dashboard') return isAdminOrRh;
    return true;
  });

  const handleSelect = (id: number) =>
    setNav({ view: 'detail', selectedId: id });
  const handleManage = (id: number) =>
    setNav({ view: 'manage-detail', selectedId: id });
  const handleOpenPlan = (id: number) =>
    setNav({ view: 'plan-detail', selectedId: id });
  const handleBack = () => setNav({ view: 'catalog' });
  const handleBackToManage = () => setNav({ view: 'manage' });
  const handleBackToPlans = () => setNav({ view: 'plans' });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">
            {TITLES[nav.view]}
          </h1>
          <p className="mt-0.5 font-body text-sm text-ink-faint">
          </p>
        </div>
      </div>

      {nav.view !== 'detail' && nav.view !== 'manage-detail' && nav.view !== 'plan-detail' && (
        <div className="mb-6 flex w-fit gap-1 rounded-xl bg-surface-sunken p-1">
          {visibleNav.map((n) => (
            <button
              key={n.id}
              onClick={() => setNav({ view: n.id })}
              className={`rounded-lg px-4 py-2 font-body text-sm font-medium transition-colors ${
                nav.view === n.id
                  ? 'bg-surface text-ink shadow-resting'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              {n.label}
            </button>
          ))}
        </div>
      )}

      {nav.view === 'catalog' && <CatalogView onSelect={handleSelect} />}
      {nav.view === 'detail' && (
        <DetailView trainingId={nav.selectedId} onBack={handleBack} />
      )}
      {nav.view === 'my-trainings' && (
        <MyTrainingsView onSelect={handleSelect} />
      )}
      {nav.view === 'manage' && <GestaoView onManage={handleManage} />}
      {nav.view === 'manage-detail' && (
        <ManageTrainingView trainingId={nav.selectedId} onBack={handleBackToManage} />
      )}
      {nav.view === 'dashboard' && <DashboardView />}
      {nav.view === 'plans' && <PlansView onOpen={handleOpenPlan} />}
      {nav.view === 'plan-detail' && (
        <PlanDetailView planId={nav.selectedId} onBack={handleBackToPlans} />
      )}
      {nav.view === 'calendar' && <CalendarView onSelectTraining={handleSelect} />}
    </div>
  );
}
