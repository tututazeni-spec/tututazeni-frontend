// src/app/(dashboard)/competencies/page.tsx
'use client';

// Container: gere o separador activo; delega dados+apresentação de cada
// separador aos componentes auto-contidos em components/competencies/
// (mesmo padrão que components/payslips/page.tsx usa para ListView/
// CompareView/AnnualView). Ver memory
// project_innova_component_separation_audit. Migrado para a fundação
// de design: nav em pílula e botão de acção passam a Button (mesmo
// padrão de app/(platform)/sucession/page.tsx).

import { useState } from 'react';
import { NAV, TITLES } from '@/components/competencies/constants';
import { CatalogView } from '@/components/competencies/CatalogView';
import { DashboardView } from '@/components/competencies/DashboardView';
import { MyProfileView } from '@/components/competencies/MyProfileView';
import { SkillMatrixView } from '@/components/competencies/SkillMatrixView';
import type { View } from '@/components/competencies/types';
import { Button } from '@/components/ui/Button';

export default function CompetenciesPage() {
  const [view, setView] = useState<View>('catalog');

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">
            {TITLES[view]}
          </h1>
          <p className="mt-0.5 font-body text-sm text-ink-faint">
            INNOVA — Gestão de Competências
          </p>
        </div>
        {view === 'catalog' && (
          <Button onClick={() => alert('Abrir formulário de criação de competência')}>
            + Nova competência
          </Button>
        )}
      </div>

      {/* Tabs */}
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

      {/* Sem vista de detalhe ligada ainda — o CatalogView exige onSelect mas
          nada consome o id seleccionado neste momento. */}
      {view === 'catalog' && <CatalogView onSelect={() => {}} />}
      {view === 'my-profile' && <MyProfileView />}
      {view === 'matrix' && <SkillMatrixView />}
      {view === 'dashboard' && <DashboardView />}
    </div>
  );
}
