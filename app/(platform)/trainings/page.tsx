// src/app/(dashboard)/trainings/page.tsx
'use client';

// Container: gere a navegação (catálogo/detalhe/os meus treinamentos/
// dashboard); delega dados+apresentação de cada separador aos
// componentes auto-contidos em components/trainings/. Ver memory
// project_innova_component_separation_audit.

import { PillNav } from '@/components/ui/PillTabs';
import { BANNER_TABS_CLASS, ModuleBanner } from '@/components/ui/ModuleBanner';
import { useState } from 'react';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import {
  CAN_MANAGE_TRAININGS_ROLES,
  NAV,
  TITLES,
} from '@/components/trainings/constants';
import { CertificatesCenter } from '@/components/certificates/CertificatesCenter';
import type { Nav } from '@/components/trainings/types';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/Skeleton';

const CalendarView = dynamic(
  () =>
    import('@/components/trainings/CalendarView').then((m) => m.CalendarView),
  {
    loading: () => <Skeleton />,
  },
);

const CatalogView = dynamic(
  () => import('@/components/trainings/CatalogView').then((m) => m.CatalogView),
  {
    loading: () => <Skeleton />,
  },
);

const DashboardView = dynamic(
  () =>
    import('@/components/trainings/DashboardView').then((m) => m.DashboardView),
  {
    loading: () => <Skeleton />,
  },
);

const DetailView = dynamic(
  () => import('@/components/trainings/DetailView').then((m) => m.DetailView),
  {
    loading: () => <Skeleton />,
  },
);

const GestaoView = dynamic(
  () => import('@/components/trainings/GestaoView').then((m) => m.GestaoView),
  {
    loading: () => <Skeleton />,
  },
);

const ManageTrainingView = dynamic(
  () =>
    import('@/components/trainings/ManageTrainingView').then(
      (m) => m.ManageTrainingView,
    ),
  {
    loading: () => <Skeleton />,
  },
);

const MyTrainingsView = dynamic(
  () =>
    import('@/components/trainings/MyTrainingsView').then(
      (m) => m.MyTrainingsView,
    ),
  {
    loading: () => <Skeleton />,
  },
);

const PlanDetailView = dynamic(
  () =>
    import('@/components/trainings/plans/PlanDetailView').then(
      (m) => m.PlanDetailView,
    ),
  {
    loading: () => <Skeleton />,
  },
);

const PlansView = dynamic(
  () =>
    import('@/components/trainings/plans/PlansView').then((m) => m.PlansView),
  {
    loading: () => <Skeleton />,
  },
);

const TrainersView = dynamic(
  () =>
    import('@/components/trainings/TrainersView').then((m) => m.TrainersView),
  {
    loading: () => <Skeleton />,
  },
);

const ResourcesView = dynamic(
  () =>
    import('@/components/trainings/ResourcesView').then((m) => m.ResourcesView),
  {
    loading: () => <Skeleton />,
  },
);

const ReportsView = dynamic(
  () => import('@/components/trainings/ReportsView').then((m) => m.ReportsView),
  {
    loading: () => <Skeleton />,
  },
);

export default function TrainingsPage() {
  const [nav, setNav] = useState<Nav>({ view: 'catalog' });
  const role = useCurrentRole();

  const canManage =
    !!role && (CAN_MANAGE_TRAININGS_ROLES as readonly string[]).includes(role);
  const isAdminOrRh = role === 'ADMIN' || role === 'RH';
  // Só a UI — a autorização real é sempre feita no backend (403 se o
  // separador for forçado por URL/estado sem o papel certo).
  const visibleNav = NAV.filter((n) => {
    if (n.id === 'manage') return canManage;
    if (n.id === 'plans') return canManage;
    if (n.id === 'trainers') return canManage;
    if (n.id === 'resources') return canManage;
    if (n.id === 'reports') return canManage;
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
      <ModuleBanner
        src="/images/gestão de formações.jpg"
        title={TITLES[nav.view]}
        hint={visibleNav.find((n) => n.id === nav.view)?.hint}
        className={
          nav.view === 'detail' ||
          nav.view === 'manage-detail' ||
          nav.view === 'plan-detail'
            ? 'mb-6'
            : undefined
        }
      />

      {nav.view !== 'detail' &&
        nav.view !== 'manage-detail' &&
        nav.view !== 'plan-detail' && (
          <PillNav
            items={visibleNav}
            value={nav.view}
            onChange={(id) => setNav({ view: id } as Nav)}
            label="Formações"
            className={BANNER_TABS_CLASS}
          />
        )}

      {nav.view === 'catalog' && <CatalogView onSelect={handleSelect} />}
      {nav.view === 'detail' && (
        <DetailView trainingId={nav.selectedId} onBack={handleBack} />
      )}
      {nav.view === 'my-trainings' && (
        <MyTrainingsView onSelect={handleSelect} />
      )}
      {nav.view === 'certificates' && <CertificatesCenter />}
      {nav.view === 'manage' && <GestaoView onManage={handleManage} />}
      {nav.view === 'manage-detail' && (
        <ManageTrainingView
          trainingId={nav.selectedId}
          onBack={handleBackToManage}
        />
      )}
      {nav.view === 'dashboard' && <DashboardView />}
      {nav.view === 'plans' && <PlansView onOpen={handleOpenPlan} />}
      {nav.view === 'plan-detail' && (
        <PlanDetailView planId={nav.selectedId} onBack={handleBackToPlans} />
      )}
      {nav.view === 'calendar' && (
        <CalendarView onSelectTraining={handleSelect} />
      )}
      {nav.view === 'trainers' && <TrainersView />}
      {nav.view === 'resources' && <ResourcesView />}
      {nav.view === 'reports' && <ReportsView />}
    </div>
  );
}
