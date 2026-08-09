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
  const [nav, setNav] = useState<Nav>({ view: 'library' });

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
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            {titles[nav.view]}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            INNOVA — Process Standard (BPM/SOP)
          </p>
        </div>
        {nav.view === 'library' && (
          <button
            onClick={() => alert('Abrir formulário de criação de processo')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800"
          >
            + Novo processo
          </button>
        )}
      </div>

      {/* Tabs (não mostrar em viewer/runner) */}
      {nav.view !== 'viewer' && nav.view !== 'runner' && (
        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => setNav({ view: n.id })}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                nav.view === n.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {n.label}
            </button>
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
    </div>
  );
}
