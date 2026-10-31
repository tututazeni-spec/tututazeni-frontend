// components/avatar-training/builder/FailRules.tsx
// Regras de conclusão: o que recomendar abaixo da nota mínima (apresentação).

import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useSessionList } from '../SessionPicker';
import { Textarea } from '@/components/ui/Textarea';
import { cleanFailRules } from './logic';
import type { SessionRules } from '../types';

// Valor do item "sem sessão" do Select (não aceita valor vazio).
const NO_SESSION = 'NONE';

/** Regras de conclusão (§7): o que recomendar quando a nota fica abaixo da mínima. */
export function FailRules({
  rules,
  onChange,
}: {
  rules: SessionRules;
  onChange: (rules: SessionRules) => void;
}) {
  const f = rules.onFail ?? {};
  const { data: sessions } = useSessionList();
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
        <FormField label="Sessão complementar" htmlFor="fr-sess">
          <Select
            items={[
              { value: NO_SESSION, label: 'Nenhuma' },
              ...(sessions ?? []).map((s) => ({
                value: String(s.id),
                label: `${s.program.title} — ${s.title}`,
              })),
            ]}
            value={
              f.recommendSessionId ? String(f.recommendSessionId) : NO_SESSION
            }
            onValueChange={(v) =>
              set({
                ...f,
                recommendSessionId: v === NO_SESSION ? undefined : Number(v),
              })
            }
            className="w-full"
          />
        </FormField>
      </div>
    </fieldset>
  );
}
