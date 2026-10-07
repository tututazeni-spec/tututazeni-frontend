// src/app/(dashboard)/audit/page.tsx
'use client';

import { PillNav } from '@/components/ui/PillTabs';
import { useEffect, useState } from 'react';
import { AccessView } from '@/components/audit/AccessView';
import { AuditsView } from '@/components/audit/AuditsView';
import { ChangesView } from '@/components/audit/ChangesView';
import { NAV, TITLES } from '@/components/audit/constants';
import { DeletedCyclesView } from '@/components/audit/DeletedCyclesView';
import { ExportsView } from '@/components/audit/ExportsView';
import { LogsView } from '@/components/audit/LogsView';
import { OverviewView } from '@/components/audit/OverviewView';
import { PoliciesView } from '@/components/audit/PoliciesView';
import { ReportsView } from '@/components/audit/ReportsView';
import { SecurityView } from '@/components/audit/SecurityView';
import { TimelineView } from '@/components/audit/TimelineView';
import type { View } from '@/components/audit/types';
import { useCurrentRole } from '@/hooks/useCurrentRole';

export default function AuditPage() {
  const role = useCurrentRole();
  // Cada separador só é visível a quem o backend por trás dele deixa entrar
  // (NAV[].roles) — ex.: DIRECTOR só vê "Apagados", nunca os logs gerais.
  const nav = NAV.filter((n) => !!role && n.roles.includes(role));
  // ?view= (ex.: link a partir de Definições > Auditoria e Dados). Lido do URL
  // em vez de useSearchParams para não exigir <Suspense> nesta página client.
  const initialView =
    typeof window === 'undefined'
      ? 'overview'
      : ((new URLSearchParams(window.location.search).get(
          'view',
        ) as View | null) ?? 'overview');
  const [view, setView] = useState<View>(initialView);

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

      <PillNav
        items={nav}
        value={view}
        onChange={(id) => setView(id as typeof view)}
        label="Auditoria"
        className="mb-6"
      />

      {view === 'logs' && <LogsView />}
      {view === 'overview' && <OverviewView onNavigate={setView} />}
      {view === 'security' && <SecurityView />}
      {view === 'changes' && <ChangesView />}
      {view === 'audits' && <AuditsView />}
      {view === 'access' && <AccessView />}
      {view === 'reports' && <ReportsView />}
      {view === 'exports' && <ExportsView />}
      {view === 'policies' && <PoliciesView />}
      {view === 'timeline' && <TimelineView />}
      {view === 'deleted' && <DeletedCyclesView />}
    </div>
  );
}
