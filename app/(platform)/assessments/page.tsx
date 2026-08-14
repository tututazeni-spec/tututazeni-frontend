// src/app/(dashboard)/assessments/page.tsx
// Inclui: player de avaliação, resultado, lista, e builder admin
'use client';

// Container: gere a navegação entre as 3 vistas (Disponíveis/Player/
// Histórico), cada uma auto-contida — dados + apresentação, mesmo padrão
// de components/payslips/page.tsx. Ver memory
// project_innova_component_separation_audit.

import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { AssessmentPlayer } from '@/components/assessments/AssessmentPlayer';
import { ListView } from '@/components/assessments/ListView';
import { ReviewView } from '@/components/assessments/ReviewView';
import type { View } from '@/components/assessments/types';
import { Button } from '@/components/ui/Button';

const TITLES: Record<View, string> = {
  list: 'Avaliações disponíveis',
  player: 'Avaliação em progresso',
  result: 'Resultado',
  review: 'Histórico de tentativas',
};

// view e selectedId eram dois useState separados sempre definidos em conjunto
// — um único estado torna "player sem id" irrepresentável.
type Nav =
  { view: Exclude<View, 'player'> } | { view: 'player'; selectedId: number };

export default function AssessmentsPage() {
  const [nav, setNav] = useState<Nav>({ view: 'list' });

  const handleStart = (id: number) =>
    setNav({ view: 'player', selectedId: id });
  const handleBack = () => setNav({ view: 'list' });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-ink">
            {TITLES[nav.view]}
          </h1>
          <p className="text-sm text-ink-faint mt-0.5">INNOVA — Avaliações</p>
        </div>
      </div>

      {/* Tabs */}
      {nav.view === 'list' || nav.view === 'review' ? (
        <div className="flex gap-1 mb-6 bg-surface-sunken p-1 rounded-card w-fit">
          {(['list', 'review'] as const).map((v) => (
            <Button
              key={v}
              size="sm"
              intent={nav.view === v ? 'primary' : 'ghost'}
              onClick={() => setNav({ view: v })}
            >
              {{ list: 'Disponíveis', review: 'Histórico' }[v]}
            </Button>
          ))}
        </div>
      ) : (
        <Button intent="ghost" size="sm" onClick={handleBack} className="mb-5">
          <ArrowLeft size={14} strokeWidth={1.75} />
          Voltar
        </Button>
      )}

      {nav.view === 'list' && <ListView onStart={handleStart} />}
      {nav.view === 'player' && (
        <AssessmentPlayer assessmentId={nav.selectedId} onBack={handleBack} />
      )}
      {nav.view === 'review' && <ReviewView />}
    </div>
  );
}
