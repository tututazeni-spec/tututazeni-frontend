// components/courses-learn/LessonRow.tsx
// Linha de lição na sidebar do curso. Extraído de
// app/(platform)/courses/[courseId]/learn/page.tsx.

'use client';

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
      className={`flex items-center gap-3 px-4 py-2.5 border-b border-gray-100 last:border-0 transition-colors ${
        isLocked
          ? 'opacity-40 cursor-not-allowed'
          : isActive
            ? 'bg-blue-50 cursor-pointer'
            : 'hover:bg-gray-50 cursor-pointer'
      }`}
    >
      {/* Completion indicator */}
      <div
        className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${
          lesson.completed
            ? 'bg-emerald-100 text-emerald-700'
            : isActive
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-400'
        }`}
      >
        {lesson.completed ? '✓' : lessonIcon(lesson.type)}
      </div>

      <div className="flex-1 min-w-0">
        <div
          className={`text-xs truncate font-medium ${
            isActive
              ? 'text-blue-800'
              : lesson.completed
                ? 'text-gray-500'
                : 'text-gray-700'
          }`}
        >
          {lesson.title}
        </div>
        {lesson.durationMinutes && (
          <div className="text-xs text-gray-400">
            {fmtDuration(lesson.durationMinutes)}
          </div>
        )}
      </div>

      {isLocked && <span className="text-gray-300 text-xs">🔒</span>}
    </div>
  );
}
