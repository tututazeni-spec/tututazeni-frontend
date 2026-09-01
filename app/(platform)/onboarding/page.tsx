'use client';

// Container: gere o separador activo; delega dados+apresentação de cada
// separador aos componentes auto-contidos em components/onboarding/
// (mesmo padrão que components/payslips/page.tsx usa para ListView/
// CompareView/AnnualView). Ver memory
// project_innova_component_separation_audit. Migrado para a fundação
// de design: Button substitui os botões/tabs bespoke, mesmo padrão de
// app/(platform)/events/page.tsx.
//
// RBAC: separadores marcados `mgmtOnly` (Planos, Dashboard) só entram na
// navegação para ADMIN/RH/GESTOR — espelha @Roles(ADMIN, RH, GESTOR) em
// onboarding.controller.ts (GET /onboarding e GET /onboarding/dashboard).
// "+ Novo template" e "+ Atribuir plano" são mais restritos (ADMIN/RH).

import { useState } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { ADMIN_ROLES, type Role } from '@/lib/roles';
import { NAV, TITLES } from '@/components/onboarding/constants';
import { AssignPlanModal } from '@/components/onboarding/AssignPlanModal';
import { CreateTemplateModal } from '@/components/onboarding/CreateTemplateModal';
import { DashboardView } from '@/components/onboarding/DashboardView';
import { MyPlanView } from '@/components/onboarding/MyPlanView';
import { PlansView } from '@/components/onboarding/PlansView';
import { TemplatesView } from '@/components/onboarding/TemplatesView';
import type { View } from '@/components/onboarding/types';
import { Button } from '@/components/ui/Button';

// Exactamente @Roles(ADMIN, RH, GESTOR) — não reutiliza MGMT_ROLES de
// lib/roles.ts porque esse inclui LIDER, que o backend não autoriza aqui.
const MGMT_ROLES: readonly Role[] = ['ADMIN', 'RH', 'GESTOR'];

export default function OnboardingPage() {
  const [view, setView] = useState<View>('my-plan');
  const [showCreate, setShowCreate] = useState(false);
  const [showAssign, setShowAssign] = useState(false);

  const { data: currentUser } = useCurrentUser();
  const role = currentUser?.role?.name as Role | undefined;
  // POST /onboarding/templates, gestão de tarefas do template, POST
  // /onboarding e DELETE /onboarding/:id são @Roles(ADMIN, RH).
  const canManage = !!role && ADMIN_ROLES.includes(role);
  const isMgmt = !!role && MGMT_ROLES.includes(role);
  const visibleNav = isMgmt ? NAV : NAV.filter((n) => !n.mgmtOnly);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-ink">{TITLES[view]}</h1>
          <p className="text-sm text-ink-faint mt-0.5"></p>
        </div>
        {view === 'templates' && canManage && (
          <Button size="sm" onClick={() => setShowCreate(true)}>
            + Novo template
          </Button>
        )}
        {view === 'plans' && canManage && (
          <Button size="sm" onClick={() => setShowAssign(true)}>
            + Atribuir plano
          </Button>
        )}
      </div>

      <div className="flex gap-1 mb-6 bg-surface-sunken p-1 rounded-card w-fit">
        {visibleNav.map((n) => (
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

      {view === 'my-plan' && <MyPlanView />}
      {view === 'plans' && <PlansView canDelete={canManage} />}
      {view === 'dashboard' && <DashboardView canDelete={canManage} />}
      {view === 'templates' && <TemplatesView canManage={canManage} />}

      {showCreate && (
        <CreateTemplateModal onClose={() => setShowCreate(false)} />
      )}
      {showAssign && <AssignPlanModal onClose={() => setShowAssign(false)} />}
    </div>
  );
}
