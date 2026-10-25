'use client';

// ─── app/(platform)/processes/page.tsx ───────────────────────────────────────
// INNOVA — Módulo Processes (docs/Modulo_Processes.md).
//
// Container: gere a navegação entre as 12 abas do §2 e as vistas de detalhe
// (viewer/runner). Cada aba é auto-contida. Abas ainda não implementadas
// mostram um estado vazio até à fase respectiva. Nota: este ficheiro tinha
// sido sobrescrito pelo código da página de eventos (#491) — restaurado.
// ─────────────────────────────────────────────────────────────────────────────

import { PillNav } from '@/components/ui/PillTabs';
import { BANNER_TABS_CLASS, ModuleBanner } from '@/components/ui/ModuleBanner';
import { useState } from 'react';
import { Hammer, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useHasRole } from '@/hooks/useCurrentRole';
import { ADMIN_RH_GESTOR_ROLES, ADMIN_ROLES, type Role } from '@/lib/roles';
import { CreateProcessModal } from '@/components/processes/CreateProcessModal';
import { DashboardView } from '@/components/processes/DashboardView';
import { LibraryView } from '@/components/processes/LibraryView';
import { InstancesView } from '@/components/processes/InstancesView';
import { StartProcessModal } from '@/components/processes/StartProcessModal';
import { TasksView } from '@/components/processes/TasksView';
import { ProcessViewer } from '@/components/processes/ProcessViewer';
import { TaskRunner } from '@/components/processes/TaskRunner';
import { ApprovalsView } from '@/components/processes/ApprovalsView';
import { WorkflowsView } from '@/components/processes/WorkflowsView';
import { AutomationsView } from '@/components/processes/AutomationsView';
import { CalendarView } from '@/components/processes/CalendarView';
import { DocumentsView } from '@/components/processes/DocumentsView';
import { ReportsView } from '@/components/processes/ReportsView';
import { HistoryView } from '@/components/processes/HistoryView';
import { SettingsView } from '@/components/processes/SettingsView';
import { NAV } from '@/components/processes/constants';
import type { Nav } from '@/components/processes/types';

// Espelha @Roles(ADMIN, RH, GESTOR) em GET /processes/dashboard
// (src/process-standard/process-standard.controller.ts).
const OVERVIEW_ROLES: readonly Role[] = ADMIN_RH_GESTOR_ROLES;
// Espelha @Roles(ADMIN, RH, GESTOR) em POST /processes/:id/start e nas
// acções de gestão de instâncias/tarefas.
const MANAGE_ROLES: readonly Role[] = ADMIN_RH_GESTOR_ROLES;
// Espelha @Roles de POST /processes/:id/start (§20): gestão, ou pedidos próprios
// em modelos abertos à função (AUDITOR e INSTRUCTOR não iniciam processos).
const START_ROLES: readonly Role[] = [
  'ADMIN',
  'RH',
  'GESTOR',
  'DIRECTOR',
  'LIDER',
  'COLABORADOR',
];
// Espelha @Roles(ADMIN, RH) nas rotas /processes/automations.
const AUTOMATION_ROLES: readonly Role[] = ADMIN_ROLES;
// Espelha @Roles em GET /processes/reports (ver) e /reports/export (exportar).
const REPORT_ROLES: readonly Role[] = ['ADMIN', 'RH', 'GESTOR', 'AUDITOR'];
const REPORT_EXPORT_ROLES: readonly Role[] = ADMIN_RH_GESTOR_ROLES;
// Espelha @Roles em GET /processes/audit/* (ver) e /audit/export (exportar).
const AUDIT_ROLES: readonly Role[] = ['ADMIN', 'RH', 'AUDITOR'];
const AUDIT_EXPORT_ROLES: readonly Role[] = ['ADMIN', 'AUDITOR'];
// Espelha @Roles em GET /processes/settings|integrations (ver), PUT /settings/:key
// (só ADMIN) e POST /integrations/logs/:id/retry (ADMIN, RH).
const SETTINGS_EDIT_ROLES: readonly Role[] = ['ADMIN'];
const INTEGRATION_RETRY_ROLES: readonly Role[] = ADMIN_ROLES;

export default function ProcessesPage() {
  const canCreate = useHasRole(ADMIN_ROLES);
  const canSeeOverview = useHasRole(OVERVIEW_ROLES);
  const canManage = useHasRole(MANAGE_ROLES);
  const canStart = useHasRole(START_ROLES);
  const canAutomate = useHasRole(AUTOMATION_ROLES);
  const canSeeReports = useHasRole(REPORT_ROLES);
  const canExportReports = useHasRole(REPORT_EXPORT_ROLES);
  const canSeeAudit = useHasRole(AUDIT_ROLES);
  const canExportAudit = useHasRole(AUDIT_EXPORT_ROLES);
  const canEditSettings = useHasRole(SETTINGS_EDIT_ROLES);
  const canRetryIntegrations = useHasRole(INTEGRATION_RETRY_ROLES);

  const [nav, setNav] = useState<Nav>({ view: 'all' });
  const [showCreate, setShowCreate] = useState(false);
  const [showStart, setShowStart] = useState(false);

  // Visão Geral é a aba inicial para quem pode vê-la; antes de o role
  // carregar, ou para os restantes, arranca em "Todos os Processos".
  const [overviewDefaulted, setOverviewDefaulted] = useState(false);
  if (canSeeOverview && !overviewDefaulted) {
    setOverviewDefaulted(true);
    setNav({ view: 'overview' });
  }

  const tabs = NAV.filter(
    (n) =>
      (n.id !== 'overview' || canSeeOverview) &&
      (n.id !== 'automations' || canAutomate) &&
      (n.id !== 'reports' || canSeeReports) &&
      (n.id !== 'history' || canSeeAudit) &&
      (n.id !== 'settings' || canSeeAudit),
  );
  const activeTab = tabs.find((n) => n.id === nav.view);

  const handleStartInstance = (instanceId: number) => {
    setNav({
      view: 'runner',
      instanceId,
      processId: nav.view === 'viewer' ? nav.processId : null,
    });
  };

  const handleBack = () => {
    if (nav.view === 'runner' && nav.processId !== null) {
      setNav({ view: 'viewer', processId: nav.processId });
    } else {
      setNav({ view: 'templates' });
    }
  };

  const openInstance = (instanceId: number) =>
    setNav({ view: 'runner', instanceId, processId: null });

  return (
    <div
      className={`mx-auto px-4 py-8 ${['all', 'approvals', 'documents', 'tasks'].includes(nav.view) ? 'max-w-[1500px]' : 'max-w-6xl'}`}
    >
      {/* Título fixo; a descrição muda com a aba (§21) */}
      <ModuleBanner
        src="/images/processos.jpg"
        title="Processos"
        hint={activeTab?.description}
        className={
          nav.view === 'viewer' || nav.view === 'runner' ? 'mb-6' : undefined
        }
        action={
          nav.view === 'all' && canStart ? (
            <Button onClick={() => setShowStart(true)}>
              <Plus size={16} strokeWidth={1.75} />
              Novo processo
            </Button>
          ) : nav.view === 'templates' && canCreate ? (
            <Button onClick={() => setShowCreate(true)}>
              <Plus size={16} strokeWidth={1.75} />
              Novo modelo
            </Button>
          ) : undefined
        }
      />

      {/* Abas (escondidas em viewer/runner) */}
      {nav.view !== 'viewer' && nav.view !== 'runner' && (
        <PillNav
          items={tabs}
          value={nav.view}
          onChange={(id) => setNav({ view: id } as Nav)}
          label="Processos"
          className={BANNER_TABS_CLASS}
        />
      )}

      {nav.view === 'overview' && canSeeOverview && (
        <DashboardView onOpenInstance={openInstance} />
      )}
      {nav.view === 'all' && (
        <InstancesView canManage={canManage} onOpenInstance={openInstance} />
      )}
      {nav.view === 'templates' && (
        <LibraryView
          onSelect={(id) => setNav({ view: 'viewer', processId: id })}
        />
      )}
      {nav.view === 'tasks' && <TasksView canManage={canManage} />}
      {nav.view === 'approvals' && <ApprovalsView canManage={canManage} />}
      {nav.view === 'workflows' && <WorkflowsView canEdit={canCreate} />}
      {nav.view === 'automations' && canAutomate && (
        <AutomationsView canManage={canAutomate} />
      )}
      {nav.view === 'calendar' && (
        <CalendarView canManage={canManage} onOpenInstance={openInstance} />
      )}
      {nav.view === 'documents' && (
        <DocumentsView canManage={canManage} onOpenInstance={openInstance} />
      )}
      {nav.view === 'reports' && canSeeReports && (
        <ReportsView
          canExport={canExportReports}
          onOpenInstance={openInstance}
        />
      )}
      {nav.view === 'history' && canSeeAudit && (
        <HistoryView canExport={canExportAudit} onOpenInstance={openInstance} />
      )}
      {nav.view === 'settings' && canSeeAudit && (
        <SettingsView
          canEdit={canEditSettings}
          canRetry={canRetryIntegrations}
          onOpenInstance={openInstance}
        />
      )}
      {nav.view === 'viewer' && (
        <ProcessViewer
          processId={nav.processId}
          canEdit={canCreate}
          canStart={canManage}
          onBack={handleBack}
          onStartInstance={handleStartInstance}
          onOpenTemplate={(id) => setNav({ view: 'viewer', processId: id })}
        />
      )}
      {nav.view === 'runner' && (
        <TaskRunner
          instanceId={nav.instanceId}
          onBack={handleBack}
          canViewAll={canSeeReports}
        />
      )}
      {activeTab && !activeTab.ready && (
        <EmptyState
          icon={Hammer}
          title={`${activeTab.label} — em desenvolvimento`}
          description="Esta aba será disponibilizada numa próxima fase do módulo."
          className="mx-auto max-w-xl"
        />
      )}

      {showCreate && (
        <CreateProcessModal onClose={() => setShowCreate(false)} />
      )}
      {showStart && (
        <StartProcessModal
          onClose={() => setShowStart(false)}
          onCreated={(id) => {
            setShowStart(false);
            openInstance(id);
          }}
        />
      )}
    </div>
  );
}
