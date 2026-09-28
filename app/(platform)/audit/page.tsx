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

      {/* Tabs — formato de "cartão": cada botão é um cartão independente
          (borda + fundo branco + rounded), sem o fundo/pill de grupo
          anterior. Alinhadas horizontal e verticalmente (justify-center +
          items-center no wrapper) com largura mínima uniforme. Estado
          activo usa a mesma condição `view === n.id` de sempre para
          aplicar destaque azul (borda/fundo/texto primary). */}
      <div className="mb-6 flex w-full flex-wrap items-center justify-center gap-2">
        {nav.map((n) => (
          <button
            key={n.id}
            onClick={() => setView(n.id)}
            className={`flex min-w-[140px] items-center justify-center whitespace-nowrap rounded-lg border px-4 py-2 text-center text-sm font-medium transition-colors ${
              view === n.id
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-white text-ink-muted hover:text-ink'
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
      {view === 'deleted' && <DeletedCyclesView />}
    </div>
  );
}