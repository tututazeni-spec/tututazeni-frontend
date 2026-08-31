// components/courses/EditCourseModal.tsx
// Modal de edição dos metadados de um curso (título, descrições, categoria,
// carga horária, nível, imagem). Espelha CreateCourseModal, mas via
// PUT /courses/:id. Aberto a partir da aba "Gestão" (GestaoView), só
// ADMIN/RH — o mesmo RBAC do endpoint (courses.controller.ts).
//
// A lista de Gestão só transporta os campos do catálogo, por isso o
// formulário faz GET /courses/:id ao abrir para um preenchimento fiável.
// O formulário em si (EditCourseForm) só monta depois de os dados
// chegarem, para o useFormValidation arrancar já com os valores reais.

'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useFormValidation } from '@/hooks/useFormValidation';
import { required } from '@/lib/validation';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { CourseImageField } from './CourseImageField';
import { Skeleton } from './shared';
import type { CourseDetailData } from './types';

export interface EditCourseModalProps {
  courseId: number;
  onClose: () => void;
  onSuccess: () => void;
}

// Espelha o enum CourseLevel do Prisma (schema.prisma) com rótulos PT-PT.
const LEVEL_ITEMS = [
  { value: 'BEGINNER', label: 'Iniciante' },
  { value: 'INTERMEDIATE', label: 'Intermédio' },
  { value: 'ADVANCED', label: 'Avançado' },
];

export function EditCourseModal({
  courseId,
  onClose,
  onSuccess,
}: EditCourseModalProps) {
  const course = useApiQuery<CourseDetailData>(
    queryKeys.courses.detail(courseId),
    `/courses/${courseId}`,
    { staleTime: STALE_TIME.DYNAMIC },
  );

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Editar Curso"
        description="Actualiza os dados do curso. As alterações aplicam-se de imediato."
        className="max-w-lg max-h-[90vh] overflow-y-auto"
      >
        {course.isLoading || !course.data ? (
          <div className="mt-5">
            <Skeleton rows={4} />
          </div>
        ) : course.error ? (
          <div className="mt-5 flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
            <AlertCircle size={16} strokeWidth={1.75} />
            Não foi possível carregar o curso.
          </div>
        ) : (
          <EditCourseForm
            course={course.data}
            onClose={onClose}
            onSuccess={onSuccess}
          />
        )}
      </ModalContent>
    </Modal>
  );
}

interface EditCourseFormProps {
  course: CourseDetailData;
  onClose: () => void;
  onSuccess: () => void;
}

function EditCourseForm({ course, onClose, onSuccess }: EditCourseFormProps) {
  const {
    values: form,
    setField,
    errorMessage: validationError,
    handleSubmit: withValidation,
  } = useFormValidation(
    {
      title: course.title ?? '',
      shortDescription: course.shortDescription ?? '',
      description: course.description ?? '',
      category: course.category ?? '',
      level: String(course.level ?? ''),
      workloadHours:
        course.workloadHours != null ? String(course.workloadHours) : '',
      thumbnailUrl: course.thumbnailUrl ?? '',
    },
    { title: [required()] },
  );
  const [submitError, setSubmitError] = useState('');
  const error = validationError || submitError;

  const saveCourse = useApiMutation(
    () => {
      // PUT aceita PartialType(CreateCourseDto). Enviamos valores explícitos
      // (string vazia → null) para que limpar um campo o limpe mesmo; o
      // @IsOptional do DTO deixa passar null.
      const hours = Number(form.workloadHours);
      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        shortDescription: form.shortDescription.trim() || null,
        description: form.description.trim() || null,
        category: form.category.trim() || null,
        workloadHours:
          form.workloadHours !== '' && Number.isFinite(hours) && hours >= 0
            ? Math.trunc(hours)
            : null,
        thumbnailUrl: form.thumbnailUrl || null,
      };
      if (form.level) payload.level = form.level;
      return apiClient.put(`/courses/${course.id}`, payload);
    },
    {
      invalidateKeys: [queryKeys.courses.all],
      onSuccess: () => {
        onSuccess();
        onClose();
      },
      onError: () =>
        setSubmitError('Erro ao guardar o curso. Verifique os dados.'),
    },
  );
  const loading = saveCourse.isPending;

  const handleSubmit = withValidation(() => {
    setSubmitError('');
    saveCourse.mutate(undefined);
  });

  return (
    <>
      <div className="mt-5 space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
            <AlertCircle size={16} strokeWidth={1.75} />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          <FormField label="Título *" htmlFor="ec-title">
            <Input
              id="ec-title"
              value={form.title}
              onChange={(e) => setField('title', e.target.value)}
              className="w-full"
            />
          </FormField>

          <FormField label="Descrição curta" htmlFor="ec-shortDescription">
            <Input
              id="ec-shortDescription"
              value={form.shortDescription}
              onChange={(e) => setField('shortDescription', e.target.value)}
              className="w-full"
              placeholder="Uma frase que resume o curso"
            />
          </FormField>

          <FormField label="Descrição" htmlFor="ec-description">
            <Textarea
              id="ec-description"
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              className="w-full"
              rows={3}
              placeholder="Objectivos, público-alvo, pré-requisitos…"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Categoria" htmlFor="ec-category">
              <Input
                id="ec-category"
                value={form.category}
                onChange={(e) => setField('category', e.target.value)}
                className="w-full"
                placeholder="Ex: Compliance"
              />
            </FormField>
            <FormField label="Carga horária (h)" htmlFor="ec-workloadHours">
              <Input
                id="ec-workloadHours"
                type="number"
                min={0}
                value={form.workloadHours}
                onChange={(e) => setField('workloadHours', e.target.value)}
                className="w-full"
                placeholder="Ex: 8"
              />
            </FormField>
          </div>

          <FormField label="Nível" htmlFor="ec-level">
            <Select
              items={LEVEL_ITEMS}
              value={form.level || undefined}
              onValueChange={(v) => setField('level', v)}
              className="w-full"
              placeholder="Selecionar nível"
            />
          </FormField>

          <FormField label="Imagem do curso" htmlFor="ec-thumbnail">
            <CourseImageField
              value={form.thumbnailUrl || null}
              onChange={(v) => setField('thumbnailUrl', v ?? '')}
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
          {loading ? 'A guardar...' : 'Guardar'}
        </Button>
      </div>
    </>
  );
}
