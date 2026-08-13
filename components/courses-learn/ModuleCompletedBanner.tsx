// components/courses-learn/ModuleCompletedBanner.tsx
// Celebração de módulo concluído, mostrada em vez do player. Extraído de
// app/(platform)/courses/[courseId]/learn/page.tsx.

'use client';

import { Button } from '@/components/ui/Button';
import type { ModuleProgress } from './types';

interface ModuleCompletedBannerProps {
  module: ModuleProgress;
  onContinue: () => void;
}

export function ModuleCompletedBanner({
  module: mod,
  onContinue,
}: ModuleCompletedBannerProps) {
  return (
    <div className="flex-1 bg-ink flex items-center justify-center">
      <div className="text-canvas text-center max-w-sm">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="font-display text-2xl font-bold mb-2">
          Módulo concluído!
        </h2>
        <p className="font-body text-canvas/80 mb-6">
          Concluíste &quot;{mod.title}&quot; com sucesso.
        </p>
        <Button intent="secondary" onClick={onContinue}>
          Continuar para o próximo módulo →
        </Button>
      </div>
    </div>
  );
}
