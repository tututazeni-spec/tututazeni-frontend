// components/courses-learn/ModuleAccordion.tsx
// Bloco colapsável de um módulo na sidebar (aulas + materiais).
// Extraído de app/(platform)/courses/[courseId]/learn/page.tsx.

'use client';

import { useState } from 'react';
import { moduleTypeLabel } from './utils';
import { ModuleStatusIcon } from './atoms';
import { LessonRow } from './LessonRow';
import type { LessonProgress, ModuleProgress } from './types';

interface ModuleAccordionProps {
  module: ModuleProgress;
  activeLesson: LessonProgress | null;
  onSelectLesson: (lesson: LessonProgress) => void;
  defaultOpen: boolean;
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
      className={`border-b border-gray-100 last:border-0 ${mod.locked ? 'opacity-60' : ''}`}
    >
      {/* Module header */}
      <div
        className={`flex items-center gap-3 px-4 py-3 cursor-pointer select-none transition-colors ${
          open ? 'bg-gray-50' : 'hover:bg-gray-50'
        }`}
        onClick={() => !mod.locked && setOpen((v) => !v)}
      >
        <ModuleStatusIcon
          locked={mod.locked}
          completed={mod.completed}
          pct={mod.pct}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span
              className={`text-xs font-semibold truncate ${mod.locked ? 'text-gray-400' : 'text-gray-800'}`}
            >
              {mod.title}
            </span>
            {!mod.mandatory && (
              <span className="text-xs px-1.5 py-0 bg-blue-50 text-blue-600 rounded">
                Opcional
              </span>
            )}
            {mod.type && (
              <span className="text-xs text-gray-400">
                {moduleTypeLabel(mod.type)}
              </span>
            )}
          </div>
          {!mod.locked && mod.totalCount > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-1 bg-blue-500 rounded-full"
                  style={{ width: `${mod.pct}%` }}
                />
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0">
                {mod.completedCount}/{mod.totalCount}
              </span>
            </div>
          )}
          {mod.locked && mod.lockedReason && (
            <div className="text-xs text-amber-600">{mod.lockedReason}</div>
          )}
        </div>

        {!mod.locked && (
          <span className="text-gray-400 text-xs flex-shrink-0">
            {open ? '▲' : '▼'}
          </span>
        )}
      </div>

      {/* Lessons */}
      {open && !mod.locked && (
        <div className="border-t border-gray-100">
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
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">
                Materiais
              </div>
              {mod.materials.map((mat) => (
                <a
                  key={mat.id}
                  href={mat.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 py-1 text-xs text-blue-600 hover:text-blue-800"
                >
                  <span>📎</span>
                  <span className="truncate">{mat.title}</span>
                  {mat.fileType && (
                    <span className="text-gray-400">{mat.fileType}</span>
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
