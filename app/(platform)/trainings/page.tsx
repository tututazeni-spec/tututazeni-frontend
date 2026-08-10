// src/app/(dashboard)/trainings/page.tsx
'use client';

// Container: gere a navegação (catálogo/detalhe/os meus treinamentos/
// dashboard); delega dados+apresentação de cada separador aos
// componentes auto-contidos em components/trainings/. Ver memory
// project_innova_component_separation_audit.

import { useState } from 'react';
import { NAV, TITLES } from '@/components/trainings/constants';
import { CatalogView } from '@/components/trainings/CatalogView';
import { DashboardView } from '@/components/trainings/DashboardView';
import { DetailView } from '@/components/trainings/DetailView';
import { MyTrainingsView } from '@/components/trainings/MyTrainingsView';
import type { Nav } from '@/components/trainings/types';

export default function TrainingsPage() {
  const [nav, setNav] = useState<Nav>({ view: 'catalog' });

  const handleSelect = (id: number) =>
    setNav({ view: 'detail', selectedId: id });
  const handleBack = () => setNav({ view: 'catalog' });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            {TITLES[nav.view]}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            INNOVA — Gestão de Treinamentos
          </p>
        </div>
      </div>

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

      {nav.view === 'catalog' && <CatalogView onSelect={handleSelect} />}
      {nav.view === 'detail' && (
        <DetailView trainingId={nav.selectedId} onBack={handleBack} />
      )}
      {nav.view === 'my-trainings' && (
        <MyTrainingsView onSelect={handleSelect} />
      )}
      {nav.view === 'dashboard' && <DashboardView />}
    </div>
  );
}
