// src/app/(dashboard)/audit/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { AnomaliesView } from '@/components/audit/AnomaliesView';
import { NAV, TITLES } from '@/components/audit/constants';
import { DeletedCyclesView } from '@/components/audit/DeletedCyclesView';
import { LogsView } from '@/components/audit/LogsView';
import { StatsView } from '@/components/audit/StatsView';
import { TimelineView } from '@/components/audit/TimelineView';
import type { View } from '@/components/audit/types';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { Button } from '@/components/ui/Button';

export default function AuditPage() {
  const role = useCurrentRole();
  // Cada separador só é visível a quem o backend por trás dele deixa entrar
  // (NAV[].roles) — ex.: DIRECTOR só vê "Apagados", nunca os logs gerais.
  const nav = NAV.filter((n) => !!role && n.roles.includes(role));
  const [view, setView] = useState<View>('logs');

  // Se o separador activo deixar de estar disponível para este papel (ex.:
  // DIRECTOR, que não tem "logs"), salta para o primeiro que tiver.
  useEffect(() => {
    if (nav.length > 0 && !nav.some((n) => n.id === view)) {
      setView(nav[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

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
        {nav.map((n) => (
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
      {view === 'deleted' && <DeletedCyclesView />}
    </div>
  );
}
