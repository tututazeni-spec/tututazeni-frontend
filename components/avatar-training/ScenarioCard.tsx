// components/avatar-training/ScenarioCard.tsx
// Cartão de cenário (usado em Início e Cenários). Extraído de
// app/(platform)/avatar-training/page.tsx.

import Image from 'next/image';
import { CheckCircle, Clock, Play, Star, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { CATEGORY_CONFIG, DIFF_INTENT } from './constants';
import type { Scenario } from './types';

export interface ScenarioCardProps {
  scenario: Scenario;
  onStart: (s: Scenario) => void;
}

export function ScenarioCard({ scenario, onStart }: ScenarioCardProps) {
  const cat = CATEGORY_CONFIG[scenario.category] ?? CATEGORY_CONFIG.SOFT_SKILLS;
  const Icon = cat.icon;
  const done = scenario.bestSession?.score ?? null;

  return (
    <Card className="group overflow-hidden p-0 hover:shadow-hover">
      {/* Thumbnail */}
      <div
        className={`h-32 ${cat.bg} flex items-center justify-center relative`}
      >
        {scenario.thumbnailUrl ? (
          <Image
            src={scenario.thumbnailUrl}
            fill
            className="object-cover"
            alt=""
          />
        ) : (
          <Icon
            size={24}
            strokeWidth={1.75}
            className={`${cat.color} opacity-40`}
          />
        )}
        {done !== null && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-surface/90 rounded-full px-2 py-0.5 text-xs font-bold text-success-ink">
            <CheckCircle size={14} strokeWidth={1.75} />
            {done}%
          </div>
        )}
        <div className="absolute inset-0 bg-ink/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button
            onClick={() => onStart(scenario)}
            className="flex items-center gap-2 px-5 py-2 bg-surface text-ink rounded-full font-semibold text-sm shadow-elevated hover:shadow-hover"
          >
            <Play size={14} strokeWidth={1.75} className="ml-0.5" />
            Iniciar
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-3">
        <div className="flex items-center gap-2 mb-1.5">
          <Badge
            intent={DIFF_INTENT[scenario.difficulty]}
            className="px-1.5 py-0.5 text-[10px]"
          >
            {scenario.difficulty}
          </Badge>
          <span className={`text-[10px] font-medium ${cat.color}`}>
            {cat.label}
          </span>
          {scenario.competency && (
            <span className="text-[10px] text-ink-faint ml-auto truncate">
              {scenario.competency.name}
            </span>
          )}
        </div>

        <h4 className="text-sm font-semibold text-ink line-clamp-2 mb-2">
          {scenario.title}
        </h4>

        <div className="flex items-center gap-3 text-[10px] text-ink-faint">
          {scenario.estimatedMinutes && (
            <span className="flex items-center gap-0.5">
              <Clock size={14} strokeWidth={1.75} />
              {scenario.estimatedMinutes} min
            </span>
          )}
          {scenario.xpReward && (
            <span className="flex items-center gap-0.5 text-accent font-semibold">
              <Zap size={14} strokeWidth={1.75} />+{scenario.xpReward} XP
            </span>
          )}
          {scenario.avgScore !== null && scenario.avgScore !== undefined && (
            <span className="flex items-center gap-0.5 ml-auto">
              <Star
                size={14}
                strokeWidth={1.75}
                className="fill-accent text-accent"
              />
              {scenario.avgScore}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
