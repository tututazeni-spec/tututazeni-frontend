// components/career-plans/CareerRoadmap.tsx
// Trilha visual de carreira (steps do careerPath). Extraído de
// app/(platform)/career-plans/page.tsx.

'use client';

import { Check, ChevronRight, Compass } from 'lucide-react';
import type { CareerPlan } from './types';

interface CareerRoadmapProps {
  plan: CareerPlan;
}

export function CareerRoadmap({ plan }: CareerRoadmapProps) {
  const steps = plan.careerPath?.steps ?? [];
  if (!steps.length) {
    return (
      <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
        <Compass size={16} /> Nenhuma trilha de carreira associada
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 overflow-x-auto py-2">
      {steps.map((step, idx) => {
        const isCurrent = plan.currentRole?.id === step.role.id;
        const isTarget = plan.targetRole?.id === step.role.id;
        const isPast = step.role.level < (plan.currentRole?.level ?? 0);

        return (
          <div
            key={step.order}
            className="flex items-center gap-2 flex-shrink-0"
          >
            <div className={`flex flex-col items-center`}>
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold border-2 transition-all ${
                  isCurrent
                    ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200'
                    : isTarget
                      ? 'bg-emerald-100 text-emerald-700 border-emerald-400 border-dashed'
                      : isPast
                        ? 'bg-gray-200 text-gray-500 border-gray-200'
                        : 'bg-white text-gray-400 border-gray-200'
                }`}
              >
                {isPast ? <Check size={14} /> : <span>{step.role.level}</span>}
              </div>
              <p
                className={`text-xs mt-1 font-medium text-center max-w-16 truncate ${isCurrent ? 'text-blue-600' : isTarget ? 'text-emerald-600' : 'text-gray-400'}`}
              >
                {step.role.name}
              </p>
              {(isCurrent || isTarget) && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full mt-0.5 ${isCurrent ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}
                >
                  {isCurrent ? 'Actual' : 'Alvo'}
                </span>
              )}
            </div>
            {idx < steps.length - 1 && (
              <ChevronRight
                size={16}
                className="text-gray-300 flex-shrink-0 mt-[-12px]"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
