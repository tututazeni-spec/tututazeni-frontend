// components/history/EmployeeTab.tsx
// Aba "Histórico do Colaborador" (docs/history.md §3): timeline completa da
// vida do colaborador na organização, alimentada pelos módulos reais
// (movimentos, formações, avaliações, PDI, ausências, documentos, …).
// Por omissão mostra o histórico do próprio; gestores/RH podem escolher outro.

'use client';

import { useState } from 'react';
import { useCurrentRole, useHasRole } from '@/hooks/useCurrentRole';
import { MGMT_ROLES } from '@/lib/roles';
import { cn } from '@/lib/cn';
import { PersonPicker } from './filters';
import { MilestonesTab } from './MilestonesTab';
import { StatsTab } from './StatsTab';
import { TimelineTab } from './TimelineTab';
import type { PersonRef } from './types';

type Section = 'timeline' | 'milestones' | 'stats';

const SECTIONS: { id: Section; label: string }[] = [
  { id: 'timeline', label: 'Linha de tempo' },
  { id: 'milestones', label: 'Marcos' },
  { id: 'stats', label: 'Actividade' },
];

export function EmployeeTab() {
  const role = useCurrentRole();
  const canPick = useHasRole(MGMT_ROLES);
  const [person, setPerson] = useState<PersonRef | null>(null);
  const userId = person?.id;
  const [section, setSection] = useState<Section>('timeline');

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

      <div className="flex flex-wrap gap-2" role="tablist">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={section === s.id}
            onClick={() => setSection(s.id)}
            className={cn(
              'rounded-pill border-[1.5px] px-3.5 py-1.5 font-body text-sm font-semibold transition-colors',
              section === s.id
                ? 'border-brand bg-brand text-white'
                : 'border-border-strong bg-surface text-ink-muted hover:bg-surface-sunken',
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {section === 'timeline' && (
        <TimelineTab key={userId ?? 'me'} userId={userId} />
      )}
      {section === 'milestones' && <MilestonesTab userId={userId} />}
      {section === 'stats' && <StatsTab userId={userId} />}
    </div>
  );
}
