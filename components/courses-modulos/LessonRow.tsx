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
import { useHasRole } from '@/hooks/useCurrentRole';
import { ADMIN_ROLES } from '@/lib/roles';
import { CONTENT_TYPE } from './constants';
import type { Lesson } from './types';

interface LessonRowProps {
  lesson: Lesson;
  onEdit: () => void;
  onDelete: () => void;
}

export function LessonRow({ lesson, onEdit, onDelete }: LessonRowProps) {
  // ADMIN/RH apenas — POST/PUT/DELETE lessons são @Roles(ADMIN, RH) no backend.
  const canManage = useHasRole(ADMIN_ROLES);
  const ct = CONTENT_TYPE[lesson.type] ?? {
    icon: BookMarked,
    color: '#64748b',
    bg: '#f8fafc',
    label: lesson.type,
  };
  const CtIcon = ct.icon;
  const isDataUrl = lesson.contentUrl?.startsWith('data:') ?? false;
  return (
    <div className="flex items-center gap-3 rounded-panel border border-brand-line bg-[#F7F9FC] p-3">
      <span className="text-sm text-ink-faint min-w-5 text-center font-bold">
        {lesson.seq}
      </span>
      <span className="text-ink-muted" style={{ color: ct.color }}>
        <CtIcon size={18} strokeWidth={1.75} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="m-0 text-sm font-semibold text-ink break-words">
          {lesson.title}
        </p>
        <div className="mt-1 flex flex-wrap gap-2">
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
      {canManage && (
        <div className="flex flex-shrink-0 gap-1.5">
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Editar lição ${lesson.title}`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-control border border-brand-line bg-white text-brand hover:bg-brand-soft"
          >
            <Pencil size={14} strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Eliminar lição ${lesson.title}`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-control border border-[#F0C9CF] bg-white text-[#B02D45] hover:bg-[#FDF2F4]"
          >
            <Trash2 size={14} strokeWidth={1.75} />
          </button>
        </div>
      )}
    </div>
  );
}
