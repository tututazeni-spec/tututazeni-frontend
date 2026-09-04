// components/courses-modulos/LessonRow.tsx
// Linha de lição dentro de um módulo. Extraído de
// app/(platform)/courses/modulos/page.tsx.

'use client';

import {
  BookMarked,
  Link2,
  FileText,
  BarChart3,
  Pencil,
  Trash2,
} from 'lucide-react';
import { CONTENT_TYPE } from './constants';
import { Button } from '@/components/ui/Button';
import type { Lesson } from './types';

interface LessonRowProps {
  lesson: Lesson;
  onEdit: () => void;
  onDelete: () => void;
}

export function LessonRow({ lesson, onEdit, onDelete }: LessonRowProps) {
  const ct = CONTENT_TYPE[lesson.type] ?? {
    icon: BookMarked,
    color: '#64748b',
    bg: '#f8fafc',
    label: lesson.type,
  };
  const CtIcon = ct.icon;
  const isDataUrl = lesson.contentUrl?.startsWith('data:') ?? false;
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-sunken border border-border">
      <span className="text-sm text-ink-faint min-w-5 text-center font-bold">
        {lesson.seq}
      </span>
      <span className="text-ink-muted" style={{ color: ct.color }}>
        <CtIcon size={18} strokeWidth={1.75} />
      </span>
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
          {lesson.type === 'VIDEO' && lesson.contentUrl && (
            <a
              href={lesson.contentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <Link2 size={12} strokeWidth={1.75} /> Vídeo
            </a>
          )}
          {lesson.type === 'PDF' &&
            lesson.contentUrl &&
            (isDataUrl ? (
              <span className="inline-flex items-center gap-1 text-xs text-warning">
                <FileText size={12} strokeWidth={1.75} /> PDF carregado
              </span>
            ) : (
              <a
                href={lesson.contentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-warning hover:underline"
              >
                <Link2 size={12} strokeWidth={1.75} /> PDF
              </a>
            ))}
          {lesson.type === 'SLIDE' &&
            lesson.contentUrl &&
            (isDataUrl ? (
              <span className="inline-flex items-center gap-1 text-xs text-warning">
                <BarChart3 size={12} strokeWidth={1.75} /> PPTX carregado
              </span>
            ) : (
              <a
                href={lesson.contentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-warning hover:underline"
              >
                <Link2 size={12} strokeWidth={1.75} /> PPTX
              </a>
            ))}
        </div>
      </div>
      <div className="flex gap-1 flex-shrink-0">
        <Button onClick={onEdit} intent="ghost" className="px-2 py-1 text-xs">
          <Pencil size={14} strokeWidth={1.75} />
        </Button>
        <Button
          onClick={onDelete}
          intent="danger"
          className="px-2 py-1 text-xs"
        >
          <Trash2 size={14} strokeWidth={1.75} />
        </Button>
      </div>
    </div>
  );
}
