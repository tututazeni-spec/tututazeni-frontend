// src/app/(dashboard)/executive-reports/page.tsx
'use client';

import { useState } from 'react';
import { ArrowLeft, Zap } from 'lucide-react';
import { TITLES } from '@/components/executive-reports/constants';
import { DetailView } from '@/components/executive-reports/DetailView';
import { GenerateView } from '@/components/executive-reports/GenerateView';
import { ListView } from '@/components/executive-reports/ListView';
import type { Nav } from '@/components/executive-reports/types';
import { Button } from '@/components/ui/Button';

export default function ExecutiveReportsPage() {
  const [nav, setNav] = useState<Nav>({ view: 'list' });

  const handleSelect = (id: number) =>
    setNav({ view: 'detail', selectedId: id });
  const handleBack = () => setNav({ view: 'list' });
  const handleGenerated = (id: number) =>
    setNav({ view: 'detail', selectedId: id });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">
            {TITLES[nav.view]}
          </h1>
          <p className="mt-0.5 font-body text-sm text-ink-faint">
            INNOVA — Inteligência Executiva
          </p>
        </div>
        {nav.view === 'list' && (
          <Button size="sm" onClick={() => setNav({ view: 'generate' })}>
            <Zap size={14} strokeWidth={1.75} />
            Gerar automático
          </Button>
        )}
        {nav.view !== 'list' && (
          <Button intent="secondary" size="sm" onClick={handleBack}>
            <ArrowLeft size={14} strokeWidth={1.75} />
            Voltar
          </Button>
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
