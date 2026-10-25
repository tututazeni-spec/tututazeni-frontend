// components/avatar-training/builder/ReinforcementEditor.tsx
// Reforço de uma etapa quando a resposta está errada (apresentação).
// Regras: ./logic.ts.

import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import {
  NEXT,
  clampRetries,
  cleanReinforcement,
  targetItems,
  type StepRef,
} from './logic';
import type { BuilderStep, StepReinforcement } from '../types';

interface ReinforcementEditorProps {
  step: BuilderStep;
  index: number;
  /** Só etapas anteriores — o backend recusa a revisão de etapas à frente. */
  earlier: { key: string; title: string }[];
  onChange: (reinforcement: StepReinforcement | undefined) => void;
}

/** Reforço (§7): o que mostrar e se a etapa se repete quando a resposta está errada. */
export function ReinforcementEditor({
  step,
  index,
  earlier,
  onChange,
}: ReinforcementEditorProps) {
  if (!step.question?.correctAnswer) return null;
  const r = step.reinforcement ?? {};
  const clean = (next: StepReinforcement) => onChange(cleanReinforcement(next));
  return (
    <fieldset className="space-y-2 rounded-card bg-surface-sunken p-3">
      <legend className="px-1 font-body text-sm font-medium text-ink">
        Reforço se errar (opcional)
      </legend>
      <p className="font-body text-xs text-ink-faint">
        Mensagem e conteúdo complementar mostrados após uma resposta errada;
        pode obrigar a repetir a etapa antes de avançar.
      </p>
      <FormField label="Mensagem de reforço" htmlFor={`rf-m-${index}`}>
        <Textarea
          id={`rf-m-${index}`}
          rows={2}
          value={r.message ?? ''}
          onChange={(e) => clean({ ...r, message: e.target.value })}
        />
      </FormField>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormField label="Etapa anterior a rever" htmlFor={`rf-s-${index}`}>
          <Select
            value={r.reviewStepKey ?? NEXT}
            onValueChange={(v) =>
              clean({ ...r, reviewStepKey: v === NEXT ? undefined : v })
            }
            items={targetItems(earlier, 'Nenhuma')}
          />
        </FormField>
        <FormField
          label="Conteúdo complementar (URL)"
          htmlFor={`rf-u-${index}`}
        >
          <Input
            id={`rf-u-${index}`}
            value={r.resourceUrl ?? ''}
            onChange={(e) => clean({ ...r, resourceUrl: e.target.value })}
          />
        </FormField>
      </div>
      <div className="flex flex-wrap items-center gap-4 font-body text-sm text-ink">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!r.retryOnIncorrect}
            onChange={(e) =>
              clean({ ...r, retryOnIncorrect: e.target.checked })
            }
          />
          Repetir a etapa antes de avançar
        </label>
        {r.retryOnIncorrect && (
          <label className="flex items-center gap-2">
            Repetições
            <input
              type="number"
              min={1}
              max={5}
              className="w-16 rounded-card border border-border bg-surface px-2 py-1"
              value={r.maxRetries ?? 2}
              onChange={(e) =>
                clean({
                  ...r,
                  maxRetries: clampRetries(e.target.value),
                })
              }
            />
          </label>
        )}
      </div>
    </fieldset>
  );
}
