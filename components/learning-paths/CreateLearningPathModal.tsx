// components/learning-paths/CreateLearningPathModal.tsx
// Modal de criação de trilha — validação (useFormValidation) + mutação
// (useApiMutation). Segue o padrão de components/courses/CreateCourseModal:
// o page.tsx só monta este componente quando `showCreate` é true, por isso
// o Modal fica sempre `open`; onOpenChange chama onClose (cobre o X, o
// clique fora e o Escape).
//
// O backend (POST /learning-paths, learning-paths.controller.ts, @Roles
// ADMIN/RH) cria sempre a trilha em estado DRAFT. A aba "Catálogo"
// (CatalogView) filtra status=PUBLISHED, e este módulo ainda não tem ecrã
// de gestão para publicar/gerir passos — a trilha recém-criada aparece
// apenas no contador "Total de trilhas" do Dashboard (Admin). Daí o texto
// da descrição e do toast.

'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useFormValidation } from '@/hooks/useFormValidation';
import { required } from '@/lib/validation';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { LP_TYPE_MAP } from './constants';
import type { LPType } from './types';

export interface CreateLearningPathModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

// Espelha o enum LearningPathLevel do Prisma com os rótulos PT-PT já
// usados em constants.ts (LP_LEVEL_MAP).
const LEVEL_ITEMS = [
  { value: 'BEGINNER', label: 'Básico' },
  { value: 'INTERMEDIATE', label: 'Intermédio' },
  { value: 'ADVANCED', label: 'Avançado' },
];

// Todos os valores do enum LearningPathType, rotulados a partir do mapa
// partilhado do módulo.
const TYPE_ITEMS = (Object.keys(LP_TYPE_MAP) as LPType[]).map((k) => ({
  value: k,
  label: LP_TYPE_MAP[k].label,
}));

const MANDATORY_ITEMS = [
  { value: 'false', label: 'Opcional' },
  { value: 'true', label: 'Obrigatória' },
];

export function CreateLearningPathModal({
  onClose,
  onSuccess,
}: CreateLearningPathModalProps) {
  const {
    values: form,
    setField,
    errorMessage: validationError,
    handleSubmit: withValidation,
  } = useFormValidation(
    {
      title: '',
      shortDescription: '',
      description: '',
      category: '',
      level: '',
      pathType: '',
      mandatory: 'false',
    },
    {
      title: [required()],
    },
  );
  const [submitError, setSubmitError] = useState('');
  const error = validationError || submitError;

  const createPath = useApiMutation(
    () => {
      // Payload enxuto: só envia campos preenchidos (todos opcionais no DTO
      // excepto title). O backend cria em DRAFT.
      const payload: Record<string, unknown> = { title: form.title.trim() };
      if (form.shortDescription.trim())
        payload.shortDescription = form.shortDescription.trim();
      if (form.description.trim())
        payload.description = form.description.trim();
      if (form.category.trim()) payload.category = form.category.trim();
      if (form.level) payload.level = form.level;
      if (form.pathType) payload.pathType = form.pathType;
      payload.mandatory = form.mandatory === 'true';
      return apiClient.post('/learning-paths', payload);
    },
    {
      invalidateKeys: [queryKeys.learningPaths.all],
      onSuccess: () => {
        onSuccess();
        onClose();
      },
      onError: () =>
        setSubmitError('Erro ao criar trilha. Verifique os dados.'),
    },
  );
  const loading = createPath.isPending;

  const handleSubmit = withValidation(() => {
    setSubmitError('');
    createPath.mutate(undefined);
  });

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Nova Trilha"
        description="A trilha é criada como rascunho. Adiciona-lhe cursos e publica-a depois na gestão de trilhas."
        className="max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="mt-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-danger-subtle text-danger-ink rounded-card text-sm">
              <AlertCircle size={16} strokeWidth={1.75} />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            <FormField label="Título *" htmlFor="clp-title">
              <Input
                id="clp-title"
                value={form.title}
                onChange={(e) => setField('title', e.target.value)}
                className="w-full"
                placeholder="Ex: Onboarding Colaborador 2026"
              />
            </FormField>

            <FormField label="Descrição curta" htmlFor="clp-shortDescription">
              <Input
                id="clp-shortDescription"
                value={form.shortDescription}
                onChange={(e) => setField('shortDescription', e.target.value)}
                className="w-full"
                placeholder="Uma frase que resume a trilha"
              />
            </FormField>

            <FormField label="Descrição" htmlFor="clp-description">
              <Textarea
                id="clp-description"
                value={form.description}
                onChange={(e) => setField('description', e.target.value)}
                className="w-full"
                rows={3}
                placeholder="Objectivos, público-alvo, resultados esperados…"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Categoria" htmlFor="clp-category">
                <Input
                  id="clp-category"
                  value={form.category}
                  onChange={(e) => setField('category', e.target.value)}
                  className="w-full"
                  placeholder="Ex: Compliance"
                />
              </FormField>
              <FormField label="Nível" htmlFor="clp-level">
                <Select
                  items={LEVEL_ITEMS}
                  value={form.level || undefined}
                  onValueChange={(v) => setField('level', v)}
                  className="w-full"
                  placeholder="Selecionar nível"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Tipo" htmlFor="clp-pathType">
                <Select
                  items={TYPE_ITEMS}
                  value={form.pathType || undefined}
                  onValueChange={(v) => setField('pathType', v)}
                  className="w-full"
                  placeholder="Selecionar tipo"
                />
              </FormField>
              <FormField label="Adesão" htmlFor="clp-mandatory">
                <Select
                  items={MANDATORY_ITEMS}
                  value={form.mandatory}
                  onValueChange={(v) => setField('mandatory', v)}
                  className="w-full"
                />
              </FormField>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3 border-t border-border pt-4">
          <Button
            intent="secondary"
            className="flex-1 justify-center"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1 justify-center"
            onClick={handleSubmit}
            loading={loading}
          >
            {loading ? 'A criar...' : 'Criar Trilha'}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
