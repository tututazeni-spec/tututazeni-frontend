// components/avatar-training/builder/StepEditor.tsx
// Editor de uma etapa: título, tipo, texto, recurso, pergunta, reforço e
// ramificações (apresentação). Regras: ./logic.ts.

import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { BranchEditor } from './BranchEditor';
import { KINDS, STEP_TYPES } from './constants';
import {
  parseOptions,
  patchQuestion,
  stepTypePatch,
  type StepRef,
} from './logic';
import { ReinforcementEditor } from './ReinforcementEditor';
import type { BuilderQuestion, BuilderStep } from '../types';

interface StepEditorProps {
  step: BuilderStep;
  index: number;
  total: number;
  later: { key: string; title: string }[];
  earlier: { key: string; title: string }[];
  onChange: (patch: Partial<BuilderStep>) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}

export function StepEditor({
  step,
  index,
  total,
  later,
  earlier,
  onChange,
  onMove,
  onRemove,
}: StepEditorProps) {
  const q = step.question;
  const setQ = (patch: Partial<BuilderQuestion>) =>
    onChange({ question: patchQuestion(q, patch) });

  return (
    <div className="space-y-3 rounded-card border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-ink-faint">
          Etapa {index + 1} · {step.key}
        </span>
        <div className="flex gap-1">
          <Button
            size="sm"
            intent="ghost"
            aria-label="Subir etapa"
            disabled={index === 0}
            onClick={() => onMove(-1)}
          >
            <ArrowUp size={14} />
          </Button>
          <Button
            size="sm"
            intent="ghost"
            aria-label="Descer etapa"
            disabled={index === total - 1}
            onClick={() => onMove(1)}
          >
            <ArrowDown size={14} />
          </Button>
          <Button
            size="sm"
            intent="ghost"
            aria-label="Remover etapa"
            onClick={onRemove}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormField label="Título" htmlFor={`st-title-${index}`}>
          <Input
            id={`st-title-${index}`}
            value={step.title}
            onChange={(e) => onChange({ title: e.target.value })}
          />
        </FormField>
        <FormField label="Tipo" htmlFor={`st-type-${index}`}>
          <Select
            value={step.type}
            onValueChange={(v) =>
              onChange(stepTypePatch(step, v as BuilderStep['type']))
            }
            items={STEP_TYPES}
          />
        </FormField>
      </div>

      <FormField
        label="Texto apresentado pelo avatar"
        htmlFor={`st-c-${index}`}
      >
        <Textarea
          id={`st-c-${index}`}
          rows={3}
          value={step.content ?? ''}
          onChange={(e) => onChange({ content: e.target.value })}
        />
      </FormField>

      <FormField
        label="Recurso aprovado (URL)"
        htmlFor={`st-r-${index}`}
        hint="Slide, imagem, vídeo ou documento"
      >
        <Input
          id={`st-r-${index}`}
          value={step.resourceUrl ?? ''}
          onChange={(e) =>
            onChange({ resourceUrl: e.target.value || undefined })
          }
        />
      </FormField>

      {(step.type === 'QUESTION' || step.type === 'SCENARIO') && q && (
        <div className="space-y-3 rounded-card bg-surface-sunken p-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label="Formato" htmlFor={`st-k-${index}`}>
              <Select
                value={q.kind}
                onValueChange={(v) =>
                  setQ({ kind: v as BuilderQuestion['kind'] })
                }
                items={KINDS}
              />
            </FormField>
            <FormField label="Pergunta" htmlFor={`st-p-${index}`}>
              <Input
                id={`st-p-${index}`}
                value={q.prompt ?? ''}
                onChange={(e) => setQ({ prompt: e.target.value })}
              />
            </FormField>
          </div>
          {q.kind === 'SINGLE' && (
            <FormField
              label="Opções (uma por linha, mínimo 2)"
              htmlFor={`st-o-${index}`}
            >
              <Textarea
                id={`st-o-${index}`}
                rows={3}
                value={(q.options ?? []).join('\n')}
                onChange={(e) =>
                  setQ({ options: parseOptions(e.target.value) })
                }
              />
            </FormField>
          )}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField
              label="Resposta correcta"
              htmlFor={`st-a-${index}`}
              hint="Nunca é mostrada ao formando; vazio = sem correcção automática"
            >
              <Input
                id={`st-a-${index}`}
                value={q.correctAnswer ?? ''}
                onChange={(e) =>
                  setQ({ correctAnswer: e.target.value || undefined })
                }
              />
            </FormField>
            <FormField
              label="Explicação após responder"
              htmlFor={`st-e-${index}`}
            >
              <Input
                id={`st-e-${index}`}
                value={q.explanation ?? ''}
                onChange={(e) =>
                  setQ({ explanation: e.target.value || undefined })
                }
              />
            </FormField>
          </div>
        </div>
      )}
      {step.type === 'QUESTION' && (
        <ReinforcementEditor
          step={step}
          index={index}
          earlier={earlier}
          onChange={(reinforcement) => onChange({ reinforcement })}
        />
      )}
      {(step.type === 'QUESTION' || step.type === 'SCENARIO') && (
        <BranchEditor
          step={step}
          index={index}
          later={later}
          onChange={(branches) => onChange({ branches })}
        />
      )}
    </div>
  );
}
