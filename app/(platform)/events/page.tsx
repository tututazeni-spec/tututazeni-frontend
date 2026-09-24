// src/app/(dashboard)/events/page.tsx
'use client';

// Container: gere a navegação entre as abas principais do módulo
// (docs/events.md) e monta o CreateEventModal. Remodel em curso — uma
// tarefa do events.md de cada vez; cada aba arranca como placeholder
// (EmptyState) e ganha conteúdo real quando a respectiva tarefa for
// trabalhada. CatalogView/MyEventsView/OrganizerView/DetailView (nav
// anterior: catálogo/os meus eventos/organizador) ficam por agora sem
// referência — o trabalho de cada secção decide o que delas é reaproveitado.
//
// O botão "Criar evento" abria só um toast placeholder — ver memory
// project_innova_frontend_placeholder_toast_buttons. Monta o
// CreateEventModal (POST /events), visível apenas para ADMIN/RH/GESTOR
// (espelha @Roles em src/events/events.controller.ts#create).

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import type { Role } from '@/lib/roles';
import { NAV, TITLES } from '@/components/events/constants';
import { CalendarTab } from '@/components/events/CalendarTab';
import { CheckinAttendanceTab } from '@/components/events/CheckinAttendanceTab';
import { CommunicationTab } from '@/components/events/CommunicationTab';
import { CreateEventModal } from '@/components/events/CreateEventModal';
import { EvaluationTab } from '@/components/events/EvaluationTab';
import { EventsTab } from '@/components/events/EventsTab';
import { OverviewTab } from '@/components/events/OverviewTab';
import { ParticipantsTab } from '@/components/events/ParticipantsTab';
import { ReportsTab } from '@/components/events/ReportsTab';
import { ScheduleTab } from '@/components/events/ScheduleTab';
import { SpeakersGuestsTab } from '@/components/events/SpeakersGuestsTab';
import { VenuesLogisticsTab } from '@/components/events/VenuesLogisticsTab';
import type { Nav } from '@/components/events/types';
import { Button } from '@/components/ui/Button';

// Espelha @Roles(ADMIN, RH, GESTOR) em src/events/events.controller.ts#create.
const CAN_CREATE_ROLES: readonly Role[] = ['ADMIN', 'RH', 'GESTOR'];

export default function EventsPage() {
  const role = useCurrentRole();
  const canCreate = !!role && CAN_CREATE_ROLES.includes(role);

  const [nav, setNav] = useState<Nav>({ view: 'overview' });
  const [showCreate, setShowCreate] = useState(false);

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
        {canCreate && (
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus size={14} strokeWidth={1.75} />
            Criar evento
          </Button>
        )}
      </div>

      <div className="mb-6 flex w-fit flex-wrap gap-1 rounded-card bg-surface-sunken p-1">
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

      {nav.view === 'overview' && <OverviewTab />}
      {nav.view === 'events' && <EventsTab />}
      {nav.view === 'calendar' && <CalendarTab />}
      {nav.view === 'participants' && <ParticipantsTab />}
      {nav.view === 'schedule' && <ScheduleTab />}
      {nav.view === 'venues-logistics' && <VenuesLogisticsTab />}
      {nav.view === 'speakers-guests' && <SpeakersGuestsTab />}
      {nav.view === 'communication' && <CommunicationTab />}
      {nav.view === 'checkin-attendance' && <CheckinAttendanceTab />}
      {nav.view === 'evaluation' && <EvaluationTab />}
      {nav.view === 'reports' && <ReportsTab />}

      {showCreate && <CreateEventModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
