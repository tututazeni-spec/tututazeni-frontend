// src/app/(dashboard)/departments/page.tsx
'use client';

// Container: gere a navegação (lista/detalhe/dashboard);
// delega dados+apresentação de cada separador aos componentes
// auto-contidos em components/departments/. Ver memory
// project_innova_component_separation_audit.

import { PillNav } from '@/components/ui/PillTabs';
import { BANNER_TABS_CLASS, ModuleBanner } from '@/components/ui/ModuleBanner';
import { useState } from 'react';
import {
  Briefcase,
  History,
  Network,
  Plus,
  UserCog,
  Users,
  Workflow,
  type LucideIcon,
} from 'lucide-react';
import { queryKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/Button';
import { NAV, TITLES } from '@/components/departments/constants';
import { CreateDepartmentModal } from '@/components/departments/CreateDepartmentModal';
import { DashboardView } from '@/components/departments/DashboardView';
import { DepartmentsPanel } from '@/components/departments/DepartmentsPanel';
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

const PANEL_VIEWS: string[] = [
  'list',
  'structure',
  'heads',
  'employees',
  'positions',
  'hierarquia',
  'historico',
];

const PANEL_COPY: Record<
  string,
  {
    title: string;
    subtitle: string;
    icon: LucideIcon;
    imagePosition?: string;
    showImage?: boolean;
  }
> = {
  list: {
    title: 'Departamentos',
    subtitle: 'Organização da sua empresa',
    icon: Network,
  },
  structure: {
    title: 'Estrutura',
    subtitle: 'Árvore organizacional',
    icon: Workflow,
    imagePosition: '42%',
  },
  heads: {
    title: 'Responsáveis',
    subtitle: 'Chefias dos departamentos',
    icon: UserCog,
    showImage: false,
  },
  employees: {
    title: 'Colaboradores',
    subtitle: 'Pessoas por departamento',
    icon: Users,
    showImage: false,
  },
  positions: {
    title: 'Cargos e funções',
    subtitle: 'Posições e vagas',
    icon: Briefcase,
    imagePosition: '22%',
  },
  hierarquia: {
    title: 'Hierarquia',
    subtitle: 'Quem reporta a quem',
    icon: Network,
  },
  historico: {
    title: 'Histórico',
    subtitle: 'Alterações à estrutura',
    icon: History,
  },
};

export default function DepartmentsPage() {
  const [nav, setNav] = useState<Nav>({ view: 'list' });
  const [createOpen, setCreateOpen] = useState(false);

  const handleSelect = (id: number) =>
    setNav({ view: 'detail', selectedId: id });
  const handleBack = () => setNav({ view: 'list' });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <ModuleBanner
        src="/images/departamentos.jpg"
        title={TITLES[nav.view]}
        hint={NAV.find((n) => n.id === nav.view)?.hint}
        className={nav.view === 'detail' ? 'mb-6' : undefined}
        action={
          nav.view === 'list' ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus size={16} strokeWidth={1.75} />
              Novo departamento
            </Button>
          ) : undefined
        }
      />

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
          className={BANNER_TABS_CLASS}
        />
      )}

      {/* Views */}
      {PANEL_VIEWS.includes(nav.view) && (
        <DepartmentsPanel {...PANEL_COPY[nav.view]}>
          {nav.view === 'list' && <ListView onSelect={handleSelect} />}
          {nav.view === 'structure' && (
            <StructureView onSelect={handleSelect} />
          )}
          {nav.view === 'heads' && <HeadsView />}
          {nav.view === 'employees' && <EmployeesView />}
          {nav.view === 'positions' && <PositionsView />}
          {nav.view === 'hierarquia' && <HierarchyView />}
          {nav.view === 'historico' && <HistoryView />}
        </DepartmentsPanel>
      )}
      {nav.view === 'relatorios' && <ReportsView />}
      {nav.view === 'detail' && (
        <DetailView deptId={nav.selectedId} onBack={handleBack} />
      )}
      {nav.view === 'dashboard' && <DashboardView onSelect={handleSelect} />}
    </div>
  );
}
