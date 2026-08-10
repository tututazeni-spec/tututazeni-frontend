// src/app/(dashboard)/departments/page.tsx
'use client';

// Container: gere a navegação (lista/organograma/detalhe/dashboard);
// delega dados+apresentação de cada separador aos componentes
// auto-contidos em components/departments/. Ver memory
// project_innova_component_separation_audit.

import { useState } from 'react';
import { NAV, TITLES } from '@/components/departments/constants';
import { DashboardView } from '@/components/departments/DashboardView';
import { DetailView } from '@/components/departments/DetailView';
import { ListView } from '@/components/departments/ListView';
import { TreeView } from '@/components/departments/TreeView';
import type { Nav } from '@/components/departments/types';

export default function DepartmentsPage() {
  const [nav, setNav] = useState<Nav>({ view: 'list' });

  const handleSelect = (id: number) =>
    setNav({ view: 'detail', selectedId: id });
  const handleBack = () => setNav({ view: 'list' });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            {TITLES[nav.view]}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            INNOVA — Estrutura Organizacional
          </p>
        </div>
        {nav.view === 'list' && (
          <button
            onClick={() => alert('Abrir formulário de criação de departamento')}
            className="px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800"
          >
            + Novo departamento
          </button>
        )}
      </div>

      {/* Tabs */}
      {nav.view !== 'detail' && (
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
      {nav.view === 'list' && <ListView onSelect={handleSelect} />}
      {nav.view === 'tree' && <TreeView onSelect={handleSelect} />}
      {nav.view === 'detail' && (
        <DetailView deptId={nav.selectedId} onBack={handleBack} />
      )}
      {nav.view === 'dashboard' && <DashboardView onSelect={handleSelect} />}
    </div>
  );
}
