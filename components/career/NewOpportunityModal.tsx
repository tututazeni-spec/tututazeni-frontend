// components/career/NewOpportunityModal.tsx
// Modal "Nova Oportunidade" (RH/Gestor/Admin) — Módulo Career, secção 5.
// Posts para POST /career/vacancies (CreateInternalVacancyDto, já enriquecido
// com código/unidade/localização/nível de carreira/gestor responsável).

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
import { useUnits } from '@/components/departments/departmentFormData';
import { DepartmentUserPicker } from '@/components/departments/DepartmentUserPicker';
import type { DirectoryUser } from '@/components/users/types';
import { useDepartmentOptions, usePositionOptions } from './careerFormData';

const VACANCY_TYPE_OPTIONS = [
  { value: 'PROMOTION', label: 'Promoção' },
  { value: 'LATERAL', label: 'Mobilidade Lateral' },
  { value: 'GIG_PROJECT', label: 'Projecto Temporário' },
  { value: 'JOB_ROTATION', label: 'Rotação de Funções' },
  { value: 'SHADOWING', label: 'Acompanhamento Profissional' },
];

const CAREER_LEVEL_OPTIONS = [
  { value: 'INTERN', label: 'Estagiário' },
  { value: 'JUNIOR', label: 'Júnior' },
  { value: 'MID', label: 'Pleno' },
  { value: 'SENIOR', label: 'Sénior' },
  { value: 'LEAD', label: 'Lead' },
  { value: 'MANAGER', label: 'Gestor' },
  { value: 'DIRECTOR', label: 'Director' },
  { value: 'EXECUTIVE', label: 'Executivo' },
];

export interface NewOpportunityModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function NewOpportunityModal({ onClose, onSuccess }: NewOpportunityModalProps) {
  const { options: departmentOptions } = useDepartmentOptions();
  const { options: positionOptions } = usePositionOptions();
  const { units } = useUnits();
  const unitOptions = units.map((u) => ({ value: String(u.id), label: u.name }));
  const [responsibleManager, setResponsibleManager] = useState<DirectoryUser | null>(null);
  const [submitError, setSubmitError] = useState('');

  const {
    values: form,
    setValues: setForm,
    errorMessage: validationError,
    handleSubmit: withValidation,
  } = useFormValidation(
    {
      title: '',
      code: '',
      type: '',
      positionId: '',
      departmentId: '',
      unitId: '',
      location: '',
      careerLevel: '',
      description: '',
      requiredTraining: '',
      closingDate: '',
    },
    { title: [required()], type: [required()] },
  );

  const create = useApiMutation(
    () =>
      apiClient.post('/career/vacancies', {
        title: form.title,
        code: form.code || undefined,
        type: form.type,
        positionId: form.positionId ? Number(form.positionId) : undefined,
        departmentId: form.departmentId ? Number(form.departmentId) : undefined,
        unitId: form.unitId ? Number(form.unitId) : undefined,
        location: form.location || undefined,
        careerLevel: form.careerLevel || undefined,
        responsibleManagerId: responsibleManager?.id,
        description: form.description || undefined,
        requiredTraining: form.requiredTraining || undefined,
        closingDate: form.closingDate || undefined,
      }),
    {
      invalidateKeys: [queryKeys.career.all],
      onSuccess: () => {
        onSuccess();
        onClose();
      },
      onError: (e) => setSubmitError(e.message),
    },
  );

  const handleSubmit = withValidation(() => {
    setSubmitError('');
    create.mutate(undefined);
  });
  const error = validationError || submitError;

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent title="Nova Oportunidade" className="max-h-[90vh] max-w-lg overflow-y-auto">
        <div className="mt-4 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
              <AlertCircle size={16} strokeWidth={1.75} />
              {error}
            </div>
          )}

          <FormField label="Título *" htmlFor="opp-title">
            <Input
              id="opp-title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Código" htmlFor="opp-code">
              <Input
                id="opp-code"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                className="w-full"
              />
            </FormField>
            <FormField label="Tipo *" htmlFor="opp-type">
              <Select
                items={VACANCY_TYPE_OPTIONS}
                value={form.type}
                onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}
                placeholder="Seleccionar…"
                className="w-full"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Cargo" htmlFor="opp-position">
              <Select
                items={positionOptions}
                value={form.positionId}
                onValueChange={(v) => setForm((f) => ({ ...f, positionId: v }))}
                placeholder="Seleccionar…"
                className="w-full"
              />
            </FormField>
            <FormField label="Nível de carreira" htmlFor="opp-level">
              <Select
                items={CAREER_LEVEL_OPTIONS}
                value={form.careerLevel}
                onValueChange={(v) => setForm((f) => ({ ...f, careerLevel: v }))}
                placeholder="Seleccionar…"
                className="w-full"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Departamento" htmlFor="opp-department">
              <Select
                items={departmentOptions}
                value={form.departmentId}
                onValueChange={(v) => setForm((f) => ({ ...f, departmentId: v }))}
                placeholder="Seleccionar…"
                className="w-full"
              />
            </FormField>
            <FormField label="Unidade" htmlFor="opp-unit">
              <Select
                items={unitOptions}
                value={form.unitId}
                onValueChange={(v) => setForm((f) => ({ ...f, unitId: v }))}
                placeholder="Seleccionar…"
                className="w-full"
              />
            </FormField>
          </div>

          <FormField label="Localização" htmlFor="opp-location">
            <Input
              id="opp-location"
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              placeholder="Remoto, híbrido, cidade…"
              className="w-full"
            />
          </FormField>

          <DepartmentUserPicker
            label="Gestor responsável"
            htmlFor="opp-manager"
            value={responsibleManager}
            onChange={setResponsibleManager}
          />

          <FormField label="Descrição" htmlFor="opp-description">
            <Textarea
              id="opp-description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              className="w-full resize-none"
            />
          </FormField>

          <FormField label="Formação exigida" htmlFor="opp-training">
            <Input
              id="opp-training"
              value={form.requiredTraining}
              onChange={(e) => setForm((f) => ({ ...f, requiredTraining: e.target.value }))}
              className="w-full"
            />
          </FormField>

          <FormField label="Prazo de candidatura" htmlFor="opp-closing">
            <Input
              id="opp-closing"
              type="date"
              value={form.closingDate}
              onChange={(e) => setForm((f) => ({ ...f, closingDate: e.target.value }))}
              className="w-full"
            />
          </FormField>
        </div>

        <div className="mt-6 flex gap-3 border-t border-border pt-4">
          <Button intent="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <div className="flex-1" />
          <Button onClick={handleSubmit} loading={create.isPending}>
            Criar Oportunidade
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
