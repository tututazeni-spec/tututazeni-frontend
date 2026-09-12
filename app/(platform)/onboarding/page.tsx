'use client';

// Container: gere o separador activo; delega dados+apresentação de cada
// separador aos componentes auto-contidos em components/onboarding/
// (mesmo padrão que components/payslips/page.tsx usa para ListView/
// CompareView/AnnualView). Ver memory
// project_innova_component_separation_audit. Migrado para a fundação
// de design: Button substitui os botões/tabs bespoke, mesmo padrão de
// app/(platform)/events/page.tsx.
//
// RBAC: cada item de NAV traz o seu próprio `roles` (ver constants.ts) —
// "Planos" e "Dashboard" já não partilham o mesmo critério: "Planos" abre
// para ADMIN/GESTOR/RH/DIRECTOR/LIDER (para chegar a "+ Atribuir plano"),
// "Dashboard" fica em DASHBOARD_ROLES (ADMIN/RH/GESTOR, espelha
// @Roles(...) de GET /onboarding/dashboard). "+ Atribuir plano" e "+ Novo
// template" (criar plano de integração) usam ambos EVAL_CREATOR_ROLES —
// espelham @Roles(...) de POST /onboarding e POST /onboarding/templates
// respectivamente; editar/apagar template ou plano continuam ADMIN/RH
// (canManage), aprovar/saltar tarefas continua DASHBOARD_ROLES
// (canManageTasks).

import { useState } from 'react';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { ADMIN_ROLES, EVAL_CREATOR_ROLES, filterByRole } from '@/lib/roles';
import { DASHBOARD_ROLES, NAV, TITLES } from '@/components/onboarding/constants';
import { AssignPlanModal } from '@/components/onboarding/AssignPlanModal';
import { TemplateFormModal } from '@/components/onboarding/TemplateFormModal';
import { DashboardView } from '@/components/onboarding/DashboardView';
import { MyPlanView } from '@/components/onboarding/MyPlanView';
import { PlansView } from '@/components/onboarding/PlansView';
import { TemplatesView } from '@/components/onboarding/TemplatesView';
import type { View } from '@/components/onboarding/types';
import { Button } from '@/components/ui/Button';

export default function OnboardingPage() {
  const [view, setView] = useState<View>('my-plan');
  const [showCreate, setShowCreate] = useState(false);
  const [showAssign, setShowAssign] = useState(false);

  const role = useCurrentRole();
  // Editar/apagar template, gestão de tarefas do template e DELETE
  // /onboarding/:id são @Roles(ADMIN, RH).
  const canManage = !!role && ADMIN_ROLES.includes(role);
  // Criar plano de integração (POST /onboarding/templates) e atribuí-lo a
  // um colaborador (POST /onboarding) — ambos @Roles(ADMIN, GESTOR, RH,
  // DIRECTOR, LIDER).
  const canCreateTemplate = !!role && EVAL_CREATOR_ROLES.includes(role);
  const canAssignPlan = !!role && EVAL_CREATOR_ROLES.includes(role);
  // Aprovar/saltar tarefas de um plano — @Roles(ADMIN, RH, GESTOR).
  const canManageTasks = !!role && DASHBOARD_ROLES.includes(role);
  const visibleNav = filterByRole(NAV, role);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-ink">{TITLES[view]}</h1>
          <p className="text-sm text-ink-faint mt-0.5"></p>
        </div>
        {view === 'templates' && canCreateTemplate && (
          <Button size="sm" onClick={() => setShowCreate(true)}>
            + Novo template
          </Button>
        )}
        {view === 'plans' && canAssignPlan && (
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
      {view === 'plans' && (
        <PlansView canManagePlan={canManage} canManageTasks={canManageTasks} />
      )}
      {view === 'dashboard' && (
        <DashboardView canManagePlan={canManage} canManageTasks={canManageTasks} />
      )}
      {view === 'templates' && <TemplatesView canManage={canManage} />}

      {showCreate && <TemplateFormModal onClose={() => setShowCreate(false)} />}
      {showAssign && <AssignPlanModal onClose={() => setShowAssign(false)} />}
    </div>
  );
}
