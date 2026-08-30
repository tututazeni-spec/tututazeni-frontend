// components/courses/CreateCourseModal.tsx
// Modal de criação de curso — validação (useFormValidation) + mutação
// (useApiMutation). Segue o padrão de components/employees/CreateEmployeeModal:
// o page.tsx só monta este componente quando `showCreate` é true, por isso o
// Modal fica sempre `open`; onOpenChange chama onClose (cobre o X, o clique
// fora e o Escape).
//
// O backend (POST /courses, courses.controller.ts) cria sempre o curso em
// estado DRAFT. A aba "Catálogo" (CatalogView) filtra status=PUBLISHED, por
// isso o curso recém-criado aparece só na aba "Dashboard" até ser publicado
// nos ecrãs de gestão existentes — daí o texto da descrição e do toast.

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

export interface CreateCourseModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

// Espelha o enum CourseLevel do Prisma (schema.prisma) com rótulos PT-PT.
const LEVEL_ITEMS = [
  { value: 'BEGINNER', label: 'Iniciante' },
  { value: 'INTERMEDIATE', label: 'Intermédio' },
  { value: 'ADVANCED', label: 'Avançado' },
];

export function CreateCourseModal({
  onClose,
  onSuccess,
}: CreateCourseModalProps) {
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
      workloadHours: '',
    },
    {
      title: [required()],
    },
  );
  const [submitError, setSubmitError] = useState('');
  const error = validationError || submitError;

  const createCourse = useApiMutation(
    () => {
      // Payload enxuto: só envia campos preenchidos (todos opcionais no DTO
      // excepto title). workloadHours é @IsInt @Min(0) no backend.
      const payload: Record<string, unknown> = { title: form.title.trim() };
      if (form.shortDescription.trim())
        payload.shortDescription = form.shortDescription.trim();
      if (form.description.trim())
        payload.description = form.description.trim();
      if (form.category.trim()) payload.category = form.category.trim();
      if (form.level) payload.level = form.level;
      const hours = Number(form.workloadHours);
      if (form.workloadHours !== '' && Number.isFinite(hours) && hours >= 0) {
        payload.workloadHours = Math.trunc(hours);
      }
      return apiClient.post('/courses', payload);
    },
    {
      invalidateKeys: [queryKeys.courses.all],
      onSuccess: () => {
        onSuccess();
        onClose();
      },
      onError: () => setSubmitError('Erro ao criar curso. Verifique os dados.'),
    },
  );
  const loading = createCourse.isPending;

  const handleSubmit = withValidation(() => {
    setSubmitError('');
    createCourse.mutate(undefined);
  });

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Novo Curso"
        description="O curso é criado como rascunho. Publica-o depois na gestão de cursos."
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
            <FormField label="Título *" htmlFor="cc-title">
              <Input
                id="cc-title"
                value={form.title}
                onChange={(e) => setField('title', e.target.value)}
                className="w-full"
                placeholder="Ex: Introdução à Segurança da Informação"
              />
            </FormField>

            <FormField label="Descrição curta" htmlFor="cc-shortDescription">
              <Input
                id="cc-shortDescription"
                value={form.shortDescription}
                onChange={(e) => setField('shortDescription', e.target.value)}
                className="w-full"
                placeholder="Uma frase que resume o curso"
              />
            </FormField>

            <FormField label="Descrição" htmlFor="cc-description">
              <Textarea
                id="cc-description"
                value={form.description}
                onChange={(e) => setField('description', e.target.value)}
                className="w-full"
                rows={3}
                placeholder="Objectivos, público-alvo, pré-requisitos…"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Categoria" htmlFor="cc-category">
                <Input
                  id="cc-category"
                  value={form.category}
                  onChange={(e) => setField('category', e.target.value)}
                  className="w-full"
                  placeholder="Ex: Compliance"
                />
              </FormField>
              <FormField label="Carga horária (h)" htmlFor="cc-workloadHours">
                <Input
                  id="cc-workloadHours"
                  type="number"
                  min={0}
                  value={form.workloadHours}
                  onChange={(e) => setField('workloadHours', e.target.value)}
                  className="w-full"
                  placeholder="Ex: 8"
                />
              </FormField>
            </div>

            <FormField label="Nível" htmlFor="cc-level">
              <Select
                items={LEVEL_ITEMS}
                value={form.level || undefined}
                onValueChange={(v) => setField('level', v)}
                className="w-full"
                placeholder="Selecionar nível"
              />
            </FormField>
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
            {loading ? 'A criar...' : 'Criar Curso'}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
