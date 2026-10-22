// components/courses-learn/LessonFooter.tsx
// Barra inferior de uma lição: Anterior/Próxima + "Marcar como concluída".
// Partilhada pelo ContentPlayer e pelo LessonReader (texto/PDF) para a
// navegação e a conclusão se comportarem sempre da mesma forma.

import type { ReactNode } from 'react';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { fmtDuration } from './utils';

interface LessonFooterProps {
  title: string;
  durationMinutes?: number | null;
  completed: boolean;
  completing: boolean;
  onComplete: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  /** Linha extra por baixo do título (ex.: ligação "Descarregar PDF"). */
  extra?: ReactNode;
}

export function LessonFooter({
  title,
  durationMinutes,
  completed,
  completing,
  onComplete,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
  extra,
}: LessonFooterProps) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 sm:py-4 border-t border-border bg-surface flex-wrap">
      <div className="flex items-center gap-2">
        {onPrevious && (
          <Button
            intent="secondary"
            size="sm"
            disabled={!hasPrevious}
            onClick={onPrevious}
          >
            <ChevronLeft size={16} strokeWidth={1.75} />
            Anterior
          </Button>
        )}
        {onNext && (
          <Button
            intent="secondary"
            size="sm"
            disabled={!hasNext}
            onClick={onNext}
          >
            Próxima
            <ChevronRight size={16} strokeWidth={1.75} />
          </Button>
        )}
      </div>

      <div className="hidden sm:block flex-1 min-w-0">
        <div className="font-body text-sm font-medium text-ink truncate">
          {title}
        </div>
        {durationMinutes ? (
          <div className="font-body text-xs text-ink-faint">
            {fmtDuration(durationMinutes)}
          </div>
        ) : null}
        {extra}
      </div>
      <Button
        onClick={onComplete}
        disabled={completing || completed}
        intent={completed ? 'secondary' : 'primary'}
        className="max-sm:w-full"
      >
        {completed ? (
          <>
            <Check size={16} strokeWidth={1.75} /> Concluída
          </>
        ) : completing ? (
          'A marcar…'
        ) : (
          'Marcar como concluída →'
        )}
      </Button>
    </div>
  );
}
