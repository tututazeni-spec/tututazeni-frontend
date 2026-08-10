// src/app/(dashboard)/events/page.tsx
'use client';

// Container: gere a navegação (catálogo/os meus eventos/detalhe/
// organizador); delega dados+apresentação de cada separador aos
// componentes auto-contidos em components/events/. Ver memory
// project_innova_component_separation_audit.

import { useState } from 'react';
import { NAV, TITLES } from '@/components/events/constants';
import { CatalogView } from '@/components/events/CatalogView';
import { DetailView } from '@/components/events/DetailView';
import { MyEventsView } from '@/components/events/MyEventsView';
import { OrganizerView } from '@/components/events/OrganizerView';
import type { Nav } from '@/components/events/types';

export default function EventsPage() {
  const [nav, setNav] = useState<Nav>({ view: 'catalog' });

  const handleSelect = (id: number) =>
    setNav({ view: 'detail', selectedId: id });
  const handleBack = () => setNav({ view: 'catalog' });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            {TITLES[nav.view]}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            INNOVA — Eventos Corporativos
          </p>
        </div>
        {nav.view !== 'detail' && (
          <button
            onClick={() => alert('Abrir formulário de criação de evento')}
            className="px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800"
          >
            + Criar evento
          </button>
        )}
        {nav.view === 'detail' && (
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200"
          >
            ← Voltar
          </button>
        )}
      </div>

      {nav.view !== 'detail' && (
        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => setNav({ view: n.id })}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${nav.view === n.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {n.label}
            </button>
          ))}
        </div>
      )}

      {nav.view === 'catalog' && <CatalogView onSelect={handleSelect} />}
      {nav.view === 'my-events' && <MyEventsView onSelect={handleSelect} />}
      {nav.view === 'organizer' && <OrganizerView />}
      {nav.view === 'detail' && (
        <DetailView eventId={nav.selectedId} onBack={handleBack} />
      )}
    </div>
  );
}
