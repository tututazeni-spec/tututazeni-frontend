// components/onboarding/TemplateFormModal.tsx
// Modal único de criação e edição de um template de onboarding. Aberto do
// cabeçalho do separador "Templates" ("+ Novo template") e do
// TemplateDetailModal ("Editar"). Segue o padrão de
// components/competencies/CompetencyFormModal — a page/modal só monta o
// componente quando está aberto (Modal sempre `open`, onOpenChange delega
// em onClose).
//
// Criar → POST /onboarding/templates; editar → PUT /onboarding/templates/:id
// (@Roles(ADMIN, RH), onboarding.controller.ts). DTO: name e durationDays
// obrigatórios; description, welcomeVideoUrl e active opcionais. `active`
// default true no backend — na criação só é enviado quando desligado; na
// edição é sempre enviado (é a única forma de "arquivar" um template, não
// há endpoint dedicado). positionId/departmentId/learningPathId ficam fora
// deste formulário enxuto (v1) e não são tocados no update.

'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { cn } from '@/lib/cn';
import { useToast } from '@/providers/ToastProvider';
import type { OnboardingTemplateDetail } from './types';

export interface TemplateFormModalProps {
  /** Ausente/null → criar; template → editar esse template. */
  template?: OnboardingTemplateDetail | null;
  onClose: () => void;
}

// Durações típicas de um plano de integração. O DTO aceita qualquer inteiro
// >= 1, mas estas cobrem os casos reais e evitam entrada livre. Uma duração
// existente fora da lista é acrescentada dinamicamente.
const BASE_DURATIONS = ['7', '15', '30', '60', '90'];

export function TemplateFormModal({
  template,
  onClose,
}: TemplateFormModalProps) {
  const notify = useToast();
  const editing = template != null;

  const [name, setName] = useState(template?.name ?? '');
  const [description, setDescription] = useState(template?.description ?? '');
  const [durationDays, setDurationDays] = useState(
    String(template?.durationDays ?? 30),
  );
  const [welcomeVideoUrl, setWelcomeVideoUrl] = useState(
    template?.welcomeVideoUrl ?? '',
  );
  const [active, setActive] = useState(template?.active ?? true);
  const [submitError, setSubmitError] = useState('');

  const durationItems = Array.from(new Set([...BASE_DURATIONS, durationDays]))
    .map(Number)
    .sort((a, b) => a - b)
    .map((d) => ({ value: String(d), label: `${d} dias` }));

  const canSubmit = name.trim().length > 0;

  const save = useApiMutation(
    (body: Record<string, unknown>) =>
      editing
        ? apiClient.put(`/onboarding/templates/${template.id}`, body)
        : apiClient.post('/onboarding/templates', body),
    {
      invalidateKeys: editing
        ? [queryKeys.onboarding.all, queryKeys.onboarding.template(template.id)]
        : [queryKeys.onboarding.all],
      onSuccess: () => {
        notify({
          title: editing ? 'Template actualizado' : 'Template criado',
          description: editing
            ? undefined
            : 'Adicione as tarefas no detalhe do template.',
          intent: 'success',
        });
        onClose();
      },
      onError: (e) =>
        setSubmitError(
          e.message || 'Erro ao guardar o template. Tente novamente.',
        ),
    },
  );
  const loading = save.isPending;

  const handleSubmit = () => {
    if (!canSubmit || loading) return;
    setSubmitError('');
    const payload: Record<string, unknown> = {
      name: name.trim(),
      durationDays: Number(durationDays),
    };
    if (description.trim()) payload.description = description.trim();
    else if (editing) payload.description = null;
    if (welcomeVideoUrl.trim())
      payload.welcomeVideoUrl = welcomeVideoUrl.trim();
    else if (editing) payload.welcomeVideoUrl = null;
    // Criar: backend usa default true, só enviamos quando desligado.
    // Editar: enviamos sempre (é o mecanismo de "arquivar").
    if (editing || !active) payload.active = active;
    save.mutate(payload);
  };

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title={editing ? 'Editar template' : 'Novo template'}
        description={
          editing
            ? 'Actualiza os dados do modelo de integração. Desligar "Template activo" arquiva-o.'
            : 'Cria um modelo de integração. As tarefas de cada fase adicionam-se depois, no detalhe do template.'
        }
        className="max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="mt-5 space-y-4">
          {submitError && (
            <div className="flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
              <AlertCircle size={16} strokeWidth={1.75} />
              {submitError}
            </div>
          )}

          <FormField label="Nome *" htmlFor="ot-name">
            <Input
              id="ot-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Onboarding Colaborador TI"
              maxLength={200}
              className="w-full"
            />
          </FormField>

          <FormField label="Descrição" htmlFor="ot-description">
            <Textarea
              id="ot-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Opcional — objectivo e âmbito do plano."
              rows={3}
              className="w-full"
            />
          </FormField>

          <FormField label="Duração *" htmlFor="ot-duration">
            <Select
              items={durationItems}
              value={durationDays}
              onValueChange={setDurationDays}
              className="w-full"
            />
          </FormField>

          <FormField label="URL do vídeo de boas-vindas" htmlFor="ot-video">
            <Input
              id="ot-video"
              value={welcomeVideoUrl}
              onChange={(e) => setWelcomeVideoUrl(e.target.value)}
              placeholder="Opcional — https://…"
              className="w-full"
            />
          </FormField>

          <button
            type="button"
            aria-pressed={active}
            onClick={() => setActive((v) => !v)}
            className={cn(
              'rounded-control border px-3 py-1.5 font-body text-xs transition-colors',
              active
                ? 'border-primary bg-primary-subtle text-primary'
                : 'border-border-strong bg-surface text-ink-muted',
            )}
          >
            Template activo
          </button>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button intent="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            loading={loading}
          >
            {editing ? 'Guardar' : 'Criar template'}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
