// components/courses-modulos/ModuleBlock.tsx
// Bloco colapsável de um módulo com a lista das suas lições. Extraído de
// app/(platform)/courses/modulos/page.tsx.

'use client';

import { useState } from 'react';
import { card, btnPrimary, btnGhost, btnDanger } from './styles';
import type { CourseModule, Lesson } from './types';
import { LessonRow } from './LessonRow';

interface ModuleBlockProps {
  mod: CourseModule;
  onEditModule: () => void;
  onDeleteModule: () => void;
  onAddLesson: () => void;
  onEditLesson: (l: Lesson) => void;
  onDeleteLesson: (l: Lesson) => void;
}

export function ModuleBlock({
  mod,
  onEditModule,
  onDeleteModule,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
}: ModuleBlockProps) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
      {/* Module header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 18px',
          background: '#f8fafc',
          borderBottom: open ? '1px solid #e2e8f0' : 'none',
          cursor: 'pointer',
        }}
        onClick={() => setOpen((o) => !o)}
      >
        <span style={{ fontSize: 18 }}>{open ? '📂' : '📁'}</span>
        <div style={{ flex: 1 }}>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 700,
              color: '#1e293b',
            }}
          >
            {mod.title}
          </p>
          <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>
            Módulo {mod.seq} · {mod.lessons.length} lição(ões)
          </p>
        </div>
        <div
          style={{ display: 'flex', gap: 6 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onAddLesson}
            style={{ ...btnPrimary, padding: '5px 10px', fontSize: 12 }}
          >
            + Lição
          </button>
          <button
            onClick={onEditModule}
            style={{ ...btnGhost, padding: '5px 10px', fontSize: 12 }}
          >
            ✏️
          </button>
          <button
            onClick={onDeleteModule}
            style={{ ...btnDanger, padding: '5px 10px' }}
          >
            🗑️
          </button>
        </div>
      </div>
      {/* Lessons */}
      {open && (
        <div
          style={{
            padding: '14px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {mod.lessons.length === 0 ? (
            <p
              style={{
                color: '#94a3b8',
                fontSize: 13,
                textAlign: 'center',
                padding: '12px 0',
                margin: 0,
              }}
            >
              Nenhuma lição. Clica em &quot;+ Lição&quot; para adicionar.
            </p>
          ) : (
            mod.lessons.map((l) => (
              <LessonRow
                key={l.id}
                lesson={l}
                onEdit={() => onEditLesson(l)}
                onDelete={() => onDeleteLesson(l)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
