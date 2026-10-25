// components/avatar-training/builder/FailRules.tsx
// Regras de conclusão: o que recomendar abaixo da nota mínima (apresentação).

import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { cleanFailRules } from './logic';
import type { SessionRules } from '../types';

/** Regras de conclusão (§7): o que recomendar quando a nota fica abaixo da mínima. */
export function FailRules({
  rules,
  onChange,
}: {
  rules: SessionRules;
  onChange: (rules: SessionRules) => void;
}) {
  const f = rules.onFail ?? {};
  const set = (next: NonNullable<SessionRules['onFail']>) =>
    onChange(cleanFailRules(next));
  return (
    <fieldset className="space-y-2 rounded-card border border-border p-3">
      <legend className="px-1 font-body text-sm font-medium text-ink">
        Se ficar abaixo da nota mínima
      </legend>
      <FormField label="Mensagem" htmlFor="fr-msg">
        <Textarea
          id="fr-msg"
          rows={2}
          value={f.message ?? ''}
          onChange={(e) => set({ ...f, message: e.target.value })}
        />
      </FormField>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormField label="Conteúdo complementar (URL)" htmlFor="fr-url">
          <Input
            id="fr-url"
            value={f.resourceUrl ?? ''}
            onChange={(e) => set({ ...f, resourceUrl: e.target.value })}
          />
        </FormField>
        <FormField label="Sessão complementar (id)" htmlFor="fr-sess">
          <Input
            id="fr-sess"
            type="number"
            min={1}
            value={f.recommendSessionId ?? ''}
            onChange={(e) =>
              set({
                ...f,
                recommendSessionId: Number(e.target.value) || undefined,
              })
            }
          />
        </FormField>
      </div>
    </fieldset>
  );
}
