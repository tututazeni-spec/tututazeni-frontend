// components/executive-reports/HistoryPanel.tsx
// Separador "Histórico & Arquivo": reaproveita o fluxo já existente de
// relatórios executivos (lista → detalhe → gerar) que antes era a página
// inteira do módulo.

'use client';

import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TITLES } from './constants';
import { DetailView } from './DetailView';
import { GenerateView } from './GenerateView';
import { ArchivePanel } from './ArchivePanel';
import { ListView } from './ListView';
import type { Nav } from './types';

export function HistoryPanel() {
  const [mode, setMode] = useState<'reports' | 'archive'>('reports');
  const [nav, setNav] = useState<Nav>({ view: 'list' });

  const handleBack = () => setNav({ view: 'list' });
  const openDetail = (id: number) => setNav({ view: 'detail', selectedId: id });

  const modeSwitch = (
    <div className="mb-5 flex gap-2">
      <Button
        size="sm"
        intent={mode === 'reports' ? 'primary' : 'ghost'}
        onClick={() => setMode('reports')}
      >
        Relatórios
      </Button>
      <Button
        size="sm"
        intent={mode === 'archive' ? 'primary' : 'ghost'}
        onClick={() => setMode('archive')}
      >
        Arquivo e versões
      </Button>
    </div>
  );

  if (mode === 'archive')
    return (
      <div>
        {modeSwitch}
        <ArchivePanel />
      </div>
    );

  return (
    <div>
      {modeSwitch}
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-ink">
          {TITLES[nav.view]}
        </h2>
        {nav.view !== 'list' && (
          <Button intent="secondary" size="sm" onClick={handleBack}>
            <ArrowLeft size={14} strokeWidth={1.75} />
            Voltar
          </Button>
        )}
      </div>

      {nav.view === 'list' && (
        <ListView
          onSelect={openDetail}
          onGenerate={() => setNav({ view: 'generate' })}
        />
      )}
      {nav.view === 'detail' && (
        <DetailView
          reportId={nav.selectedId}
          onBack={handleBack}
          onDeleted={() => setNav({ view: 'generate' })}
        />
      )}
      {nav.view === 'generate' && <GenerateView onSuccess={openDetail} />}
    </div>
  );
}
