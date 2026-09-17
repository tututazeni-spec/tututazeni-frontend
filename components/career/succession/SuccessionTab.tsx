// components/career/succession/SuccessionTab.tsx
// Separador "Sucessão" do módulo Carreira — fusão da antiga página
// /sucession (ver app/(platform)/sucession/page.tsx, agora um stub de
// redireccionamento). Mesma sub-navegação de antes (Dashboard/Mapa/Cargos
// Críticos/Talent Pool), com a Matriz de Sucessão como 5º separador.

'use client';

import { useState } from 'react';
import { DashboardView } from './DashboardView';
import { NAV } from './constants';
import { OrgChartView } from './OrgChartView';
import { PositionsView } from './PositionsView';
import { SuccessionMatrixView } from './SuccessionMatrixView';
import { TalentPoolView } from './TalentPoolView';
import type { View } from './types';
import { Button } from '@/components/ui/Button';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

export function SuccessionTab() {
  const [view, setView] = useState<View>('dashboard');

  return (
    <div>
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

      {view === 'dashboard' && <DashboardView />}
      {view === 'org-chart' && (
        <ErrorBoundary source="career.succession.OrgChartView">
          <OrgChartView />
        </ErrorBoundary>
      )}
      {view === 'positions' && <PositionsView />}
      {view === 'talent-pool' && <TalentPoolView />}
      {view === 'matrix' && <SuccessionMatrixView />}
    </div>
  );
}
