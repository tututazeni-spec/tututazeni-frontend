'use client';

// Container: gere o separador activo (via Tabs do Radix) e delega dados+
// apresentação de cada separador aos componentes auto-contidos em
// components/onboarding/ — mesmo padrão de app/(platform)/evaluation/
// page.tsx, remodelado a partir de docs/onboarding.md (ver Fase A/B/C no
// plano). Ordem/nomenclatura dos separadores segue o doc: "O Meu Plano"
// (vista pessoal, fora da numeração) + pontos 1-10.
//
// RBAC: "Visão Geral"/"Onboardings" espelham @Roles(ADMIN, RH, GESTOR) em
// onboarding.controller.ts (GET /onboarding/dashboard, GET /onboarding) —
// via EXECUTIVE_ROLES em constants.ts, não MGMT_ROLES (inclui LIDER, que o
// backend não autoriza aqui). Ficam desmontadas (não só escondidas) para
// quem não tem acesso, para não disparar pedidos que dariam 403/404.
// "Planos de Integração" (templates) não tem @Roles() na leitura — aberto a
// todos; "+ Atribuir plano" é ADMIN/RH e "+ Novo template" é
// EVAL_CREATOR_ROLES (ADMIN, GESTOR, RH, DIRECTOR, LIDER), espelhando
// POST /onboarding e POST /onboarding/templates.

import { useState } from 'react';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { ADMIN_ROLES, EVAL_CREATOR_ROLES, EXECUTIVE_ROLES, filterByRole } from '@/lib/roles';
import { TABS } from '@/components/onboarding/constants';
import { AssignPlanModal } from '@/components/onboarding/AssignPlanModal';
import { TemplateFormModal } from '@/components/onboarding/TemplateFormModal';
import { OverviewTab } from '@/components/onboarding/OverviewTab';
import { MyPlanView } from '@/components/onboarding/MyPlanView';
import { OnboardingsTab } from '@/components/onboarding/OnboardingsTab';
import { IntegrationPlansTab } from '@/components/onboarding/IntegrationPlansTab';
import { StagesTab } from '@/components/onboarding/StagesTab';
import { TasksTab } from '@/components/onboarding/TasksTab';
import { DocumentsTab } from '@/components/onboarding/DocumentsTab';
import { TrainingTab } from '@/components/onboarding/TrainingTab';
import { CheckinsTab } from '@/components/onboarding/CheckinsTab';
import { IntegrationEvaluationTab } from '@/components/onboarding/IntegrationEvaluationTab';
import { ReportsTab } from '@/components/onboarding/ReportsTab';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

export default function OnboardingPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [showAssign, setShowAssign] = useState(false);

  const role = useCurrentRole();
  const visibleTabs = filterByRole(TABS, role);
  // Editar/apagar template, gestão de tarefas do template, POST
  // /onboarding e DELETE /onboarding/:id são @Roles(ADMIN, RH).
  const canManage = !!role && ADMIN_ROLES.includes(role);
  // Criar plano de integração — @Roles(ADMIN, GESTOR, RH, DIRECTOR, LIDER)
  // em POST /onboarding/templates.
  const canCreateTemplate = !!role && EVAL_CREATOR_ROLES.includes(role);
  const isMgmt = !!role && EXECUTIVE_ROLES.includes(role);

  return (
    <div className="min-h-screen bg-canvas">
      <div className="border-b border-border bg-surface px-6 py-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <h1 className="font-display text-xl font-bold text-ink">Onboarding</h1>
        </div>
      </div>

      <Tabs defaultValue="my-plan">
        <div className="border-b border-border bg-surface px-6">
          <TabsList className="mx-auto max-w-7xl overflow-x-auto gap-0">
            {visibleTabs.map((t) => {
              const Icon = t.icon;
              return (
                <TabsTrigger key={t.id} value={t.id} className="gap-2 whitespace-nowrap">
                  <Icon size={16} strokeWidth={1.75} />
                  {t.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        <div className="mx-auto max-w-7xl px-6 py-6">
          <TabsContent value="my-plan">
            <MyPlanView />
          </TabsContent>

          {visibleTabs.some((t) => t.id === 'overview') && (
            <TabsContent value="overview">
              <OverviewTab canManagePlan={canManage} canManageTasks={isMgmt} />
            </TabsContent>
          )}

          {visibleTabs.some((t) => t.id === 'plans') && (
            <TabsContent value="plans">
              <div className="mb-4 flex items-center justify-end">
                {canManage && (
                  <Button size="sm" onClick={() => setShowAssign(true)}>
                    + Atribuir plano
                  </Button>
                )}
              </div>
              <OnboardingsTab canManagePlan={canManage} canManageTasks={isMgmt} />
            </TabsContent>
          )}

          <TabsContent value="templates">
            <div className="mb-4 flex items-center justify-end">
              {canCreateTemplate && (
                <Button size="sm" onClick={() => setShowCreate(true)}>
                  + Novo template
                </Button>
              )}
            </div>
            <IntegrationPlansTab canManage={canManage} />
          </TabsContent>

          <TabsContent value="stages">
            <StagesTab />
          </TabsContent>

          {visibleTabs.some((t) => t.id === 'tasks') && (
            <TabsContent value="tasks">
              <TasksTab canManagePlan={canManage} canManageTasks={isMgmt} />
            </TabsContent>
          )}

          {visibleTabs.some((t) => t.id === 'documents') && (
            <TabsContent value="documents">
              <DocumentsTab canManagePlan={canManage} canManageTasks={isMgmt} />
            </TabsContent>
          )}

          {visibleTabs.some((t) => t.id === 'training') && (
            <TabsContent value="training">
              <TrainingTab canManagePlan={canManage} canManageTasks={isMgmt} />
            </TabsContent>
          )}

          {visibleTabs.some((t) => t.id === 'checkins') && (
            <TabsContent value="checkins">
              <CheckinsTab />
            </TabsContent>
          )}

          {visibleTabs.some((t) => t.id === 'integration-evaluations') && (
            <TabsContent value="integration-evaluations">
              <IntegrationEvaluationTab />
            </TabsContent>
          )}

          {visibleTabs.some((t) => t.id === 'reports') && (
            <TabsContent value="reports">
              <ReportsTab />
            </TabsContent>
          )}
        </div>
      </Tabs>

      {showCreate && <TemplateFormModal onClose={() => setShowCreate(false)} />}
      {showAssign && <AssignPlanModal onClose={() => setShowAssign(false)} />}
    </div>
  );
}
