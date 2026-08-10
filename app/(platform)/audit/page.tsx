// src/app/(dashboard)/audit/page.tsx
'use client';

import { useState } from 'react';
import { AnomaliesView } from '@/components/audit/AnomaliesView';
import { NAV, TITLES } from '@/components/audit/constants';
import { LogsView } from '@/components/audit/LogsView';
import { StatsView } from '@/components/audit/StatsView';
import { TimelineView } from '@/components/audit/TimelineView';
import type { View } from '@/components/audit/types';

export default function AuditPage() {
  const [view, setView] = useState<View>('logs');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            {TITLES[view]}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            INNOVA — Rastreabilidade e Compliance
          </p>
        </div>
      </div>

      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {NAV.map((n) => (
          <button
            key={n.id}
            onClick={() => setView(n.id)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              view === n.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {n.label}
          </button>
        ))}
      </div>

      {view === 'logs' && <LogsView />}
      {view === 'stats' && <StatsView />}
      {view === 'anomalies' && <AnomaliesView />}
      {view === 'timeline' && <TimelineView />}
    </div>
  );
}
