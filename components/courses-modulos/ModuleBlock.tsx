// components/courses-modulos/ModuleBlock.tsx
// Bloco colapsável de um módulo com a lista das suas lições. Extraído de
// app/(platform)/courses/modulos/page.tsx.

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
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
    <Card className="overflow-hidden p-0">
      {/* Module header */}
      <div
        className="flex items-center gap-3 p-4 bg-surface-sunken border-b border-border cursor-pointer hover:bg-surface-sunken/80 transition-colors"
        style={{
          borderBottom: open ? '1px solid var(--color-border)' : 'none',
        }}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="text-lg">{open ? '📂' : '📁'}</span>
        <div className="flex-1">
          <p className="m-0 text-sm font-bold text-ink">
            {mod.title}
          </p>
          <p className="m-0 text-xs text-ink-faint">
            Módulo {mod.seq} · {mod.lessons.length} lição(ões)
          </p>
        </div>
        <div
          className="flex gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            onClick={onAddLesson}
            intent="primary"
            className="px-2 py-1 text-xs"
          >
            + Lição
          </Button>
          <Button
            onClick={onEditModule}
            intent="ghost"
            className="px-2 py-1 text-xs"
          >
            ✏️
          </Button>
          <Button
            onClick={onDeleteModule}
            intent="danger"
            className="px-2 py-1 text-xs"
          >
            🗑️
          </Button>
        </div>
      </div>
      {/* Lessons */}
      {open && (
        <CardBody className="flex flex-col gap-2">
          {mod.lessons.length === 0 ? (
            <p className="text-ink-faint text-sm text-center py-3 m-0">
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
        </CardBody>
      )}
    </Card>
  );
}
