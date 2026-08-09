// components/avatar-training/ScenarioCard.tsx
// Cartão de cenário (usado em Início e Cenários). Extraído de
// app/(platform)/avatar-training/page.tsx.

import Image from 'next/image';
import { CheckCircle, Clock, Play, Star, Zap } from 'lucide-react';
import { CATEGORY_CONFIG, DIFF_COLOR } from './constants';
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
    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden hover:shadow-lg transition-all group">
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
          <Icon size={40} className={`${cat.color} opacity-40`} />
        )}
        {done !== null && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-white/90 rounded-full px-2 py-0.5 text-xs font-bold text-emerald-700">
            <CheckCircle size={10} />
            {done}%
          </div>
        )}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button
            onClick={() => onStart(scenario)}
            className="flex items-center gap-2 px-5 py-2 bg-white text-slate-800 rounded-full font-semibold text-sm shadow-lg hover:shadow-xl"
          >
            <Play size={14} className="ml-0.5" />
            Iniciar
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-3">
        <div className="flex items-center gap-2 mb-1.5">
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${DIFF_COLOR[scenario.difficulty]}`}
          >
            {scenario.difficulty}
          </span>
          <span className={`text-[10px] font-medium ${cat.color}`}>
            {cat.label}
          </span>
          {scenario.competency && (
            <span className="text-[10px] text-slate-400 ml-auto truncate">
              {scenario.competency.name}
            </span>
          )}
        </div>

        <h4 className="text-sm font-semibold text-slate-800 line-clamp-2 mb-2">
          {scenario.title}
        </h4>

        <div className="flex items-center gap-3 text-[10px] text-slate-400">
          {scenario.estimatedMinutes && (
            <span className="flex items-center gap-0.5">
              <Clock size={10} />
              {scenario.estimatedMinutes} min
            </span>
          )}
          {scenario.xpReward && (
            <span className="flex items-center gap-0.5 text-amber-500 font-semibold">
              <Zap size={10} />+{scenario.xpReward} XP
            </span>
          )}
          {scenario.avgScore !== null && scenario.avgScore !== undefined && (
            <span className="flex items-center gap-0.5 ml-auto">
              <Star size={10} className="text-amber-400 fill-amber-400" />
              {scenario.avgScore}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
