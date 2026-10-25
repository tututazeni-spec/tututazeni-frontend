// components/avatar-training/builder/SessionFormView.tsx
// Formulário da sessão: dados, regras de falha, etapas e gravação
// (apresentação). Estado e mutações: hooks/useSessionBuilder.ts.

import type { ReactNode } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Textarea } from '@/components/ui/Textarea';
import type { SessionBuilderController } from '@/hooks/useSessionBuilder';
import { EXPERIENCE_LABEL, PROGRAM_STATUS } from '../constants';
import { FailRules } from './FailRules';
import { stepRefs } from './logic';
import { StepEditor } from './StepEditor';
import type { ExperienceType } from '../types';

interface SessionFormViewProps {
  ctl: SessionBuilderController;
  /** Caixa de atribuição, injectada pelo container (tem o seu próprio hook). */
  assignBox: ReactNode;
}

export function SessionFormView({ ctl, assignBox }: SessionFormViewProps) {
  const {
    session,
    title,
    welcome,
    duration,
    experienceType,
    setFields,
    steps,
    rules,
    setRules,
    patchStep,
    moveStep,
    removeStep,
    addStep,
    canSave,
    save,
    isSaving,
  } = ctl;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 font-body text-xs text-ink-muted">
        <StatusBadge
          value={session.status}
          map={PROGRAM_STATUS}
          variant="dot"
        />
        v{session.version} · {session.program.title}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <FormField label="Título" htmlFor="sf-title">
          <Input
            id="sf-title"
            value={title}
            onChange={(e) => setFields({ title: e.target.value })}
          />
        </FormField>
        <FormField label="Tipo de experiência" htmlFor="sf-type">
          <Select
            value={experienceType}
            onValueChange={(v) =>
              setFields({ experienceType: v as ExperienceType })
            }
            items={(Object.keys(EXPERIENCE_LABEL) as ExperienceType[]).map(
              (t) => ({ value: t, label: EXPERIENCE_LABEL[t] }),
            )}
          />
        </FormField>
        <FormField label="Duração (min)" htmlFor="sf-dur">
          <Input
            id="sf-dur"
            type="number"
            min={1}
            value={duration}
            onChange={(e) => setFields({ duration: e.target.value })}
          />
        </FormField>
      </div>
      <FormField label="Mensagem inicial do avatar" htmlFor="sf-welcome">
        <Textarea
          id="sf-welcome"
          rows={2}
          value={welcome}
          onChange={(e) => setFields({ welcome: e.target.value })}
        />
      </FormField>

      <FailRules rules={rules} onChange={setRules} />

      <div className="space-y-3">
        {steps.map((s, i) => {
          const { later, earlier } = stepRefs(steps, i);
          return (
            <StepEditor
              key={s.key}
              step={s}
              index={i}
              total={steps.length}
              later={later}
              earlier={earlier}
              onChange={(p) => patchStep(i, p)}
              onMove={(d) => moveStep(i, d)}
              onRemove={() => removeStep(i)}
            />
          );
        })}
        <Button size="sm" intent="secondary" onClick={addStep}>
          <Plus size={14} /> Adicionar etapa
        </Button>
      </div>

      <Button size="sm" loading={isSaving} disabled={!canSave} onClick={save}>
        Guardar sessão
      </Button>

      {assignBox}
    </div>
  );
}
