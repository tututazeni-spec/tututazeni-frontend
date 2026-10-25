// components/courses-learn/LessonEmptyState.tsx
// Painel mostrado quando não há aula aberta. Em vez de um quadro escuro com
// "Selecciona uma aula" (que escondia o motivo de nada abrir), diz porquê:
// o curso não tem módulos, ou todos os módulos estão bloqueados (sem
// matrícula, módulo por publicar, a aguardar o módulo anterior…).

import { BookOpen, Lock } from 'lucide-react';
import type { ModuleProgress } from './types';

interface LessonEmptyStateProps {
  modules: ModuleProgress[];
  loading: boolean;
}

export function LessonEmptyState({ modules, loading }: LessonEmptyStateProps) {
  const noModules = !loading && modules.length === 0;
  const allLocked =
    !loading && modules.length > 0 && modules.every((m) => m.locked);
  const reasons = [
    ...new Set(
      modules.flatMap((m) =>
        m.locked && m.lockedReason ? [m.lockedReason] : [],
      ),
    ),
  ];

  const Icon = allLocked ? Lock : BookOpen;
  const title = loading
    ? 'A carregar o curso…'
    : noModules
      ? 'Este curso ainda não tem módulos'
      : allLocked
        ? 'Nenhuma aula está disponível'
        : 'Selecciona uma aula para começar';
  const hint = loading
    ? null
    : noModules
      ? 'Quando forem criados módulos e lições, aparecem aqui.'
      : allLocked
        ? 'Os módulos deste curso estão bloqueados.'
        : 'Navega pela estrutura do curso na barra lateral.';

  return (
    <div className="flex flex-1 items-center justify-center bg-[#E9EDF4] px-6 text-center">
      <div className="max-w-md rounded-panel border border-brand-line bg-white p-8 shadow-[0_8px_24px_rgba(15,31,61,0.08)]">
        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand text-white">
          <Icon size={22} strokeWidth={1.75} />
        </span>
        <div className="mb-2 font-display text-lg font-semibold text-ink">
          {title}
        </div>
        {hint && <div className="font-body text-sm text-ink-muted">{hint}</div>}
        {allLocked && reasons.length > 0 && (
          <ul className="mt-4 space-y-1 text-left font-body text-sm text-ink">
            {reasons.map((r) => (
              <li key={r} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                {r}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
