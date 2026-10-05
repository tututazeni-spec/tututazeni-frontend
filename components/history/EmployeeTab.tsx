// components/history/EmployeeTab.tsx
// Aba "Histórico do Colaborador" (docs/history.md §3): timeline completa da
// vida do colaborador na organização, alimentada pelos módulos reais
// (movimentos, formações, avaliações, PDI, ausências, documentos, …).
// Por omissão mostra o histórico do próprio; gestores/RH podem escolher outro.

'use client';

import { useState } from 'react';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { MGMT_ROLES } from '@/lib/roles';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { PersonPicker } from './filters';
import { MilestonesTab } from './MilestonesTab';
import { StatsTab } from './StatsTab';
import { TimelineTab } from './TimelineTab';
import type { PersonRef } from './types';

export function EmployeeTab() {
  const role = useCurrentRole();
  const canPick = !!role && MGMT_ROLES.includes(role);
  const [person, setPerson] = useState<PersonRef | null>(null);
  const userId = person?.id;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-ink-muted">
          {person ? `Histórico de ${person.fullName}` : 'O meu histórico'}
        </p>
        {canPick && (
          <PersonPicker
            label="Escolher colaborador"
            value={person}
            onChange={setPerson}
          />
        )}
      </div>

      <Tabs defaultValue="timeline">
        <TabsList>
          <TabsTrigger value="timeline">Linha de tempo</TabsTrigger>
          <TabsTrigger value="milestones">Marcos</TabsTrigger>
          <TabsTrigger value="stats">Actividade</TabsTrigger>
        </TabsList>
        <div className="pt-4">
          <TabsContent value="timeline">
            <TimelineTab key={userId ?? 'me'} userId={userId} />
          </TabsContent>
          <TabsContent value="milestones">
            <MilestonesTab userId={userId} />
          </TabsContent>
          <TabsContent value="stats">
            <StatsTab userId={userId} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
