// src/app/(dashboard)/departments/page.tsx
'use client';

// Container: gere a navegação (lista/organograma/detalhe/dashboard);
// delega dados+apresentação de cada separador aos componentes
// auto-contidos em components/departments/. Ver memory
// project_innova_component_separation_audit.

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { NAV, TITLES } from '@/components/departments/constants';
import { DashboardView } from '@/components/departments/DashboardView';
import { DetailView } from '@/components/departments/DetailView';
import { ListView } from '@/components/departments/ListView';
import { TreeView } from '@/components/departments/TreeView';
import type { Nav } from '@/components/departments/types';

export default function DepartmentsPage() {
  const notify = useToast();
  const [nav, setNav] = useState<Nav>({ view: 'list' });

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
          <Button
            onClick={() =>
              notify({
                title: 'Abrir formulário de criação de departamento',
                intent: 'info',
              })
            }
          >
            <Plus size={16} strokeWidth={1.75} />
            Novo departamento
          </Button>
        )}
      </div>

      {/* Tabs */}
      {nav.view !== 'detail' && (
        <div className="mb-6 flex w-fit gap-1 rounded-control bg-surface-sunken p-1">
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
      {nav.view === 'list' && <ListView onSelect={handleSelect} />}
      {nav.view === 'tree' && <TreeView onSelect={handleSelect} />}
      {nav.view === 'detail' && (
        <DetailView deptId={nav.selectedId} onBack={handleBack} />
      )}
      {nav.view === 'dashboard' && <DashboardView onSelect={handleSelect} />}
    </div>
  );
}
