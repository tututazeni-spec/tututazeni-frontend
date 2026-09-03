// components/courses-learn/ModuleAccordion.tsx
// Bloco colapsável de um módulo na sidebar (aulas + materiais).
// Extraído de app/(platform)/courses/[courseId]/learn/page.tsx.

'use client';

import { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Lock,
  Paperclip,
  PlayCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { moduleTypeLabel } from './utils';
import { LessonRow } from './LessonRow';
import type { LessonProgress, ModuleProgress } from './types';

interface ModuleAccordionProps {
  module: ModuleProgress;
  activeLesson: LessonProgress | null;
  onSelectLesson: (lesson: LessonProgress) => void;
  defaultOpen: boolean;
}

// Substitui o antigo `ModuleStatusIcon` de `./atoms` — único consumidor,
// por isso migrado directamente para aqui em vez de ficar num ficheiro
// partilhado sem outros consumidores.
function moduleStatusIcon(mod: ModuleProgress) {
  if (mod.locked)
    return <Lock size={16} strokeWidth={1.75} className="text-ink-faint" />;
  if (mod.completed)
    return (
      <CheckCircle2 size={16} strokeWidth={1.75} className="text-success-ink" />
    );
  if (mod.pct > 0)
    return <PlayCircle size={16} strokeWidth={1.75} className="text-accent" />;
  return <Circle size={16} strokeWidth={1.75} className="text-ink-faint" />;
}

export function ModuleAccordion({
  module: mod,
  activeLesson,
  onSelectLesson,
  defaultOpen,
}: ModuleAccordionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className={`border-b border-border last:border-0 ${mod.locked ? 'opacity-60' : ''}`}
    >
      {/* Module header */}
      <div
        className={`flex items-center gap-3 px-4 py-3 cursor-pointer select-none transition-colors ${
          open ? 'bg-surface-sunken' : 'hover:bg-surface-sunken'
        }`}
        onClick={() => !mod.locked && setOpen((v) => !v)}
      >
        {moduleStatusIcon(mod)}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span
              className={`font-body text-xs font-semibold truncate ${mod.locked ? 'text-ink-faint' : 'text-ink'}`}
            >
              {mod.title}
            </span>
            {!mod.mandatory && <Badge intent="info">Opcional</Badge>}
            {mod.type && (
              <span className="font-body text-xs text-ink-faint">
                {moduleTypeLabel(mod.type)}
              </span>
            )}
          </div>
          {!mod.locked && mod.totalCount > 0 && (
            <div className="flex items-center gap-2">
              <ProgressBar value={mod.pct} className="flex-1" />
              <span className="font-body text-xs text-ink-faint flex-shrink-0">
                {mod.completedCount}/{mod.totalCount}
              </span>
            </div>
          )}
          {mod.locked && mod.lockedReason && (
            <div className="font-body text-xs text-warning-ink">
              {mod.lockedReason}
            </div>
          )}
        </div>

        {!mod.locked && (
          <span className="font-body text-ink-faint text-xs flex-shrink-0">
            {open ? '▲' : '▼'}
          </span>
        )}
      </div>

      {/* Lessons */}
      {open && !mod.locked && (
        <div className="border-t border-border">
          {mod.lessons.map((lesson) => (
            <LessonRow
              key={lesson.id}
              lesson={lesson}
              isActive={activeLesson?.id === lesson.id}
              isLocked={mod.locked}
              onClick={() => onSelectLesson(lesson)}
            />
          ))}

          {/* Materiais complementares */}
          {mod.materials.length > 0 && (
            <div className="px-4 py-2 bg-surface-sunken border-t border-border">
              <div className="font-body text-xs font-medium text-ink-faint uppercase tracking-wide mb-1.5">
                Materiais
              </div>
              {mod.materials.map((mat) => (
                <a
                  key={mat.id}
                  href={mat.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 py-1 font-body text-xs text-primary hover:text-primary-hover"
                >
                  <Paperclip size={13} strokeWidth={1.75} />
                  <span className="truncate">{mat.title}</span>
                  {mat.fileType && (
                    <span className="text-ink-faint">{mat.fileType}</span>
                  )}
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
