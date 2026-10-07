// app/(platform)/avatar-training/page.tsx
'use client';

// Container do módulo Avatar Training (docs/Avatar_Training.md). As abas são
// filtradas por papel (espelha @Roles em src/avatar-training); a autorização
// real continua no backend. As 13 abas do §2 estão cobertas.

import { useState } from 'react';
import { PillNav } from '@/components/ui/PillTabs';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { TABS } from '@/components/avatar-training/constants';
import { AvatarsTab } from '@/components/avatar-training/AvatarsTab';
import { HistoryTab } from '@/components/avatar-training/HistoryTab';
import { OverviewTab } from '@/components/avatar-training/OverviewTab';
import { ProgramsTab } from '@/components/avatar-training/ProgramsTab';
import { ProgressTab } from '@/components/avatar-training/ProgressTab';
import { ReportsTab } from '@/components/avatar-training/ReportsTab';
import { AssessmentsTab } from '@/components/avatar-training/AssessmentsTab';
import { BuilderTab } from '@/components/avatar-training/BuilderTab';
import { CompetenciesTab } from '@/components/avatar-training/CompetenciesTab';
import { KnowledgeTab } from '@/components/avatar-training/KnowledgeTab';
import { SIMULATION_TYPES } from '@/components/avatar-training/constants';
import { RoomTab } from '@/components/avatar-training/RoomTab';
import { SettingsTab } from '@/components/avatar-training/SettingsTab';
import type { TabId } from '@/components/avatar-training/types';

export default function AvatarTrainingPage() {
  const role = useCurrentRole();
  const [tab, setTab] = useState<TabId>('overview');

  const visible = TABS.filter(
    (t) => !t.roles || (!!role && t.roles.includes(role)),
  );
  const current = visible.some((t) => t.id === tab) ? tab : 'overview';

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 font-display text-xl font-semibold text-ink">
        Avatar Training
      </h1>

      <PillNav
        items={visible}
        value={current}
        onChange={(id) => setTab(id as TabId)}
        label="Avatar Training"
        className="mb-6"
      />

      {current === 'overview' && <OverviewTab />}
      {current === 'room' && <RoomTab />}
      {current === 'programs' && <ProgramsTab />}
      {current === 'simulations' && (
        <RoomTab
          only={SIMULATION_TYPES}
          emptyTitle="Sem simulações atribuídas"
        />
      )}
      {current === 'builder' && <BuilderTab />}
      {current === 'knowledge' && <KnowledgeTab />}
      {current === 'assessments' && <AssessmentsTab />}
      {current === 'competencies' && <CompetenciesTab />}
      {current === 'avatars' && <AvatarsTab />}
      {current === 'progress' && <ProgressTab />}
      {current === 'reports' && <ReportsTab />}
      {current === 'settings' && <SettingsTab />}
      {current === 'history' && <HistoryTab />}
    </div>
  );
}
