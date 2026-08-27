// src/app/(dashboard)/payslips/page.tsx
'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { API_URL as API_BASE } from '@/lib/apiClient';
import { Button } from '@/components/ui/Button';
import { AnnualView } from '@/components/payslips/AnnualView';
import { CompareView } from '@/components/payslips/CompareView';
import { NAV, TITLES } from '@/components/payslips/constants';
import { DetailView } from '@/components/payslips/DetailView';
import { ListView } from '@/components/payslips/ListView';
import { SimulateView } from '@/components/payslips/SimulateView';
import type { Nav } from '@/components/payslips/types';

export default function PayslipsPage() {
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
          <p className="font-body text-sm text-ink-faint mt-0.5">
          </p>
        </div>
        {nav.view === 'list' && (
          <Button
            intent="secondary"
            size="sm"
            onClick={() =>
              window.open(
                `${API_BASE}/payslips/my/annual-summary/export`,
                '_blank',
              )
            }
          >
            <Download size={14} strokeWidth={1.75} />
            Exportar ano
          </Button>
        )}
      </div>

      {/* Tabs (não mostrar em detail) */}
      {nav.view !== 'detail' && (
        <div className="flex gap-1 mb-6 bg-surface-sunken p-1 rounded-card w-fit">
          {NAV.map((n) => (
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
    </div>
  );
}
