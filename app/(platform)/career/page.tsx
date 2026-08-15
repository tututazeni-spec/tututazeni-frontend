// src/app/(dashboard)/career/page.tsx
'use client';

// Container: gere o separador activo; delega dados+apresentação de cada
// separador aos componentes auto-contidos em components/career/ (mesmo
// padrão que components/payslips/page.tsx usa para ListView/
// CompareView/AnnualView). Ver memory
// project_innova_component_separation_audit.

import { useState } from 'react';
import { Compass } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { NAV, TITLES } from '@/components/career/constants';
import { DashboardView } from '@/components/career/DashboardView';
import { PathsView } from '@/components/career/PathsView';
import { PlanView } from '@/components/career/PlanView';
import { VacanciesView } from '@/components/career/VacanciesView';
import type { View } from '@/components/career/types';

export default function CareerPage() {
  const [view, setView] = useState<View>('dashboard');

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <div className="rounded-control bg-primary-subtle p-1.5">
              <Compass size={18} strokeWidth={1.75} className="text-primary" />
            </div>
            <h1 className="font-display text-xl font-semibold text-ink">
              {TITLES[view]}
            </h1>
          </div>
          <p className="mt-0.5 font-body text-sm text-ink-faint">
            INNOVA — Gestão de Carreira
          </p>
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

      {view === 'dashboard' && <DashboardView />}
      {view === 'paths' && <PathsView />}
      {view === 'vacancies' && <VacanciesView />}
      {view === 'plan' && <PlanView />}
    </div>
  );
}
