// components/courses/CourseProgressCard.tsx
// "Progresso do curso": anel com a percentagem, módulos concluídos, barra e o
// botão "Continuar aula" (visual novo dentro do curso.jpeg).

import { ArrowRight } from 'lucide-react';

interface CourseProgressCardProps {
  pct: number;
  completedModules: number;
  totalModules: number;
  onContinue: () => void;
}

const R = 52;
const C = 2 * Math.PI * R;

export function CourseProgressCard({
  pct,
  completedModules,
  totalModules,
  onContinue,
}: CourseProgressCardProps) {
  const value = Math.min(100, Math.max(0, pct));
  return (
    <section className="flex flex-col items-center gap-3 rounded-panel border border-brand-line bg-surface p-5 shadow-[0_8px_24px_rgba(15,31,61,0.08)]">
      <h3 className="self-start font-display text-xl font-extrabold text-[#0F1F3D]">
        Progresso do curso
      </h3>
      <div className="relative h-32 w-32">
        <svg
          viewBox="0 0 120 120"
          className="h-full w-full -rotate-90"
          aria-hidden
        >
          <circle
            cx="60"
            cy="60"
            r={R}
            fill="none"
            stroke="#E5EAF3"
            strokeWidth="10"
          />
          <circle
            cx="60"
            cy="60"
            r={R}
            fill="none"
            stroke="#16A34A"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - value / 100)}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-display text-3xl font-extrabold text-[#0F1F3D]">
          {value}%
        </span>
      </div>
      <p className="m-0 text-sm font-medium text-[#0F1F3D]">
        {completedModules} de {totalModules} módulos
      </p>
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progresso do curso"
        className="h-2.5 w-full overflow-hidden rounded-full bg-[#E5EAF3]"
      >
        <div
          className="h-full rounded-full bg-[#16A34A]"
          style={{ width: `${value}%` }}
        />
      </div>
      <button
        type="button"
        onClick={onContinue}
        className="flex w-full items-center justify-center gap-2 rounded-card bg-[#15803D] px-4 py-3 font-body text-base font-bold text-white transition-colors hover:bg-[#166534]"
      >
        Continuar aula
        <ArrowRight size={18} strokeWidth={2} />
      </button>
    </section>
  );
}
