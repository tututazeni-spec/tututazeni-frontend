// components/courses/LessonHero.tsx
// Faixa de topo da aula no curso inscrito (visual novo dentro do curso.jpeg):
// imagem do curso sob um degradê azul-marinho, etiqueta do módulo, título,
// duração e progresso das aulas do módulo.

import { Clock, PlayCircle } from 'lucide-react';

interface LessonHeroProps {
  moduleSeq: number | null;
  title: string;
  lessonTitle: string;
  durationMinutes: number | null;
  completedCount: number;
  totalCount: number;
  imageUrl?: string | null;
}

export function LessonHero({
  moduleSeq,
  title,
  lessonTitle,
  durationMinutes,
  completedCount,
  totalCount,
  imageUrl,
}: LessonHeroProps) {
  const pct =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  return (
    <section
      className="relative overflow-hidden rounded-panel bg-[#0F1F3D] p-5 text-white shadow-[0_8px_24px_rgba(15,31,61,0.18)] sm:p-7"
      style={
        imageUrl
          ? {
              backgroundImage: `linear-gradient(90deg, #0F1F3D 35%, rgba(15,31,61,0.55) 100%), url(${imageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'right center',
            }
          : { backgroundImage: 'linear-gradient(120deg, #0F1F3D, #1D4ED8)' }
      }
    >
      {moduleSeq != null && (
        <span className="inline-block rounded-card bg-[#2563EB] px-3 py-1 text-sm font-semibold">
          Módulo {moduleSeq}
        </span>
      )}
      <h2 className="mt-3 max-w-2xl break-words font-display text-2xl font-extrabold leading-tight sm:text-3xl">
        {title}
      </h2>
      <p className="mt-1 break-words text-sm text-white/80">{lessonTitle}</p>
      <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium">
        {durationMinutes ? (
          <span className="flex items-center gap-2">
            <Clock size={18} strokeWidth={1.75} />
            {durationMinutes} minutos
          </span>
        ) : null}
        <span className="flex items-center gap-2">
          <PlayCircle size={18} strokeWidth={1.75} />
          {completedCount}/{totalCount} aulas concluídas
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progresso do módulo"
        className="mt-4 h-2.5 w-full max-w-xl overflow-hidden rounded-full bg-white/25"
      >
        <div
          className="h-full rounded-full bg-[#22C55E]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </section>
  );
}
