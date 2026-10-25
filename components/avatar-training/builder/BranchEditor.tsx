// components/avatar-training/builder/BranchEditor.tsx
// Ramificações de uma etapa (apresentação). Regras: ./logic.ts.

import { FormField } from '@/components/ui/FormField';
import { Select } from '@/components/ui/Select';
import {
  NEXT,
  cleanBranches,
  pickBranch,
  questionChoices,
  targetItems,
  type StepRef,
} from './logic';
import type { BuilderStep, StepBranches } from '../types';

interface BranchEditorProps {
  step: BuilderStep;
  index: number;
  /** Só etapas posteriores — o backend recusa saltos para trás. */
  later: { key: string; title: string }[];
  onChange: (branches: StepBranches | undefined) => void;
}

/** Ramificações (role-play): para onde segue o formando conforme a resposta. */
export function BranchEditor({
  step,
  index,
  later,
  onChange,
}: BranchEditorProps) {
  const q = step.question;
  if (!q) return null;
  const options = questionChoices(q);
  const graded = !!q.correctAnswer;
  const b = step.branches ?? {};
  const items = targetItems(later, 'Seguir em sequência');
  if (later.length === 0 || (options.length === 0 && !graded)) return null;

  const clean = (next: StepBranches) => onChange(cleanBranches(next));
  const pick = pickBranch;

  return (
    <fieldset className="space-y-2 rounded-card bg-surface-sunken p-3">
      <legend className="px-1 font-body text-sm font-medium text-ink">
        Ramificações (opcional)
      </legend>
      <p className="font-body text-xs text-ink-faint">
        Escolha a etapa seguinte conforme a resposta. As etapas saltadas deixam
        de ser exigidas e não contam para a nota.
      </p>
      {graded && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField label="Se acertar, ir para" htmlFor={`br-ok-${index}`}>
            <Select
              value={b.onCorrect ?? NEXT}
              onValueChange={(v) => clean({ ...b, onCorrect: pick(v) })}
              items={items}
            />
          </FormField>
          <FormField label="Se errar, ir para" htmlFor={`br-ko-${index}`}>
            <Select
              value={b.onIncorrect ?? NEXT}
              onValueChange={(v) => clean({ ...b, onIncorrect: pick(v) })}
              items={items}
            />
          </FormField>
        </div>
      )}
      {options.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {options.map((o) => (
            <FormField
              key={o}
              label={`Se escolher «${o}», ir para`}
              htmlFor={`br-${index}-${o}`}
            >
              <Select
                value={b.byOption?.[o] ?? NEXT}
                onValueChange={(v) =>
                  clean({
                    ...b,
                    byOption: { ...b.byOption, [o]: pick(v) ?? '' },
                  })
                }
                items={items}
              />
            </FormField>
          ))}
        </div>
      )}
    </fieldset>
  );
}
