// src/app/(dashboard)/departments/page.tsx
'use client';

// Container: gere a navegação (lista/detalhe/dashboard);
// delega dados+apresentação de cada separador aos componentes
// auto-contidos em components/departments/. Ver memory
// project_innova_component_separation_audit.

import { PillNav } from '@/components/ui/PillTabs';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { queryKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/Button';
import { NAV, TITLES } from '@/components/departments/constants';
import { CreateDepartmentModal } from '@/components/departments/CreateDepartmentModal';
import { DashboardView } from '@/components/departments/DashboardView';
import { DetailView } from '@/components/departments/DetailView';
import { EmployeesView } from '@/components/departments/EmployeesView';
import { HeadsView } from '@/components/departments/HeadsView';
import { HierarchyView } from '@/components/departments/HierarchyView';
import { HistoryView } from '@/components/departments/HistoryView';
import { ListView } from '@/components/departments/ListView';
import { PositionsView } from '@/components/departments/PositionsView';
import { ReportsView } from '@/components/departments/ReportsView';
import { StructureView } from '@/components/departments/StructureView';
import type { Nav } from '@/components/departments/types';

export default function DepartmentsPage() {
  const [nav, setNav] = useState<Nav>({ view: 'list' });
  const [createOpen, setCreateOpen] = useState(false);

  const handleSelect = (id: number) =>
    setNav({ view: 'detail', selectedId: id });
  const handleBack = () => setNav({ view: 'list' });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">{TITLES[nav.view]}</h1>
          <p className="mt-0.5 text-sm text-ink-faint"></p>
        </div>
        {nav.view === 'list' && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={16} strokeWidth={1.75} />
            Novo departamento
          </Button>
        )}
      </div>

      {createOpen && (
        <CreateDepartmentModal
          endpoint="/departments"
          invalidateKeys={[queryKeys.departments.all]}
          onClose={() => setCreateOpen(false)}
        />
      )}

      {nav.view !== 'detail' && (
        <PillNav
          items={NAV}
          value={nav.view}
          onChange={(id) => setNav({ view: id } as Nav)}
          label="Departamentos"
          className="mb-6"
        />
      )}

      {/* Views */}
      {nav.view === 'list' && <ListView onSelect={handleSelect} />}
      {nav.view === 'structure' && <StructureView onSelect={handleSelect} />}
      {nav.view === 'heads' && <HeadsView />}
      {nav.view === 'employees' && <EmployeesView />}
      {nav.view === 'positions' && <PositionsView />}
      {nav.view === 'hierarquia' && <HierarchyView />}
      {nav.view === 'historico' && <HistoryView />}
      {nav.view === 'relatorios' && <ReportsView />}
      {nav.view === 'detail' && (
        <DetailView deptId={nav.selectedId} onBack={handleBack} />
      )}
      {nav.view === 'dashboard' && <DashboardView onSelect={handleSelect} />}
    </div>
  );
}
