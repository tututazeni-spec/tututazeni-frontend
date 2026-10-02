// app/(platform)/avatar-training/page.tsx
'use client';

// Container do módulo Avatar Training (docs/Avatar_Training.md). As abas são
// filtradas por papel (espelha @Roles em src/avatar-training); a autorização
// real continua no backend. Abas do §2 ainda sem UI (Simulações, Construtor de
// Sessões, Base de Conhecimento, Avaliações, Competências) usam a API
// directamente por agora.

import { useState } from 'react';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { TABS } from '@/components/avatar-training/constants';
import { AvatarsTab } from '@/components/avatar-training/AvatarsTab';
import { HistoryTab } from '@/components/avatar-training/HistoryTab';
import { OverviewTab } from '@/components/avatar-training/OverviewTab';
import { ProgramsTab } from '@/components/avatar-training/ProgramsTab';
import { ProgressTab } from '@/components/avatar-training/ProgressTab';
import { ReportsTab } from '@/components/avatar-training/ReportsTab';
import { RoomTab } from '@/components/avatar-training/RoomTab';
import { SettingsTab } from '@/components/avatar-training/SettingsTab';
import type { TabId } from '@/components/avatar-training/types';

export default function AvatarTrainingPage() {
  const role = useCurrentRole();
  const [tab, setTab] = useState<TabId>('overview');

  const visible = TABS.filter((t) => !t.roles || (!!role && t.roles.includes(role)));
  const current = visible.some((t) => t.id === tab) ? tab : 'overview';

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 font-display text-xl font-semibold text-ink">
        Avatar Training
      </h1>

      <div
        role="tablist"
        className="mb-6 flex w-full flex-wrap items-center justify-center gap-2"
      >
        {visible.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={current === t.id}
            onClick={() => setTab(t.id)}
            className={`flex min-w-[140px] items-center justify-center whitespace-nowrap rounded-lg border px-4 py-2 text-center text-sm font-medium transition-colors ${
              current === t.id
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-white text-ink-muted hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {current === 'overview' && <OverviewTab />}
      {current === 'room' && <RoomTab />}
      {current === 'programs' && <ProgramsTab />}
      {current === 'avatars' && <AvatarsTab />}
      {current === 'progress' && <ProgressTab />}
      {current === 'reports' && <ReportsTab />}
      {current === 'settings' && <SettingsTab />}
      {current === 'history' && <HistoryTab />}
    </div>
  );
}
