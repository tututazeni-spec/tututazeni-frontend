// components/onboarding/CreateTemplateModal.tsx
// Modal "+ Novo template" do cabeçalho do separador "Templates" do
// onboarding. Segue o padrão de components/knowledge/CreateArticleModal — a
// page só monta o componente quando está aberto, por isso o Modal fica
// sempre `open` e `onOpenChange` delega em `onClose` (X, clique fora, Escape).
//
// Submete em POST /onboarding/templates (@Roles(ADMIN, RH) no backend,
// onboarding.controller.ts). O botão que abre esta modal já está escondido
// para quem não é ADMIN/RH — aqui só tratamos o formulário. DTO:
// CreateOnboardingTemplateDto — name e durationDays obrigatórios;
// description, welcomeVideoUrl e active opcionais (active default true no
// backend, por isso só enviamos quando o utilizador o desliga). As tarefas
// do template adicionam-se depois, no detalhe do template.

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

export interface CreateTemplateModalProps {
  onClose: () => void;
}

// Durações típicas de um plano de integração. O DTO aceita qualquer inteiro
// >= 1, mas estas cobrem os casos reais e evitam entrada livre.
const DURATION_ITEMS = [
  { value: '7', label: '7 dias' },
  { value: '15', label: '15 dias' },
  { value: '30', label: '30 dias' },
  { value: '60', label: '60 dias' },
  { value: '90', label: '90 dias' },
];

export function CreateTemplateModal({ onClose }: CreateTemplateModalProps) {
  const notify = useToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [durationDays, setDurationDays] = useState('30');
  const [welcomeVideoUrl, setWelcomeVideoUrl] = useState('');
  const [active, setActive] = useState(true);
  const [submitError, setSubmitError] = useState('');

  const canSubmit = name.trim().length > 0;

  const createTemplate = useApiMutation(
    (body: Record<string, unknown>) =>
      apiClient.post('/onboarding/templates', body),
    {
      invalidateKeys: [queryKeys.onboarding.all],
      onSuccess: () => {
        notify({
          title: 'Template criado',
          description: 'Adicione as tarefas no detalhe do template.',
          intent: 'success',
        });
        onClose();
      },
      onError: (e) =>
        setSubmitError(
          e.message || 'Erro ao criar o template. Tente novamente.',
        ),
    },
  );
  const loading = createTemplate.isPending;

  const handleSubmit = () => {
    if (!canSubmit || loading) return;
    setSubmitError('');
    const payload: Record<string, unknown> = {
      name: name.trim(),
      durationDays: Number(durationDays),
    };
    if (description.trim()) payload.description = description.trim();
    if (welcomeVideoUrl.trim())
      payload.welcomeVideoUrl = welcomeVideoUrl.trim();
    if (!active) payload.active = false;
    createTemplate.mutate(payload);
  };

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Novo template"
        description="Cria um modelo de integração. As tarefas de cada fase adicionam-se depois, no detalhe do template."
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
              items={DURATION_ITEMS}
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
            Criar template
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
