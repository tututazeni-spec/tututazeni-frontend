// components/career/NewCareerPlanModal.tsx
// Modal "Novo Plano de Carreira" (RH/Gestor/Admin) — Módulo Career,
// secção 4. Posts para POST /career-plans (motor mais rico, com
// auto-geração de metas a partir do gap de skills) em vez do
// self-service POST /career/me/plan.

'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery';
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
import { DepartmentUserPicker } from '@/components/departments/DepartmentUserPicker';
import type { DirectoryUser } from '@/components/users/types';
import type { Role as CareerPlansRole } from './plans/types';
import type { CareerPath } from './types';

export interface NewCareerPlanModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function NewCareerPlanModal({ onClose, onSuccess }: NewCareerPlanModalProps) {
  const { data: roles = [] } = useApiQuery<CareerPlansRole[]>(
    queryKeys.careerPlans.roles(),
    '/career-plans/roles',
    { staleTime: STALE_TIME.STATIC },
  );
  const { data: paths = [] } = useApiQuery<CareerPath[]>(queryKeys.career.paths(), '/career/paths', {
    staleTime: STALE_TIME.SEMI_STATIC,
  });
  const roleOptions = roles.map((r) => ({ value: String(r.id), label: `${r.name} · nível ${r.level}` }));
  const pathOptions = paths.map((p) => ({ value: String(p.id), label: p.name }));

  const [colaborador, setColaborador] = useState<DirectoryUser | null>(null);
  const [mentor, setMentor] = useState<DirectoryUser | null>(null);
  const [openToMobility, setOpenToMobility] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const {
    values: form,
    setValues: setForm,
    errorMessage: validationError,
    handleSubmit: withValidation,
  } = useFormValidation(
    {
      title: '',
      description: '',
      careerPathId: '',
      currentRoleId: '',
      targetRoleId: '',
      targetDate: '',
      mentoringNotes: '',
      coachingNotes: '',
    },
    { title: [required()] },
  );

  const create = useApiMutation(
    () =>
      apiClient.post('/career-plans', {
        userId: colaborador?.id,
        title: form.title,
        description: form.description || undefined,
        careerPathId: form.careerPathId ? Number(form.careerPathId) : undefined,
        currentRoleId: form.currentRoleId ? Number(form.currentRoleId) : undefined,
        targetRoleId: form.targetRoleId ? Number(form.targetRoleId) : undefined,
        targetDate: form.targetDate || undefined,
        mentorId: mentor?.id,
        mentoringNotes: form.mentoringNotes || undefined,
        coachingNotes: form.coachingNotes || undefined,
        openToMobility,
      }),
    {
      invalidateKeys: [queryKeys.careerPlans.all],
      onSuccess: () => {
        onSuccess();
        onClose();
      },
      onError: (e) => setSubmitError(e.message),
    },
  );

  const handleSubmit = withValidation(() => {
    if (!colaborador) {
      setSubmitError('Selecciona o colaborador para quem o plano é criado');
      return;
    }
    setSubmitError('');
    create.mutate(undefined);
  });
  const error = validationError || submitError;

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent title="Novo Plano de Carreira" className="max-h-[90vh] max-w-lg overflow-y-auto">
        <div className="mt-4 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
              <AlertCircle size={16} strokeWidth={1.75} />
              {error}
            </div>
          )}

          <DepartmentUserPicker
            label="Colaborador *"
            htmlFor="plan-colaborador"
            value={colaborador}
            onChange={setColaborador}
          />

          <FormField label="Objetivo de carreira *" htmlFor="plan-title">
            <Input
              id="plan-title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Ex.: Tornar-se Tech Lead até 2027"
              className="w-full"
            />
          </FormField>

          <FormField label="Percurso de carreira" htmlFor="plan-path">
            <Select
              items={pathOptions}
              value={form.careerPathId}
              onValueChange={(v) => setForm((f) => ({ ...f, careerPathId: v }))}
              placeholder="Seleccionar…"
              className="w-full"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Cargo atual" htmlFor="plan-current-role">
              <Select
                items={roleOptions}
                value={form.currentRoleId}
                onValueChange={(v) => setForm((f) => ({ ...f, currentRoleId: v }))}
                placeholder="Seleccionar…"
                className="w-full"
              />
            </FormField>
            <FormField label="Cargo pretendido" htmlFor="plan-target-role">
              <Select
                items={roleOptions}
                value={form.targetRoleId}
                onValueChange={(v) => setForm((f) => ({ ...f, targetRoleId: v }))}
                placeholder="Seleccionar…"
                className="w-full"
              />
            </FormField>
          </div>

          <FormField label="Prazo" htmlFor="plan-date">
            <Input
              id="plan-date"
              type="date"
              value={form.targetDate}
              onChange={(e) => setForm((f) => ({ ...f, targetDate: e.target.value }))}
              className="w-full"
            />
          </FormField>

          <DepartmentUserPicker label="Responsável (mentor)" htmlFor="plan-mentor" value={mentor} onChange={setMentor} />

          <FormField label="Mentoring" htmlFor="plan-mentoring">
            <Textarea
              id="plan-mentoring"
              value={form.mentoringNotes}
              onChange={(e) => setForm((f) => ({ ...f, mentoringNotes: e.target.value }))}
              rows={2}
              className="w-full resize-none"
            />
          </FormField>

          <FormField label="Coaching" htmlFor="plan-coaching">
            <Textarea
              id="plan-coaching"
              value={form.coachingNotes}
              onChange={(e) => setForm((f) => ({ ...f, coachingNotes: e.target.value }))}
              rows={2}
              className="w-full resize-none"
            />
          </FormField>

          <label className="flex items-center gap-2 text-sm text-ink-muted">
            <input
              type="checkbox"
              checked={openToMobility}
              onChange={(e) => setOpenToMobility(e.target.checked)}
              className="h-4 w-4 rounded border-border-strong accent-primary"
            />
            Aberto a mobilidade interna
          </label>

          <FormField label="Observações" htmlFor="plan-description">
            <Textarea
              id="plan-description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              className="w-full resize-none"
            />
          </FormField>
        </div>

        <div className="mt-6 flex gap-3 border-t border-border pt-4">
          <Button intent="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <div className="flex-1" />
          <Button onClick={handleSubmit} loading={create.isPending}>
            Criar Plano
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
