'use client';

// Container: gere o separador activo; delega dados+apresentação de cada
// separador aos componentes auto-contidos em components/enrollments/
// (mesmo padrão que components/payslips/page.tsx usa para ListView/
// CompareView/AnnualView). Ver memory
// project_innova_component_separation_audit.

import { useState } from 'react';
import { Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { NAV, TITLES } from '@/components/enrollments/constants';
import { AdminView } from '@/components/enrollments/AdminView';
import { ComplianceView } from '@/components/enrollments/ComplianceView';
import { MyEnrollmentsView } from '@/components/enrollments/MyEnrollmentsView';
import { TeamView } from '@/components/enrollments/TeamView';
import type { View } from '@/components/enrollments/types';
import { useToast } from '@/providers/ToastProvider';

export default function EnrollmentsPage() {
  const notify = useToast();
  const [view, setView] = useState<View>('my');

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">
            {TITLES[view]}
          </h1>
          <p className="mt-0.5 font-body text-sm text-ink-faint">
          </p>
        </div>
        {view === 'admin' && (
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() =>
                notify({
                  title: 'Abrir formulário de matrícula',
                  intent: 'info',
                })
              }
            >
              + Matricular
            </Button>
            <Button
              size="sm"
              intent="secondary"
              onClick={() =>
                notify({
                  title: 'Abrir modal de matrículas em massa',
                  intent: 'info',
                })
              }
            >
              <Zap size={14} strokeWidth={1.75} />
              Em massa
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-6 flex w-fit flex-wrap gap-1 rounded-card bg-surface-sunken p-1">
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

      {view === 'my' && <MyEnrollmentsView />}
      {view === 'admin' && <AdminView />}
      {view === 'compliance' && <ComplianceView />}
      {view === 'team' && <TeamView />}
    </div>
  );
}
