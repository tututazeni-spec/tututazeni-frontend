'use client';

// Container: gere a navegação (catálogo/detalhe/minhas trilhas/
// dashboard); delega dados+apresentação de cada separador aos
// componentes auto-contidos em components/learning-paths/. Ver memory
// project_innova_component_separation_audit.

import { useState } from 'react';
import { NAV, TITLES } from '@/components/learning-paths/constants';
import { CatalogView } from '@/components/learning-paths/CatalogView';
import { DashboardView } from '@/components/learning-paths/DashboardView';
import { LPDetailView } from '@/components/learning-paths/LPDetailView';
import { MyPathsView } from '@/components/learning-paths/MyPathsView';
import type { Nav } from '@/components/learning-paths/types';

export default function LearningPathsPage() {
  const [nav, setNav] = useState<Nav>({ view: 'catalog' });

  const handleSelect = (id: number) =>
    setNav({ view: 'detail', selectedId: id });
  const handleBack = () => setNav({ view: 'catalog' });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            {TITLES[nav.view]}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            INNOVA — Academia Corporativa
          </p>
        </div>
        {nav.view === 'catalog' && (
          <button
            onClick={() => alert('Abrir formulário de criação de trilha')}
            className="px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800"
          >
            + Criar trilha
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

      {nav.view === 'catalog' && <CatalogView onSelect={handleSelect} />}
      {nav.view === 'detail' && (
        <LPDetailView pathId={nav.selectedId} onBack={handleBack} />
      )}
      {nav.view === 'my-paths' && <MyPathsView onSelect={handleSelect} />}
      {nav.view === 'dashboard' && <DashboardView onSelect={handleSelect} />}
    </div>
  );
}
