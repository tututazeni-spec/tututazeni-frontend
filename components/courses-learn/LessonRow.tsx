// components/courses-learn/LessonRow.tsx
// Linha de lição na sidebar do curso. Extraído de
// app/(platform)/courses/[courseId]/learn/page.tsx.

'use client';

import { Check, Lock } from 'lucide-react';
import { lessonIcon, fmtDuration } from './utils';
import type { LessonProgress } from './types';

interface LessonRowProps {
  lesson: LessonProgress;
  isActive: boolean;
  isLocked: boolean;
  onClick: () => void;
}

export function LessonRow({
  lesson,
  isActive,
  isLocked,
  onClick,
}: LessonRowProps) {
  return (
    <div
      onClick={!isLocked ? onClick : undefined}
      role="button"
      tabIndex={isLocked ? -1 : 0}
      aria-disabled={isLocked}
      onKeyDown={(e) => {
        if (!isLocked && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      className={`flex items-center gap-3 px-4 py-2.5 border-b border-border last:border-0 transition-colors ${
        isLocked
          ? 'opacity-40 cursor-not-allowed'
          : isActive
            ? 'bg-primary-subtle cursor-pointer'
            : 'hover:bg-surface-sunken cursor-pointer'
      }`}
    >
      {/* Completion indicator */}
      <div
        className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${
          lesson.completed
            ? 'bg-success-subtle text-success-ink'
            : isActive
              ? 'bg-primary text-canvas'
              : 'bg-surface-sunken text-ink-faint'
        }`}
      >
        {lesson.completed ? (
          <Check size={14} strokeWidth={1.75} />
        ) : (
          (() => {
            const LIcon = lessonIcon(lesson.type);
            return <LIcon size={12} strokeWidth={1.75} />;
          })()
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div
          className={`font-body text-xs truncate font-medium ${
            isActive
              ? 'text-primary'
              : lesson.completed
                ? 'text-ink-muted'
                : 'text-ink'
          }`}
        >
          {lesson.title}
        </div>
        {lesson.durationMinutes && (
          <div className="font-body text-xs text-ink-faint">
            {fmtDuration(lesson.durationMinutes)}
          </div>
        )}
      </div>

      {isLocked && (
        <Lock size={14} strokeWidth={1.75} className="text-ink-faint" />
      )}
    </div>
  );
}
