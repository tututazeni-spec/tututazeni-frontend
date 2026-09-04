// src/app/(dashboard)/events/page.tsx
'use client';

// Container: gere a navegação (catálogo/os meus eventos/detalhe/
// organizador); delega dados+apresentação de cada separador aos
// componentes auto-contidos em components/events/. Ver memory
// project_innova_component_separation_audit. Migrado para a fundação
// de design: Button da fundação substitui os botões/tabs bespoke.
//
// O botão "Criar evento" abria só um toast placeholder — ver memory
// project_innova_frontend_placeholder_toast_buttons. Agora monta o
// CreateEventModal (POST /events), visível apenas para ADMIN/RH/GESTOR
// (espelha @Roles em src/events/events.controller.ts#create).

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import type { Role } from '@/lib/roles';
import { NAV, TITLES } from '@/components/events/constants';
import { CatalogView } from '@/components/events/CatalogView';
import { CreateEventModal } from '@/components/events/CreateEventModal';
import { DetailView } from '@/components/events/DetailView';
import { MyEventsView } from '@/components/events/MyEventsView';
import { OrganizerView } from '@/components/events/OrganizerView';
import type { Nav } from '@/components/events/types';
import { Button } from '@/components/ui/Button';

// Espelha @Roles(ADMIN, RH, GESTOR) em src/events/events.controller.ts#create.
const CAN_CREATE_ROLES: readonly Role[] = ['ADMIN', 'RH', 'GESTOR'];

export default function EventsPage() {
  const role = useCurrentRole();
  const canCreate = !!role && CAN_CREATE_ROLES.includes(role);

  const [nav, setNav] = useState<Nav>({ view: 'catalog' });
  const [showCreate, setShowCreate] = useState(false);

  const handleSelect = (id: number) =>
    setNav({ view: 'detail', selectedId: id });
  const handleBack = () => setNav({ view: 'catalog' });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="mb-1">
            <h1 className="font-display text-xl font-semibold text-ink">
              {TITLES[nav.view]}
            </h1>
          </div>
        </div>
        {nav.view !== 'detail' && canCreate && (
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus size={14} strokeWidth={1.75} />
            Criar evento
          </Button>
        )}
        {nav.view === 'detail' && (
          <Button intent="ghost" size="sm" onClick={handleBack}>
            ← Voltar
          </Button>
        )}
      </div>

      {nav.view !== 'detail' && (
        <div className="mb-6 flex w-fit gap-1 rounded-card bg-surface-sunken p-1">
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

      {nav.view === 'catalog' && <CatalogView onSelect={handleSelect} />}
      {nav.view === 'my-events' && <MyEventsView onSelect={handleSelect} />}
      {nav.view === 'organizer' && <OrganizerView />}
      {nav.view === 'detail' && (
        <DetailView eventId={nav.selectedId} onBack={handleBack} />
      )}

      {showCreate && <CreateEventModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
