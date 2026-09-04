'use client';

import { useState } from 'react';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { ADMIN_ROLES, isRoleAllowed } from '@/lib/roles';
import { queryKeys } from '@/lib/queryKeys';
import { NAV, TITLES } from '@/components/organization/constants';
import { CreateDepartmentModal } from '@/components/departments/CreateDepartmentModal';
import { CreatePositionModal } from '@/components/organization/CreatePositionModal';
import { DashboardView } from '@/components/organization/DashboardView';
import { DepartmentsView } from '@/components/organization/DepartmentsView';
import { OrgChartView } from '@/components/organization/OrgChartView';
import { PositionsView } from '@/components/organization/PositionsView';
import { TimelineView } from '@/components/organization/TimelineView';
import type { View } from '@/components/organization/types';
import { Button } from '@/components/ui/Button';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

export default function OrganizationPage() {
  const [view, setView] = useState<View>('dashboard');
  const [createOpen, setCreateOpen] = useState(false);

  const role = useCurrentRole();
  // POST /organization/positions exige @Roles(ADMIN, RH) — esconder o botão a
  // quem não pode criar (o backend continua a ser a autoridade).
  const canManagePositions = isRoleAllowed(ADMIN_ROLES, role);

  const closeCreate = () => setCreateOpen(false);
  const changeView = (next: View) => {
    setView(next);
    setCreateOpen(false); // não arrastar o modal de criação entre separadores
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">
            {TITLES[view]}
          </h1>
          <p className="mt-0.5 font-body text-sm text-ink-faint"></p>
        </div>
        {view === 'departments' && (
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            + Departamento
          </Button>
        )}
        {view === 'positions' && canManagePositions && (
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            + Cargo
          </Button>
        )}
      </div>

      {createOpen && view === 'departments' && (
        <CreateDepartmentModal
          endpoint="/organization/departments"
          invalidateKeys={[
            queryKeys.organization.all,
            queryKeys.departments.all,
          ]}
          onClose={closeCreate}
        />
      )}

      {createOpen && view === 'positions' && (
        <CreatePositionModal onClose={closeCreate} />
      )}

      <div className="mb-6 flex w-fit gap-1 rounded-card bg-surface-sunken p-1">
        {NAV.map((n) => (
          <Button
            key={n.id}
            size="sm"
            intent={view === n.id ? 'primary' : 'ghost'}
            onClick={() => changeView(n.id)}
          >
            {n.label}
          </Button>
        ))}
      </div>

      {view === 'dashboard' && <DashboardView />}
      {view === 'chart' && (
        <ErrorBoundary source="organization.OrgChartView">
          <OrgChartView />
        </ErrorBoundary>
      )}
      {view === 'departments' && <DepartmentsView />}
      {view === 'positions' && <PositionsView />}
      {view === 'timeline' && <TimelineView />}
    </div>
  );
}
