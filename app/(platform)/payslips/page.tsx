// src/app/(dashboard)/payslips/page.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { AnnualView } from '@/components/payslips/AnnualView';
import { CompareView } from '@/components/payslips/CompareView';
import { CompensationView } from '@/components/payslips/CompensationView';
import { ComponentsView } from '@/components/payslips/ComponentsView';
import { NAV, TITLES } from '@/components/payslips/constants';
import { DetailView } from '@/components/payslips/DetailView';
import { ListView } from '@/components/payslips/ListView';
import { SimulateView } from '@/components/payslips/SimulateView';
import type { Nav } from '@/components/payslips/types';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { ADMIN_ROLES, type Role } from '@/lib/roles';

export default function PayslipsPage() {
  const { data: me } = useCurrentUser();
  const role = me?.role?.name as Role | undefined;
  // Enquanto a role ainda não chegou (arranque pós-login/reload) tratamos
  // como não-admin — a aba adminOnly aparece assim que /auth/me resolve.
  const isAdmin = !!role && ADMIN_ROLES.includes(role);
  const visibleNav = isAdmin ? NAV : NAV.filter((n) => !n.adminOnly);

  const [nav, setNav] = useState<Nav>({ view: 'list' });

  const handleSelect = (id: number) =>
    setNav({ view: 'detail', selectedId: id });
  const handleBack = () => setNav({ view: 'list' });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">
            {TITLES[nav.view]}
          </h1>
          <p className="font-body text-sm text-ink-faint mt-0.5"></p>
        </div>
      </div>

      {/* Tabs (não mostrar em detail) */}
      {nav.view !== 'detail' && (
        <div className="flex gap-1 mb-6 bg-surface-sunken p-1 rounded-card w-fit">
          {visibleNav.map((n) => (
            <Button
              key={n.id}
              size="sm"
              intent={nav.view === n.id ? 'primary' : 'ghost'}
              onClick={() => setNav({ view: n.id })}
            >
              {n.label}
            </Button>
          ))}
        </div>
      )}

      {/* Views */}
      {nav.view === 'list' && <ListView onSelect={handleSelect} />}
      {nav.view === 'detail' && (
        <DetailView payslipId={nav.selectedId} onBack={handleBack} />
      )}
      {nav.view === 'compare' && <CompareView />}
      {nav.view === 'simulate' && <SimulateView />}
      {nav.view === 'annual' && <AnnualView />}
      {nav.view === 'compensation' && <CompensationView />}
      {nav.view === 'components' && isAdmin && <ComponentsView />}
    </div>
  );
}
