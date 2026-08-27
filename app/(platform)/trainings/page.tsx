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
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">
            {TITLES[nav.view]}
          </h1>
          <p className="mt-0.5 font-body text-sm text-ink-faint">
          </p>
        </div>
      </div>

      {nav.view !== 'detail' && (
        <div className="mb-6 flex w-fit gap-1 rounded-xl bg-surface-sunken p-1">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => setNav({ view: n.id })}
              className={`rounded-lg px-4 py-2 font-body text-sm font-medium transition-colors ${
                nav.view === n.id
                  ? 'bg-surface text-ink shadow-resting'
                  : 'text-ink-muted hover:text-ink'
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
