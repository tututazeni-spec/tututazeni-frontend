// components/avatar-training/room/StepPanel.tsx
// Etapa actual: conteúdo, recurso e pergunta/continuar (apresentação).

import { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { DictateButton } from './DictateButton';
import { questionOptions } from './logic';
import { ResourceView } from './ResourceView';
import type { RoomStep } from '../types';

interface StepPanelProps {
  step: RoomStep;
  disabled: boolean;
  language: string;
  onAnswer: (answer: string) => void;
  onAdvance: () => void;
}

export function StepPanel({
  step,
  disabled,
  language,
  onAnswer,
  onAdvance,
}: StepPanelProps) {
  const [text, setText] = useState('');
  const q = step.question;
  const options = questionOptions(step);

  return (
    <div className="rounded-card border border-border bg-surface p-4">
      <h3 className="font-display text-base font-semibold text-ink">
        {step.title}
      </h3>
      {step.content && (
        <p className="mt-2 whitespace-pre-wrap font-body text-sm text-ink-muted">
          {step.content}
        </p>
      )}
      {step.resourceUrl && (
        <ResourceView url={step.resourceUrl} title={step.title} />
      )}
      {q ? (
        <div className="mt-3 space-y-2">
          {q.prompt && (
            <p className="font-body text-sm font-medium text-ink">{q.prompt}</p>
          )}
          {options.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {options.map((o) => (
                <Button
                  key={o}
                  size="sm"
                  intent="secondary"
                  disabled={disabled}
                  onClick={() => onAnswer(o)}
                >
                  {o}
                </Button>
              ))}
            </div>
          ) : (
            <div className="flex gap-2">
              <Textarea
                rows={2}
                value={text}
                disabled={disabled}
                onChange={(e) => setText(e.target.value)}
                aria-label="A sua resposta"
              />
              <div className="flex flex-col gap-1">
                <Button
                  size="sm"
                  disabled={disabled || !text.trim()}
                  onClick={() => {
                    onAnswer(text.trim());
                    setText('');
                  }}
                >
                  <Send size={14} /> Responder
                </Button>
                <DictateButton
                  language={language}
                  onText={(t) => setText((prev) => `${prev} ${t}`.trim())}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <Button
          className="mt-3"
          size="sm"
          disabled={disabled}
          onClick={onAdvance}
        >
          Continuar
        </Button>
      )}
    </div>
  );
}
