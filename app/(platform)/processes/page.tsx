'use client';

// ─── app/(dashboard)/processes/page.tsx ──────────────────────────────────────
// INNOVA — Process Standard (BPM/SOP)
//
// Container: gere a navegação entre os 5 separadores/vistas (cada um
// auto-contido — dados + apresentação, mesmo padrão de
// components/payslips/page.tsx). Ver memory
// project_innova_component_separation_audit.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { ADMIN_ROLES } from '@/lib/roles';
import { CreateProcessModal } from '@/components/processes/CreateProcessModal';
import { DashboardView } from '@/components/processes/DashboardView';
import { LibraryView } from '@/components/processes/LibraryView';
import { MyTasksView } from '@/components/processes/MyTasksView';
import { ProcessViewer } from '@/components/processes/ProcessViewer';
import { TaskRunner } from '@/components/processes/TaskRunner';

type TabKey = 'library' | 'tasks' | 'dashboard';

type Nav =
  | { view: 'library' }
  | { view: 'tasks' }
  | { view: 'dashboard' }
  | { view: 'viewer'; processId: number }
  | { view: 'runner'; instanceId: number; processId: number | null };

const NAV: Array<{ id: TabKey; label: string }> = [
  { id: 'library', label: 'Biblioteca' },
  { id: 'tasks', label: 'Minhas tarefas' },
  { id: 'dashboard', label: 'Dashboard' },
];

export default function ProcessStandardPage() {
  const role = useCurrentRole();
  const canCreate = !!role && ADMIN_ROLES.includes(role);

  const [nav, setNav] = useState<Nav>({ view: 'library' });
  const [showCreate, setShowCreate] = useState(false);

  const handleSelectProcess = (id: number) => {
    setNav({ view: 'viewer', processId: id });
  };

  const handleStartInstance = (instanceId: number) => {
    setNav({
      view: 'runner',
      instanceId,
      processId: nav.view === 'viewer' ? nav.processId : null,
    });
  };

  const handleOpenInstance = (instanceId: number) => {
    setNav({ view: 'runner', instanceId, processId: null });
  };

  const handleBack = () => {
    if (nav.view === 'runner' && nav.processId !== null) {
      setNav({ view: 'viewer', processId: nav.processId });
    } else {
      setNav({ view: 'library' });
    }
  };

  const titles: Record<Nav['view'], string> = {
    library: 'Biblioteca de Processos',
    viewer: 'Visualizar Processo',
    runner: 'Executar Processo',
    tasks: 'Minhas Tarefas',
    dashboard: 'Dashboard Operacional',
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">
            {titles[nav.view]}
          </h1>
        </div>
        {nav.view === 'library' && canCreate && (
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={16} strokeWidth={1.75} />
            Novo processo
          </Button>
        )}
      </div>

      {/* Tabs (não mostrar em viewer/runner) */}
      {nav.view !== 'viewer' && nav.view !== 'runner' && (
        <div className="mb-6 flex w-fit gap-1 rounded-card bg-surface-sunken p-1">
          {NAV.map((n) => (
            <Button
              key={n.id}
              size="sm"
              intent={nav.view === n.id ? 'primary' : 'ghost'}
              onClick={() => setNav({ view: n.id })}
            >
              {n.label}
            </Button>
          ))}
        </div>
      )}

      {/* Views */}
      {nav.view === 'library' && <LibraryView onSelect={handleSelectProcess} />}
      {nav.view === 'viewer' && (
        <ProcessViewer
          processId={nav.processId}
          onBack={handleBack}
          onStartInstance={handleStartInstance}
        />
      )}
      {nav.view === 'runner' && (
        <TaskRunner instanceId={nav.instanceId} onBack={handleBack} />
      )}
      {nav.view === 'tasks' && (
        <MyTasksView onOpenInstance={handleOpenInstance} />
      )}
      {nav.view === 'dashboard' && (
        <DashboardView onOpenInstance={handleOpenInstance} />
      )}

      {showCreate && (
        <CreateProcessModal onClose={() => setShowCreate(false)} />
      )}
    </div>
  );
}
