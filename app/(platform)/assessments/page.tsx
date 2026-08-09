// src/app/(dashboard)/assessments/page.tsx
// Inclui: player de avaliação, resultado, lista, e builder admin
'use client';

// Container: gere a navegação entre as 3 vistas (Disponíveis/Player/
// Histórico), cada uma auto-contida — dados + apresentação, mesmo padrão
// de components/payslips/page.tsx. Ver memory
// project_innova_component_separation_audit.

import { useState } from 'react';
import { AssessmentPlayer } from '@/components/assessments/AssessmentPlayer';
import { ListView } from '@/components/assessments/ListView';
import { ReviewView } from '@/components/assessments/ReviewView';
import type { View } from '@/components/assessments/types';

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
          <h1 className="text-xl font-semibold text-gray-900">
            {TITLES[nav.view]}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">INNOVA — Avaliações</p>
        </div>
      </div>

      {/* Tabs */}
      {nav.view === 'list' || nav.view === 'review' ? (
        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
          {(['list', 'review'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setNav({ view: v })}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                nav.view === v
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {{ list: 'Disponíveis', review: 'Histórico' }[v]}
            </button>
          ))}
        </div>
      ) : (
        <button
          onClick={handleBack}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-5"
        >
          ← Voltar
        </button>
      )}

      {nav.view === 'list' && <ListView onStart={handleStart} />}
      {nav.view === 'player' && (
        <AssessmentPlayer assessmentId={nav.selectedId} onBack={handleBack} />
      )}
      {nav.view === 'review' && <ReviewView />}
    </div>
  );
}
