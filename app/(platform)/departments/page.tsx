// src/app/(dashboard)/departments/page.tsx
'use client';

// Container: gere a navegação (lista/organograma/detalhe/dashboard);
// delega dados+apresentação de cada separador aos componentes
// auto-contidos em components/departments/. Ver memory
// project_innova_component_separation_audit.

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { queryKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/Button';
import { NAV, TITLES } from '@/components/departments/constants';
import { CreateDepartmentModal } from '@/components/departments/CreateDepartmentModal';
import { DashboardView } from '@/components/departments/DashboardView';
import { DetailView } from '@/components/departments/DetailView';
import { ListView } from '@/components/departments/ListView';
import { TreeView } from '@/components/departments/TreeView';
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

      {/* Tabs — formato de "cartão": cada botão é um cartão independente
          (borda + fundo branco + rounded), sem o fundo/pill de grupo
          anterior. Alinhadas horizontal e verticalmente (justify-center +
          items-center no wrapper) com largura mínima uniforme. Estado
          activo usa a mesma condição `nav.view === n.id` de sempre para
          aplicar destaque azul (borda/fundo/texto primary). */}
      {nav.view !== 'detail' && (
        <div className="mb-6 flex w-full flex-wrap items-center justify-center gap-2">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => setNav({ view: n.id })}
              className={`flex min-w-[140px] items-center justify-center whitespace-nowrap rounded-lg border px-4 py-2 text-center text-sm font-medium transition-colors ${
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