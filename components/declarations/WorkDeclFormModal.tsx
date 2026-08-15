// components/declarations/WorkDeclFormModal.tsx
// Formulário dinâmico de declaração de vínculo laboral (perguntas
// condicionais por tipo de campo). Migrado para a fundação de design:
// backdrop+painel bespoke passam a Modal/ModalContent (components/ui/Modal);
// inputs/select/textarea passam a FormField+Input/Select/Textarea
// (components/ui/*); botões passam a Button (components/ui/Button); o
// pill de tipo passa a Badge neutro (components/ui/Badge). O campo BOOLEAN
// (Sim/Não) fica como par de botões — sem equivalente directo em
// components/ui/. Extraído de app/(platform)/declarations/page.tsx.

'use client';

import { useState, type ReactNode } from 'react';
import { AlertCircle, Loader2, Send } from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { cn } from '@/lib/cn';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { WORK_TYPE_LABELS } from './constants';
import type { WorkForm } from './types';

export interface WorkDeclFormModalProps {
  form: WorkForm;
  onClose: () => void;
  onSuccess: () => void;
}

export function WorkDeclFormModal({
  form,
  onClose,
  onSuccess,
}: WorkDeclFormModalProps) {
  const [answers, setAnswers] = useState<
    Record<string, string | number | boolean>
  >({});
  const [error, setError] = useState('');

  const questions = (form.questions ?? [])
    .filter((q) => {
      if (!q.conditionalKey) return true;
      return answers[q.conditionalKey] == q.conditionalValue;
    })
    .sort((a, b) => a.order - b.order);

  const submitForm = useApiMutation(
    (draft: boolean) =>
      apiClient.post('/declarations/work/submit', {
        formId: form.id,
        answers: Object.entries(answers).map(([key, value]) => ({
          key,
          value,
        })),
        saveAsDraft: draft,
      }),
    {
      onSuccess: () => {
        onSuccess();
        onClose();
      },
      onError: (e) => setError(e.message),
    },
  );
  const loading = submitForm.isPending;
  const handleSubmit = (draft = false) => {
    setError('');
    submitForm.mutate(draft);
  };

  function renderField(q: NonNullable<WorkForm['questions']>[number]): ReactNode {
    if (q.fieldType === 'TEXTAREA') {
      return (
        <Textarea
          id={`wq-${q.key}`}
          value={String(answers[q.key] ?? '')}
          onChange={(e) => setAnswers((a) => ({ ...a, [q.key]: e.target.value }))}
          rows={3}
          className="w-full resize-none"
        />
      );
    }
    if (q.fieldType === 'TEXT') {
      return (
        <Input
          id={`wq-${q.key}`}
          value={String(answers[q.key] ?? '')}
          onChange={(e) => setAnswers((a) => ({ ...a, [q.key]: e.target.value }))}
          className="w-full"
        />
      );
    }
    if (q.fieldType === 'BOOLEAN') {
      return (
        <div className="flex gap-3">
          {['Sim', 'Não'].map((opt) => (
            <button
              key={opt}
              onClick={() => setAnswers((a) => ({ ...a, [q.key]: opt === 'Sim' }))}
              className={cn(
                'flex-1 rounded-control border-2 py-2.5 font-body text-sm font-medium transition-colors',
                answers[q.key] === (opt === 'Sim')
                  ? 'border-primary bg-primary-subtle text-primary'
                  : 'border-border text-ink-muted hover:bg-surface-sunken',
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      );
    }
    if (q.fieldType === 'SELECT' || q.fieldType === 'MULTI_SELECT') {
      return (
        <Select
          items={q.options.map((o) => ({ value: o, label: o }))}
          placeholder="Seleccionar..."
          value={String(answers[q.key] ?? '') || undefined}
          onValueChange={(v) => setAnswers((a) => ({ ...a, [q.key]: v }))}
          className="w-full"
        />
      );
    }
    if (q.fieldType === 'DATE') {
      return (
        <Input
          id={`wq-${q.key}`}
          type="date"
          value={String(answers[q.key] ?? '')}
          onChange={(e) => setAnswers((a) => ({ ...a, [q.key]: e.target.value }))}
          className="w-full"
        />
      );
    }
    if (q.fieldType === 'NUMBER') {
      return (
        <Input
          id={`wq-${q.key}`}
          type="number"
          value={String(answers[q.key] ?? '')}
          onChange={(e) => setAnswers((a) => ({ ...a, [q.key]: +e.target.value }))}
          className="w-full"
        />
      );
    }
    return null;
  }

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent title={form.title} className="max-h-[90vh] max-w-xl overflow-y-auto">
        <div className="mt-1.5">
          <Badge intent="info">{WORK_TYPE_LABELS[form.type]}</Badge>
          {form.description && (
            <p className="mt-1.5 font-body text-sm text-ink-muted">{form.description}</p>
          )}
        </div>

        <div className="mt-5 space-y-5">
          {error && (
            <div className="flex items-center gap-2 rounded-card bg-danger-subtle p-3 font-body text-sm text-danger-ink">
              <AlertCircle size={15} strokeWidth={1.75} />
              {error}
            </div>
          )}

          {questions.map((q) => (
            <FormField
              key={q.key}
              label={q.required ? `${q.label} *` : q.label}
              htmlFor={`wq-${q.key}`}
            >
              {renderField(q)}
            </FormField>
          ))}
        </div>

        <div className="mt-6 flex gap-3 border-t border-border pt-4">
          <Button intent="secondary" disabled={loading} onClick={() => handleSubmit(true)}>
            Guardar Rascunho
          </Button>
          <div className="flex-1" />
          <Button intent="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button disabled={loading} onClick={() => handleSubmit(false)}>
            {loading ? (
              <Loader2 size={14} strokeWidth={1.75} className="animate-spin" />
            ) : (
              <Send size={14} strokeWidth={1.75} />
            )}
            Submeter
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
