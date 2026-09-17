// components/career/NewCareerPathModal.tsx
// Modal "Novo Percurso de Carreira" (RH/Admin) — Módulo Career, secção 3.
// Cria a trilha (POST /career/paths) e depois cada passo (POST
// /career/paths/:id/steps), um por cargo associado.

'use client';

import { useState } from 'react';
import { AlertCircle, Plus, Trash2 } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { reportError } from '@/lib/errorReporting';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { useFormValidation } from '@/hooks/useFormValidation';
import { required } from '@/lib/validation';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { CAREER_PATH_TYPE } from './constants';
import { useDepartmentOptions, useJobFamilyOptions, usePositionOptions } from './careerFormData';

const CAREER_PATH_TYPE_OPTIONS = Object.entries(CAREER_PATH_TYPE).map(([value, label]) => ({
  value,
  label,
}));

interface StepDraft {
  positionId: string;
  isLateralMove: boolean;
  minMonthsRequired: string;
  minExperienceMonths: string;
  certifications: string;
}

function emptyStep(): StepDraft {
  return { positionId: '', isLateralMove: false, minMonthsRequired: '', minExperienceMonths: '', certifications: '' };
}

export interface NewCareerPathModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function NewCareerPathModal({ onClose, onSuccess }: NewCareerPathModalProps) {
  const qc = useQueryClient();
  const { options: departmentOptions } = useDepartmentOptions();
  const { options: jobFamilyOptions } = useJobFamilyOptions();
  const { options: positionOptions } = usePositionOptions();
  const [steps, setSteps] = useState<StepDraft[]>([emptyStep()]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const {
    values: form,
    setValues: setForm,
    errorMessage: validationError,
    handleSubmit: withValidation,
  } = useFormValidation(
    { name: '', code: '', type: '', description: '', departmentId: '', jobFamilyId: '' },
    { name: [required()], type: [required()] },
  );
  const error = validationError || submitError;

  const updateStep = (idx: number, patch: Partial<StepDraft>) => {
    setSteps((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };

  const handleSubmit = withValidation(async () => {
    setSubmitError('');
    setSubmitting(true);
    try {
      const path = await apiClient.post<{ id: number }>('/career/paths', {
        name: form.name,
        code: form.code || undefined,
        type: form.type,
        description: form.description || undefined,
        departmentId: form.departmentId ? Number(form.departmentId) : undefined,
        jobFamilyId: form.jobFamilyId ? Number(form.jobFamilyId) : undefined,
      });

      const validSteps = steps.filter((s) => s.positionId);
      for (let i = 0; i < validSteps.length; i++) {
        const s = validSteps[i];
        await apiClient.post(`/career/paths/${path.id}/steps`, {
          positionId: Number(s.positionId),
          order: i + 1,
          isLateralMove: s.isLateralMove,
          minMonthsRequired: s.minMonthsRequired ? Number(s.minMonthsRequired) : undefined,
          minExperienceMonths: s.minExperienceMonths ? Number(s.minExperienceMonths) : undefined,
          certifications: s.certifications
            ? s.certifications.split(',').map((c) => c.trim()).filter(Boolean)
            : undefined,
        });
      }

      await qc.invalidateQueries({ queryKey: queryKeys.career.paths() });
      onSuccess();
      onClose();
    } catch (e) {
      reportError(e, { source: 'NewCareerPathModal.handleSubmit' });
      setSubmitError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent title="Novo Percurso de Carreira" className="max-h-[90vh] max-w-xl overflow-y-auto">
        <div className="mt-4 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
              <AlertCircle size={16} strokeWidth={1.75} />
              {error}
            </div>
          )}

          <FormField label="Nome *" htmlFor="path-name">
            <Input
              id="path-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Código" htmlFor="path-code">
              <Input
                id="path-code"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                className="w-full"
              />
            </FormField>
            <FormField label="Tipo *" htmlFor="path-type">
              <Select
                items={CAREER_PATH_TYPE_OPTIONS}
                value={form.type}
                onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}
                placeholder="Seleccionar…"
                className="w-full"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Departamento" htmlFor="path-department">
              <Select
                items={departmentOptions}
                value={form.departmentId}
                onValueChange={(v) => setForm((f) => ({ ...f, departmentId: v }))}
                placeholder="Seleccionar…"
                className="w-full"
              />
            </FormField>
            <FormField label="Família profissional" htmlFor="path-family">
              <Select
                items={jobFamilyOptions}
                value={form.jobFamilyId}
                onValueChange={(v) => setForm((f) => ({ ...f, jobFamilyId: v }))}
                placeholder="Seleccionar…"
                className="w-full"
              />
            </FormField>
          </div>

          <FormField label="Descrição" htmlFor="path-description">
            <Textarea
              id="path-description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              className="w-full resize-none"
            />
          </FormField>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="font-body text-sm font-semibold text-ink">
                Cargos associados (níveis)
              </span>
              <Button
                intent="secondary"
                size="sm"
                onClick={() => setSteps((prev) => [...prev, emptyStep()])}
              >
                <Plus size={14} strokeWidth={1.75} /> Adicionar nível
              </Button>
            </div>
            <div className="space-y-3">
              {steps.map((s, idx) => (
                <div key={idx} className="rounded-card border border-border p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary font-body text-xs font-bold text-canvas">
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <Select
                        items={positionOptions}
                        value={s.positionId}
                        onValueChange={(v) => updateStep(idx, { positionId: v })}
                        placeholder="Cargo…"
                        className="w-full"
                      />
                    </div>
                    {steps.length > 1 && (
                      <button
                        type="button"
                        aria-label="Remover nível"
                        onClick={() => setSteps((prev) => prev.filter((_, i) => i !== idx))}
                        className="rounded-control p-1.5 text-ink-muted hover:bg-danger-subtle hover:text-danger-ink"
                      >
                        <Trash2 size={14} strokeWidth={1.75} />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      value={s.minMonthsRequired}
                      onChange={(e) => updateStep(idx, { minMonthsRequired: e.target.value })}
                      placeholder="Meses mínimos"
                      type="number"
                      className="w-full text-xs"
                    />
                    <Input
                      value={s.minExperienceMonths}
                      onChange={(e) => updateStep(idx, { minExperienceMonths: e.target.value })}
                      placeholder="Experiência (meses)"
                      type="number"
                      className="w-full text-xs"
                    />
                    <Input
                      value={s.certifications}
                      onChange={(e) => updateStep(idx, { certifications: e.target.value })}
                      placeholder="Certificações (vírgulas)"
                      className="w-full text-xs"
                    />
                  </div>
                  <label className="mt-2 flex items-center gap-2 text-xs text-ink-muted">
                    <input
                      type="checkbox"
                      checked={s.isLateralMove}
                      onChange={(e) => updateStep(idx, { isLateralMove: e.target.checked })}
                      className="h-3.5 w-3.5 rounded border-border-strong accent-primary"
                    />
                    Movimento lateral (não vertical)
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3 border-t border-border pt-4">
          <Button intent="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <div className="flex-1" />
          <Button onClick={handleSubmit} loading={submitting}>
            Criar Percurso
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
