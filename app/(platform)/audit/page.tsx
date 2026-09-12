// src/app/(dashboard)/audit/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
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
  // useMemo mantém a referência estável entre renders em que `role` não
  // muda, para o useEffect abaixo poder depender de `nav` sem re-executar
  // em todo o render (e sem precisar de desligar exhaustive-deps, que fazia
  // o React Compiler desistir de optimizar este componente).
  const nav = useMemo(
    () => NAV.filter((n) => !!role && n.roles.includes(role)),
    [role],
  );
  const [view, setView] = useState<View>('logs');

  // Se o separador activo deixar de estar disponível para este papel (ex.:
  // DIRECTOR, que não tem "logs"), salta para o primeiro que tiver.
  useEffect(() => {
    if (nav.length > 0 && !nav.some((n) => n.id === view)) {
      setView(nav[0].id);
    }
  }, [nav, view]);

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
