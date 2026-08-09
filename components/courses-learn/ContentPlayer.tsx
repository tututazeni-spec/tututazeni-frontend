// components/courses-learn/ContentPlayer.tsx
// Área de reprodução da lição activa (vídeo/PDF/texto/outros) + barra de
// conclusão. Extraído de app/(platform)/courses/[courseId]/learn/page.tsx.

'use client';

import { lessonIcon, fmtDuration } from './utils';
import type { LessonProgress, ModuleProgress } from './types';

interface ContentPlayerProps {
  lesson: LessonProgress;
  onComplete: () => void;
  completing: boolean;
  currentModule: ModuleProgress | null;
}

export function ContentPlayer({
  lesson,
  onComplete,
  completing,
  currentModule,
}: ContentPlayerProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Module breadcrumb */}
      {currentModule && (
        <div className="px-6 py-2 border-b border-gray-100 bg-gray-50 text-xs text-gray-500 flex items-center gap-2">
          <span className="font-medium">{currentModule.title}</span>
          <span className="text-gray-300">›</span>
          <span>{lesson.title}</span>
        </div>
      )}

      {/* Player area */}
      <div className="flex-1 bg-gray-950 flex items-center justify-center">
        {lesson.type === 'VIDEO' ? (
          <div className="text-white text-center">
            <div className="text-6xl mb-4">▶</div>
            <div className="text-base font-medium">{lesson.title}</div>
            <div className="text-sm text-gray-400 mt-2">
              Player de vídeo (YouTube / Vimeo / próprio)
            </div>
          </div>
        ) : lesson.type === 'PDF' ? (
          <div className="text-white text-center">
            <div className="text-6xl mb-4">📄</div>
            <div className="text-base font-medium">{lesson.title}</div>
            <a
              href="#"
              className="mt-3 inline-block text-sm text-blue-400 hover:text-blue-300"
            >
              Abrir PDF →
            </a>
          </div>
        ) : lesson.type === 'TEXT' ? (
          <div className="max-w-2xl mx-auto text-white p-8">
            <h2 className="text-xl font-semibold mb-4">{lesson.title}</h2>
            <p className="text-gray-300 leading-relaxed">
              Conteúdo de texto da aula aqui…
            </p>
          </div>
        ) : (
          <div className="text-white text-center">
            <div className="text-6xl mb-4">{lessonIcon(lesson.type)}</div>
            <div className="text-base font-medium">{lesson.title}</div>
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-white">
        <div>
          <div className="text-sm font-medium text-gray-900">
            {lesson.title}
          </div>
          {lesson.durationMinutes && (
            <div className="text-xs text-gray-400">
              {fmtDuration(lesson.durationMinutes)}
            </div>
          )}
        </div>
        <button
          onClick={onComplete}
          disabled={completing || lesson.completed}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-colors disabled:opacity-60 ${
            lesson.completed
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-blue-700 text-white hover:bg-blue-800'
          }`}
        >
          {lesson.completed
            ? '✓ Concluída'
            : completing
              ? 'A marcar…'
              : 'Marcar como concluída →'}
        </button>
      </div>
    </div>
  );
}
