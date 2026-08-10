// src/app/(dashboard)/payslips/page.tsx
'use client';

import { useState } from 'react';
import { API_URL as API_BASE } from '@/lib/apiClient';
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
          <h1 className="text-xl font-semibold text-gray-900">
            {TITLES[nav.view]}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            INNOVA — Recursos Humanos
          </p>
        </div>
        {nav.view === 'list' && (
          <button
            onClick={() =>
              window.open(
                `${API_BASE}/payslips/my/annual-summary/export`,
                '_blank',
              )
            }
            className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ⬇ Exportar ano
          </button>
        )}
      </div>

      {/* Tabs (não mostrar em detail) */}
      {nav.view !== 'detail' && (
        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => setNav({ view: n.id })}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                nav.view === n.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {n.label}
            </button>
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
