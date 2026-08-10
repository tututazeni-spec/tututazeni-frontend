// src/app/(dashboard)/executive-reports/page.tsx
'use client';

import { useState } from 'react';
import { TITLES } from '@/components/executive-reports/constants';
import { DetailView } from '@/components/executive-reports/DetailView';
import { GenerateView } from '@/components/executive-reports/GenerateView';
import { ListView } from '@/components/executive-reports/ListView';
import type { Nav } from '@/components/executive-reports/types';

export default function ExecutiveReportsPage() {
  const [nav, setNav] = useState<Nav>({ view: 'list' });

  const handleSelect = (id: number) =>
    setNav({ view: 'detail', selectedId: id });
  const handleBack = () => setNav({ view: 'list' });
  const handleGenerated = (id: number) =>
    setNav({ view: 'detail', selectedId: id });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            {TITLES[nav.view]}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            INNOVA — Inteligência Executiva
          </p>
        </div>
        {nav.view === 'list' && (
          <div className="flex gap-2">
            <button
              onClick={() => setNav({ view: 'generate' })}
              className="px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800"
            >
              ⚡ Gerar automático
            </button>
          </div>
        )}
        {nav.view !== 'list' && (
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200"
          >
            ← Voltar
          </button>
        )}
      </div>

      {nav.view === 'list' && (
        <ListView
          onSelect={handleSelect}
          onGenerate={() => setNav({ view: 'generate' })}
        />
      )}
      {nav.view === 'detail' && (
        <DetailView reportId={nav.selectedId} onBack={handleBack} />
      )}
      {nav.view === 'generate' && <GenerateView onSuccess={handleGenerated} />}
    </div>
  );
}
