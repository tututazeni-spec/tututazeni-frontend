// components/avatar-training/HomeTab.tsx
// Separador "Início" — resumo de stats, hero e cenários recomendados.
// Dados próprios (useApiQuery) + apresentação, mesmo padrão auto-contido
// usado em components/payslips/page.tsx. Extraído de
// app/(platform)/avatar-training/page.tsx.

'use client';

import { Bot, CheckCircle, Flame, Play, Star, Target } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { KpiCard } from '@/components/ui/KpiCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { ScenarioCard } from './ScenarioCard';
import type { MyHistory, Scenario } from './types';

export interface HomeTabProps {
  onStartScenario: (s: Scenario) => void;
}

export function HomeTab({ onStartScenario }: HomeTabProps) {
  const recQuery = useApiQuery<Scenario[]>(
    queryKeys.avatarTraining.recommended(),
    '/avatar-training/scenarios/recommended',
    { params: { limit: 4 }, staleTime: STALE_TIME.SEMI_STATIC },
  );
  const histQuery = useApiQuery<MyHistory>(
    queryKeys.avatarTraining.myHistory(5),
    '/avatar-training/my-history',
    { params: { limit: 5 }, staleTime: STALE_TIME.DYNAMIC },
  );

  const recommended = recQuery.data ?? [];
  const history = histQuery.data ?? null;

  if (recQuery.isLoading || histQuery.isLoading)
    return (
      <Skeleton
        wrapperClassName="space-y-4 animate-pulse"
        itemClassName="bg-surface-sunken rounded-card h-28"
      />
    );

  return (
    <div className="space-y-6">
      {/* Stats strip */}
      {history && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard
            icon={Play}
            label="Sessões"
            value={history.stats.total}
            intent="primary"
          />
          <KpiCard
            icon={CheckCircle}
            label="Concluídas"
            value={history.stats.completed}
            intent="success"
          />
          <KpiCard
            icon={Star}
            label="Score Médio"
            value={history.stats.avgScore ?? '–'}
            intent="warning"
          />
          <KpiCard
            icon={Flame}
            label="Streak"
            value={`${history.stats.streak}🔥`}
            intent="accent"
          />
        </div>
      )}

      {/* Hero */}
      <div className="bg-gradient-to-br from-primary to-primary-active rounded-panel p-6 text-canvas">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-full bg-canvas/20 flex items-center justify-center">
            <Bot size={24} strokeWidth={1.75} className="text-canvas" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display">Treina com IA</h2>
            <p className="text-canvas/70 text-sm">
              Cenários imersivos com avatares inteligentes
            </p>
          </div>
        </div>
        <p className="text-canvas/80 text-sm mb-4">
          Pratica soft skills, vendas, liderança e compliance com feedback
          comportamental em tempo real.
        </p>
        <div className="flex gap-2 flex-wrap">
          <span className="text-[10px] bg-canvas/20 px-2 py-1 rounded-full">
            🎭 Roleplay
          </span>
          <span className="text-[10px] bg-canvas/20 px-2 py-1 rounded-full">
            🧠 Avaliação IA
          </span>
          <span className="text-[10px] bg-canvas/20 px-2 py-1 rounded-full">
            ⚡ XP + Badges
          </span>
          <span className="text-[10px] bg-canvas/20 px-2 py-1 rounded-full">
            📊 Analytics
          </span>
        </div>
      </div>

      {/* Recommended */}
      <div>
        <h3 className="font-display font-semibold text-ink mb-3 flex items-center gap-2">
          <Target size={16} strokeWidth={1.75} className="text-primary" />
          Recomendados para ti
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {recommended.map((s) => (
            <ScenarioCard key={s.id} scenario={s} onStart={onStartScenario} />
          ))}
          {recommended.length === 0 && (
            <div className="col-span-4 py-8 text-center text-ink-faint text-sm">
              Sem recomendações — completa o teu perfil de competências
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
