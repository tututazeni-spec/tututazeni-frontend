// components/content-library/AddContentModal.tsx
// Modal "Adicionar Conteúdo" do cabeçalho da Biblioteca. Segue o padrão de
// components/live-classes/CreateLiveClassModal — a page só monta o componente
// quando está aberto, por isso o Modal fica sempre `open` e `onOpenChange`
// delega em `onClose` (X, clique fora, Escape).
//
// Submete em POST /content-library (@Roles(ADMIN, RH, INSTRUCTOR) no backend,
// AUTHOR_ROLES). O conteúdo é criado em DRAFT e precisa de publicação à parte.
// O botão que abre esta modal já está escondido para quem não pode criar —
// aqui só blindamos o payload: campos vazios omitidos, duração -> inteiro.

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

export interface AddContentModalProps {
  onClose: () => void;
}

// value = enum Prisma (ContentFormat / ContentCategory / ContentAssetLevel),
// validado por @IsEnum no backend — nunca traduzir. label = texto apresentado.
const FORMAT_ITEMS = [
  { value: 'VIDEO', label: 'Vídeo' },
  { value: 'ARTICLE', label: 'Artigo' },
  { value: 'PODCAST', label: 'Podcast' },
  { value: 'PDF', label: 'PDF' },
  { value: 'EBOOK', label: 'E-book' },
  { value: 'SCORM', label: 'SCORM' },
  { value: 'MICROLEARNING', label: 'Micro-aprendizagem' },
  { value: 'INFOGRAPHIC', label: 'Infográfico' },
  { value: 'QUIZ', label: 'Questionário' },
  { value: 'TEMPLATE', label: 'Modelo' },
  { value: 'PRESENTATION', label: 'Apresentação' },
  { value: 'COURSE', label: 'Curso' },
  { value: 'WEBINAR', label: 'Webinar' },
  { value: 'HTML5', label: 'HTML5' },
];

const NONE = 'NONE';
const CATEGORY_ITEMS = [
  { value: NONE, label: 'Sem categoria' },
  { value: 'HARD_SKILLS', label: 'Competências técnicas' },
  { value: 'SOFT_SKILLS', label: 'Competências comportamentais' },
  { value: 'COMPLIANCE', label: 'Compliance' },
  { value: 'ONBOARDING', label: 'Integração' },
  { value: 'LANGUAGES', label: 'Línguas' },
  { value: 'PRODUCTS', label: 'Produtos' },
  { value: 'WELLBEING', label: 'Bem-estar' },
  { value: 'LEADERSHIP', label: 'Liderança' },
  { value: 'TECHNICAL', label: 'Técnico' },
  { value: 'OTHER', label: 'Outro' },
];

const LEVEL_ITEMS = [
  { value: NONE, label: 'Sem nível' },
  { value: 'BEGINNER', label: 'Iniciante' },
  { value: 'INTERMEDIATE', label: 'Intermédio' },
  { value: 'ADVANCED', label: 'Avançado' },
  { value: 'EXPERT', label: 'Perito' },
];

const TOGGLES = [
  { key: 'mandatory', label: 'Obrigatório' },
  { key: 'isMicrolearning', label: 'Micro-aprendizagem' },
  { key: 'hasCertification', label: 'Certificação' },
] as const;
type ToggleKey = (typeof TOGGLES)[number]['key'];

export function AddContentModal({ onClose }: AddContentModalProps) {
  const notify = useToast();

  const [title, setTitle] = useState('');
  const [format, setFormat] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(NONE);
  const [level, setLevel] = useState(NONE);
  const [duration, setDuration] = useState('');
  const [flags, setFlags] = useState<Record<ToggleKey, boolean>>({
    mandatory: false,
    isMicrolearning: false,
    hasCertification: false,
  });
  const [submitError, setSubmitError] = useState('');

  const durationNum = Number(duration);
  const durationValid =
    duration.trim() === '' ||
    (Number.isFinite(durationNum) && durationNum >= 1);
  const canSubmit =
    title.trim().length > 0 &&
    format.length > 0 &&
    url.trim().length > 0 &&
    durationValid;

  const createContent = useApiMutation(
    (body: Record<string, unknown>) => apiClient.post('/content-library', body),
    {
      invalidateKeys: [queryKeys.contentLibrary.all],
      onSuccess: () => {
        notify({
          title: 'Conteúdo criado',
          description: 'Fica em rascunho até ser publicado.',
          intent: 'success',
        });
        onClose();
      },
      onError: (e) =>
        setSubmitError(
          e.message || 'Erro ao criar o conteúdo. Tente novamente.',
        ),
    },
  );
  const loading = createContent.isPending;

  const handleSubmit = () => {
    if (!canSubmit || loading) return;
    setSubmitError('');
    createContent.mutate({
      title: title.trim(),
      format,
      url: url.trim(),
      ...(description.trim() ? { description: description.trim() } : {}),
      ...(category !== NONE ? { category } : {}),
      ...(level !== NONE ? { level } : {}),
      ...(duration.trim() !== ''
        ? { durationMin: Math.trunc(durationNum) }
        : {}),
      ...(flags.mandatory ? { mandatory: true } : {}),
      ...(flags.isMicrolearning ? { isMicrolearning: true } : {}),
      ...(flags.hasCertification ? { hasCertification: true } : {}),
    });
  };

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Adicionar Conteúdo"
        description="Regista um novo recurso na biblioteca. Fica em rascunho até ser publicado."
        className="max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="mt-5 space-y-4">
          {submitError && (
            <div className="flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
              <AlertCircle size={16} strokeWidth={1.75} />
              {submitError}
            </div>
          )}

          <FormField label="Título *" htmlFor="ac-title">
            <Input
              id="ac-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Introdução à segurança da informação"
              maxLength={300}
            />
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Formato *" htmlFor="ac-format">
              <Select
                items={FORMAT_ITEMS}
                value={format || undefined}
                onValueChange={setFormat}
                placeholder="Selecionar formato…"
                className="w-full"
              />
            </FormField>

            <FormField
              label="Duração (min)"
              htmlFor="ac-duration"
              error={durationValid ? undefined : 'Mínimo 1 minuto.'}
            >
              <Input
                id="ac-duration"
                type="number"
                min={1}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="Opcional"
              />
            </FormField>
          </div>

          <FormField
            label="URL *"
            htmlFor="ac-url"
            hint="Ligação para o vídeo, ficheiro ou página do recurso."
          >
            <Input
              id="ac-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
            />
          </FormField>

          <FormField label="Descrição" htmlFor="ac-description">
            <Textarea
              id="ac-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Opcional — resumo do que o conteúdo aborda."
              rows={3}
              className="w-full"
            />
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Categoria" htmlFor="ac-category">
              <Select
                items={CATEGORY_ITEMS}
                value={category}
                onValueChange={setCategory}
                className="w-full"
              />
            </FormField>

            <FormField label="Nível" htmlFor="ac-level">
              <Select
                items={LEVEL_ITEMS}
                value={level}
                onValueChange={setLevel}
                className="w-full"
              />
            </FormField>
          </div>

          <div className="flex flex-wrap gap-2">
            {TOGGLES.map((t) => (
              <button
                key={t.key}
                type="button"
                aria-pressed={flags[t.key]}
                onClick={() => setFlags((f) => ({ ...f, [t.key]: !f[t.key] }))}
                className={cn(
                  'rounded-control border px-3 py-1.5 font-body text-xs transition-colors',
                  flags[t.key]
                    ? 'border-primary bg-primary-subtle text-primary'
                    : 'border-border-strong bg-surface text-ink-muted',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
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
            Adicionar
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
