// components/avatar-training/room/QuestionBox.tsx
// Pergunta ao instrutor virtual, por texto ou ditado (apresentação).

import { Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import type { TrainingRoomController } from '@/hooks/useTrainingRoom';
import { DictateButton } from './DictateButton';

export function QuestionBox({ ctl }: { ctl: TrainingRoomController }) {
  const {
    open,
    paused,
    question,
    setQuestion,
    language,
    submitQuestion,
    pending,
  } = ctl;

  return (
    <>
      {open && (
        <div className="flex gap-2">
          <Textarea
            rows={2}
            value={question}
            disabled={paused}
            placeholder="Pergunte ao instrutor virtual (responde só com fontes aprovadas)"
            onChange={(e) => setQuestion(e.target.value)}
            aria-label="Pergunta ao instrutor virtual"
          />
          <div className="flex flex-col gap-1">
            <Button
              size="sm"
              loading={pending.ask}
              disabled={paused || !question.trim()}
              onClick={submitQuestion}
            >
              <Send size={14} /> Perguntar
            </Button>
            <DictateButton
              language={language}
              onText={(t) => setQuestion((prev) => `${prev} ${t}`.trim())}
            />
          </div>
        </div>
      )}
    </>
  );
}
