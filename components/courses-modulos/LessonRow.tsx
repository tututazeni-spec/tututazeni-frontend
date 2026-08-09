// components/courses-modulos/LessonRow.tsx
// Linha de lição dentro de um módulo. Extraído de
// app/(platform)/courses/modulos/page.tsx.

'use client';

import { CONTENT_TYPE } from './constants';
import { btnGhost, btnDanger } from './styles';
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
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 14px',
        borderRadius: 8,
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
      }}
    >
      <span
        style={{
          fontSize: 14,
          color: '#94a3b8',
          minWidth: 20,
          textAlign: 'center',
          fontWeight: 700,
        }}
      >
        {lesson.seq}
      </span>
      <span style={{ fontSize: 18 }}>{ct.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: 13,
            fontWeight: 600,
            color: '#1e293b',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {lesson.title}
        </p>
        <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
          <span
            style={{
              padding: '1px 7px',
              borderRadius: 20,
              fontSize: 10,
              fontWeight: 700,
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
              style={{ fontSize: 10, color: '#1e40af' }}
            >
              🔗 Vídeo
            </a>
          )}
          {lesson.pdfUrl && (
            <a
              href={lesson.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 10, color: '#f59e0b' }}
            >
              🔗 PDF
            </a>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <button
          onClick={onEdit}
          style={{ ...btnGhost, padding: '5px 10px', fontSize: 12 }}
        >
          ✏️
        </button>
        <button
          onClick={onDelete}
          style={{ ...btnDanger, padding: '5px 10px' }}
        >
          🗑️
        </button>
      </div>
    </div>
  );
}
