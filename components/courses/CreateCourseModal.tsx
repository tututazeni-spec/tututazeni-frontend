// components/courses/CreateCourseModal.tsx
// Modal de criação de curso — mesmo padrão de
// components/employees/CreateEmployeeModal.tsx (useFormValidation +
// useApiMutation + Modal/ModalContent). Substitui o placeholder
// `alert('Abrir formulário de criação de curso')` de app/(platform)/courses/page.tsx,
// que nunca abria nenhum formulário. POST /courses só aceita ADMIN/RH
// (courses.controller.ts) e só exige `title`; os restantes campos do
// CreateCourseDto são opcionais — aqui expomos os mais relevantes para
// um primeiro rascunho de curso (fica em DRAFT por omissão no backend).

'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { useFormValidation } from '@/hooks/useFormValidation';
import { required } from '@/lib/validation';
import { queryKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import type { Course } from './types';

export interface CreateCourseModalProps {
  onClose: () => void;
  onSuccess: (course: Course) => void;
}

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
      category: '',
      workloadHours: '',
      level: 'BEGINNER',
    },
    {
      title: [required()],
    },
  );
  const [submitError, setSubmitError] = useState('');
  const error = validationError || submitError;

  const createCourse = useApiMutation<Course, undefined>(
    () =>
      apiClient.post('/courses', {
        title: form.title,
        shortDescription: form.shortDescription || undefined,
        category: form.category || undefined,
        workloadHours: form.workloadHours ? Number(form.workloadHours) : undefined,
        level: form.level || undefined,
      }),
    {
      invalidateKeys: [queryKeys.courses.lists()],
      onSuccess: (course) => {
        onSuccess(course);
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
        description="O curso fica em rascunho — podes completar o resto depois"
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
                placeholder="Ex: Excel Avançado"
              />
            </FormField>

            <FormField label="Descrição breve" htmlFor="cc-shortDescription">
              <Textarea
                id="cc-shortDescription"
                value={form.shortDescription}
                onChange={(e) => setField('shortDescription', e.target.value)}
                className="w-full"
                rows={3}
                placeholder="Resumo curto para o catálogo"
              />
            </FormField>

            <div className="grid grid-cols-3 gap-3">
              <FormField label="Categoria" htmlFor="cc-category">
                <Input
                  id="cc-category"
                  value={form.category}
                  onChange={(e) => setField('category', e.target.value)}
                  className="w-full"
                  placeholder="Ex: Tecnologia"
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
                />
              </FormField>
              <FormField label="Nível" htmlFor="cc-level">
                <Select
                  items={LEVEL_ITEMS}
                  value={form.level}
                  onValueChange={(v) => setField('level', v)}
                  className="w-full"
                />
              </FormField>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3 border-t border-border pt-4">
          <Button intent="secondary" className="flex-1 justify-center" onClick={onClose}>
            Cancelar
          </Button>
          <Button className="flex-1 justify-center" onClick={handleSubmit} loading={loading}>
            {loading ? 'A criar...' : 'Criar Curso'}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
