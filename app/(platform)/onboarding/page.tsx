'use client';

// Container: gere o separador activo; delega dados+apresentação de cada
// separador aos componentes auto-contidos em components/onboarding/
// (mesmo padrão que components/payslips/page.tsx usa para ListView/
// CompareView/AnnualView). Ver memory
// project_innova_component_separation_audit. Migrado para a fundação
// de design: Button substitui os botões/tabs bespoke, mesmo padrão de
// app/(platform)/events/page.tsx.

import { useState } from 'react';
import { useToast } from '@/providers/ToastProvider';
import { NAV, TITLES } from '@/components/onboarding/constants';
import { DashboardView } from '@/components/onboarding/DashboardView';
import { MyPlanView } from '@/components/onboarding/MyPlanView';
import { TemplatesView } from '@/components/onboarding/TemplatesView';
import type { View } from '@/components/onboarding/types';
import { Button } from '@/components/ui/Button';

export default function OnboardingPage() {
  const notify = useToast();
  const [view, setView] = useState<View>('my-plan');

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-ink">{TITLES[view]}</h1>
          <p className="text-sm text-ink-faint mt-0.5">
            INNOVA — Integração de Colaboradores
          </p>
        </div>
        {view === 'templates' && (
          <Button
            size="sm"
            onClick={() =>
              notify({
                title: 'Abrir formulário de criação de template',
                intent: 'info',
              })
            }
          >
            + Novo template
          </Button>
        )}
      </div>

      <div className="flex gap-1 mb-6 bg-surface-sunken p-1 rounded-card w-fit">
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

      {view === 'my-plan' && <MyPlanView />}
      {view === 'dashboard' && <DashboardView />}
      {view === 'templates' && <TemplatesView />}
    </div>
  );
}
