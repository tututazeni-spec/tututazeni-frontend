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
import { Skeleton } from './atoms';
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

  if (recQuery.isLoading || histQuery.isLoading) return <Skeleton />;

  return (
    <div className="space-y-6">
      {/* Stats strip */}
      {history && (
        <div className="grid grid-cols-4 gap-3">
          {[
            {
              label: 'Sessões',
              value: history.stats.total,
              icon: Play,
              color: 'text-indigo-600',
              bg: 'bg-indigo-50',
            },
            {
              label: 'Concluídas',
              value: history.stats.completed,
              icon: CheckCircle,
              color: 'text-emerald-600',
              bg: 'bg-emerald-50',
            },
            {
              label: 'Score Médio',
              value: history.stats.avgScore ?? '–',
              icon: Star,
              color: 'text-amber-600',
              bg: 'bg-amber-50',
            },
            {
              label: 'Streak',
              value: `${history.stats.streak}🔥`,
              icon: Flame,
              color: 'text-orange-600',
              bg: 'bg-orange-50',
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-xl border border-slate-100 p-3"
            >
              <div className={`p-1.5 rounded-lg ${s.bg} w-fit mb-2`}>
                <s.icon size={14} className={s.color} />
              </div>
              <p className="text-xl font-bold text-slate-800">{s.value}</p>
              <p className="text-[10px] text-slate-400">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <Bot size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Treina com IA</h2>
            <p className="text-indigo-200 text-sm">
              Cenários imersivos com avatares inteligentes
            </p>
          </div>
        </div>
        <p className="text-indigo-100 text-sm mb-4">
          Pratica soft skills, vendas, liderança e compliance com feedback
          comportamental em tempo real.
        </p>
        <div className="flex gap-2">
          <span className="text-[10px] bg-white/20 px-2 py-1 rounded-full">
            🎭 Roleplay
          </span>
          <span className="text-[10px] bg-white/20 px-2 py-1 rounded-full">
            🧠 Avaliação IA
          </span>
          <span className="text-[10px] bg-white/20 px-2 py-1 rounded-full">
            ⚡ XP + Badges
          </span>
          <span className="text-[10px] bg-white/20 px-2 py-1 rounded-full">
            📊 Analytics
          </span>
        </div>
      </div>

      {/* Recommended */}
      <div>
        <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <Target size={16} className="text-indigo-500" />
          Recomendados para ti
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {recommended.map((s) => (
            <ScenarioCard key={s.id} scenario={s} onStart={onStartScenario} />
          ))}
          {recommended.length === 0 && (
            <div className="col-span-4 py-8 text-center text-slate-400 text-sm">
              Sem recomendações — completa o teu perfil de competências
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
