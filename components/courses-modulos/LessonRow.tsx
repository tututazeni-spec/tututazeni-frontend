// components/courses-modulos/LessonRow.tsx
// Linha de lição dentro de um módulo. Extraído de
// app/(platform)/courses/modulos/page.tsx.

'use client';

import { CONTENT_TYPE } from './constants';
import { Button } from '@/components/ui/Button';
import type { Lesson } from './types';

interface LessonRowProps {
  lesson: Lesson;
  onEdit: () => void;
  onDelete: () => void;
}

export function LessonRow({ lesson, onEdit, onDelete }: LessonRowProps) {
  const ct = CONTENT_TYPE[lesson.contentType] ?? {
    icon: '📖',
    color: '#64748b',
    bg: '#f8fafc',
    label: lesson.contentType,
  };
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-sunken border border-border">
      <span className="text-sm text-ink-faint min-w-5 text-center font-bold">
        {lesson.seq}
      </span>
      <span className="text-lg">{ct.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="m-0 text-sm font-semibold text-ink overflow-hidden text-ellipsis whitespace-nowrap">
          {lesson.title}
        </p>
        <div className="flex gap-2 mt-1">
          <span
            className="px-2 py-0.5 rounded-full text-xs font-bold"
            style={{
              background: ct.bg,
              color: ct.color,
            }}
          >
            {ct.label}
          </span>
          {lesson.videoUrl && (
            <a
              href={lesson.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline"
            >
              🔗 Vídeo
            </a>
          )}
          {lesson.pdfUrl && (
            <a
              href={lesson.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-warning hover:underline"
            >
              🔗 PDF
            </a>
          )}
        </div>
      </div>
      <div className="flex gap-1 flex-shrink-0">
        <Button
          onClick={onEdit}
          intent="ghost"
          className="px-2 py-1 text-xs"
        >
          ✏️
        </Button>
        <Button
          onClick={onDelete}
          intent="danger"
          className="px-2 py-1 text-xs"
        >
          🗑️
        </Button>
      </div>
    </div>
  );
}
