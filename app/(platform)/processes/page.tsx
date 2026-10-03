'use client';

// ─── app/(platform)/processes/page.tsx ───────────────────────────────────────
// INNOVA — Módulo Processes (docs/Modulo_Processes.md).
//
// Container: gere a navegação entre as 12 abas do §2 e as vistas de detalhe
// (viewer/runner). Cada aba é auto-contida. Abas ainda não implementadas
// mostram um estado vazio até à fase respectiva. Nota: este ficheiro tinha
// sido sobrescrito pelo código da página de eventos (#491) — restaurado.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { Hammer, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { ADMIN_ROLES, type Role } from '@/lib/roles';
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
import { NAV } from '@/components/processes/constants';
import type { Nav } from '@/components/processes/types';

// Espelha @Roles(ADMIN, RH, GESTOR) em GET /processes/dashboard
// (src/process-standard/process-standard.controller.ts).
const OVERVIEW_ROLES: readonly Role[] = ['ADMIN', 'RH', 'GESTOR'];
// Espelha @Roles(ADMIN, RH, GESTOR) em POST /processes/:id/start e nas
// acções de gestão de instâncias/tarefas.
const MANAGE_ROLES: readonly Role[] = ['ADMIN', 'RH', 'GESTOR'];
// Espelha @Roles(ADMIN, RH) nas rotas /processes/automations.
const AUTOMATION_ROLES: readonly Role[] = ['ADMIN', 'RH'];
// Espelha @Roles em GET /processes/reports (ver) e /reports/export (exportar).
const REPORT_ROLES: readonly Role[] = ['ADMIN', 'RH', 'GESTOR', 'AUDITOR'];
const REPORT_EXPORT_ROLES: readonly Role[] = ['ADMIN', 'RH', 'GESTOR'];

export default function ProcessesPage() {
  const role = useCurrentRole();
  const canCreate = !!role && ADMIN_ROLES.includes(role);
  const canSeeOverview = !!role && OVERVIEW_ROLES.includes(role);
  const canManage = !!role && MANAGE_ROLES.includes(role);
  const canAutomate = !!role && AUTOMATION_ROLES.includes(role);
  const canSeeReports = !!role && REPORT_ROLES.includes(role);
  const canExportReports = !!role && REPORT_EXPORT_ROLES.includes(role);

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
      (n.id !== 'reports' || canSeeReports),
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
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Título fixo; a descrição muda com a aba (§21) */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">
            Processos
          </h1>
          {activeTab && (
            <p className="mt-1 font-body text-sm text-ink-muted">
              {activeTab.description}
            </p>
          )}
        </div>
        {nav.view === 'all' && canManage && (
          <Button onClick={() => setShowStart(true)}>
            <Plus size={16} strokeWidth={1.75} />
            Novo processo
          </Button>
        )}
        {nav.view === 'templates' && canCreate && (
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={16} strokeWidth={1.75} />
            Novo modelo
          </Button>
        )}
      </div>

      {/* Abas (escondidas em viewer/runner) */}
      {nav.view !== 'viewer' && nav.view !== 'runner' && (
        <div className="mb-6 flex w-full flex-wrap items-center gap-2">
          {tabs.map((n) => (
            <button
              key={n.id}
              onClick={() => setNav({ view: n.id })}
              className={`whitespace-nowrap rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                nav.view === n.id
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-white text-ink-muted hover:text-ink'
              }`}
            >
              {n.label}
            </button>
          ))}
        </div>
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
        <TaskRunner instanceId={nav.instanceId} onBack={handleBack} />
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
