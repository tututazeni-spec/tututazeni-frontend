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
      <div className="flex items-center gap-2 py-4 font-body text-sm text-ink-faint">
        <Compass size={16} strokeWidth={1.75} /> Nenhuma trilha de carreira
        associada
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
                className={`w-10 h-10 rounded-control flex items-center justify-center text-xs font-bold border-2 transition-all ${
                  isCurrent
                    ? 'bg-primary text-canvas border-primary shadow-hover'
                    : isTarget
                      ? 'bg-success-subtle text-success-ink border-success border-dashed'
                      : isPast
                        ? 'bg-surface-sunken text-ink-muted border-border-strong'
                        : 'bg-surface text-ink-faint border-border'
                }`}
              >
                {isPast ? (
                  <Check size={14} strokeWidth={1.75} />
                ) : (
                  <span>{step.role.level}</span>
                )}
              </div>
              <p
                className={`mt-1 max-w-16 truncate text-center font-body text-xs font-medium ${isCurrent ? 'text-primary' : isTarget ? 'text-success' : 'text-ink-faint'}`}
              >
                {step.role.name}
              </p>
              {(isCurrent || isTarget) && (
                <span
                  className={`mt-0.5 rounded-full px-1.5 py-0.5 font-body text-xs ${isCurrent ? 'bg-primary-subtle text-primary' : 'bg-success-subtle text-success-ink'}`}
                >
                  {isCurrent ? 'Actual' : 'Alvo'}
                </span>
              )}
            </div>
            {idx < steps.length - 1 && (
              <ChevronRight
                size={16}
                strokeWidth={1.75}
                className="text-ink-faint flex-shrink-0 mt-[-12px]"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
