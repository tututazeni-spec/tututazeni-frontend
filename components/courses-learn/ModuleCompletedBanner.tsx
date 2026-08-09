// components/courses-learn/ModuleCompletedBanner.tsx
// Celebração de módulo concluído, mostrada em vez do player. Extraído de
// app/(platform)/courses/[courseId]/learn/page.tsx.

'use client';

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
    <div className="flex-1 bg-gray-950 flex items-center justify-center">
      <div className="text-white text-center max-w-sm">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold mb-2">Módulo concluído!</h2>
        <p className="text-gray-300 mb-6">
          Concluíste &quot;{mod.title}&quot; com sucesso.
        </p>
        <button
          onClick={onContinue}
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
        >
          Continuar para o próximo módulo →
        </button>
      </div>
    </div>
  );
}
