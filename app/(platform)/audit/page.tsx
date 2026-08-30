// src/app/(dashboard)/audit/page.tsx
'use client';

import { useState } from 'react';
import { AnomaliesView } from '@/components/audit/AnomaliesView';
import { NAV, TITLES } from '@/components/audit/constants';
import { LogsView } from '@/components/audit/LogsView';
import { StatsView } from '@/components/audit/StatsView';
import { TimelineView } from '@/components/audit/TimelineView';
import type { View } from '@/components/audit/types';
import { Button } from '@/components/ui/Button';

export default function AuditPage() {
  const [view, setView] = useState<View>('logs');

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">
            {TITLES[view]}
          </h1>
        </div>
      </div>

      <div className="mb-6 flex w-fit gap-1 rounded-card bg-surface-sunken p-1">
        {NAV.map((n) => (
          <Button
            key={n.id}
            size="sm"
            intent={view === n.id ? 'primary' : 'ghost'}
            onClick={() => setView(n.id)}
          >
            {n.label}
          </Button>
        ))}
      </div>

      {view === 'logs' && <LogsView />}
      {view === 'stats' && <StatsView />}
      {view === 'anomalies' && <AnomaliesView />}
      {view === 'timeline' && <TimelineView />}
    </div>
  );
}
