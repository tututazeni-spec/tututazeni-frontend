// components/trainings/TrainerFormModal.tsx
// Criação/edição de Formador (docs/trainings-detalhado.md pt.7 — "Novo
// Formador"). Mesmo padrão de plans/PlanFormModal.tsx.

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
import { Combobox } from '@/components/ui/Combobox';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import type { Trainer } from './types';

export interface TrainerFormModalProps {
  trainer: Trainer | null;
  onClose: () => void;
  onSuccess: () => void;
}

const TYPE_ITEMS = [
  { value: 'INTERNAL', label: 'Interno' },
  { value: 'EXTERNAL', label: 'Externo' },
];

const STATUS_ITEMS = [
  { value: 'ACTIVE', label: 'Activo' },
  { value: 'INACTIVE', label: 'Inactivo' },
];

interface UserOption {
  id: number;
  fullName: string;
}

function n(value: string): number | undefined {
  if (value.trim() === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function listField(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function TrainerFormModal({ trainer, onClose, onSuccess }: TrainerFormModalProps) {
  const editing = !!trainer;

  const { data: usersResp } = useApiQuery<{ data: UserOption[] }>(
    ['training-trainers', 'users-picker'],
    '/users',
    { params: { limit: 200 }, staleTime: STALE_TIME.SEMI_STATIC },
  );
  const userItems = (usersResp?.data ?? []).map((u) => ({ value: String(u.id), label: u.fullName }));

  const {
    values: form,
    setField,
    errorMessage: validationError,
    handleSubmit: withValidation,
  } = useFormValidation(
    {
      type: trainer?.type ?? 'INTERNAL',
      userId: trainer?.userId?.toString() ?? '',
      name: trainer?.name ?? '',
      entity: trainer?.entity ?? '',
      nif: trainer?.nif ?? '',
      email: trainer?.email ?? '',
      phone: trainer?.phone ?? '',
      specialties: trainer?.specialties?.join(', ') ?? '',
      trainingAreas: trainer?.trainingAreas?.join(', ') ?? '',
      certifications: trainer?.certifications ?? '',
      professionalExperience: trainer?.professionalExperience ?? '',
      trainerExperience: trainer?.trainerExperience ?? '',
      availability: trainer?.availability ?? '',
      hourlyCost: trainer?.hourlyCost?.toString() ?? '',
      documentUrl: trainer?.documentUrl ?? '',
      status: trainer?.status ?? 'ACTIVE',
      notes: trainer?.notes ?? '',
    },
    { name: [required()] },
  );
  const [submitError, setSubmitError] = useState('');
  const error = validationError || submitError;

  function buildPayload(): Record<string, unknown> {
    const payload: Record<string, unknown> = {
      type: form.type,
      name: form.name.trim(),
      status: form.status || 'ACTIVE',
      specialties: listField(form.specialties),
      trainingAreas: listField(form.trainingAreas),
    };
    const str = (key: keyof typeof form) => {
      const v = (form[key] as string).trim();
      if (v) payload[key] = v;
    };
    if (form.type === 'INTERNAL' && form.userId) payload.userId = n(form.userId);
    str('entity');
    str('nif');
    str('email');
    str('phone');
    str('certifications');
    str('professionalExperience');
    str('trainerExperience');
    str('availability');
    str('documentUrl');
    str('notes');
    if (form.hourlyCost) payload.hourlyCost = n(form.hourlyCost);
    return payload;
  }

  const mutation = useApiMutation(
    () => {
      const payload = buildPayload();
      return trainer
        ? apiClient.put(`/training-trainers/${trainer.id}`, payload)
        : apiClient.post('/training-trainers', payload);
    },
    {
      invalidateKeys: [queryKeys.trainingTrainers.all],
      onSuccess: () => {
        onSuccess();
        onClose();
      },
      onError: (e) => setSubmitError(e.message || (editing ? 'Erro ao actualizar formador.' : 'Erro ao criar formador.')),
    },
  );
  const loading = mutation.isPending;
  const handleSubmit = withValidation(() => {
    setSubmitError('');
    mutation.mutate(undefined);
  });

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title={editing ? `Editar "${trainer!.name}"` : 'Novo formador'}
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="mt-4 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
              <AlertCircle size={16} strokeWidth={1.75} />
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Tipo" htmlFor="tf-type">
              <Select
                items={TYPE_ITEMS}
                value={form.type}
                onValueChange={(v) => setField('type', v as typeof form.type)}
                className="w-full"
              />
            </FormField>
            {form.type === 'INTERNAL' && (
              <FormField label="Colaborador associado" htmlFor="tf-user">
                <Combobox
                  items={userItems}
                  value={form.userId || undefined}
                  onValueChange={(v) => setField('userId', v)}
                  placeholder="Selecionar"
                  className="w-full"
                />
              </FormField>
            )}
          </div>

          <FormField label="Nome *" htmlFor="tf-name">
            <Input id="tf-name" value={form.name} onChange={(e) => setField('name', e.target.value)} className="w-full" />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Entidade" htmlFor="tf-entity">
              <Input id="tf-entity" value={form.entity} onChange={(e) => setField('entity', e.target.value)} className="w-full" />
            </FormField>
            <FormField label="NIF" htmlFor="tf-nif">
              <Input id="tf-nif" value={form.nif} onChange={(e) => setField('nif', e.target.value)} className="w-full" />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="E-mail" htmlFor="tf-email">
              <Input id="tf-email" value={form.email} onChange={(e) => setField('email', e.target.value)} className="w-full" />
            </FormField>
            <FormField label="Telefone" htmlFor="tf-phone">
              <Input id="tf-phone" value={form.phone} onChange={(e) => setField('phone', e.target.value)} className="w-full" />
            </FormField>
          </div>

          <FormField label="Especialidades (separadas por vírgula)" htmlFor="tf-specialties">
            <Input
              id="tf-specialties"
              value={form.specialties}
              onChange={(e) => setField('specialties', e.target.value)}
              className="w-full"
            />
          </FormField>

          <FormField label="Áreas de formação (separadas por vírgula)" htmlFor="tf-trainingAreas">
            <Input
              id="tf-trainingAreas"
              value={form.trainingAreas}
              onChange={(e) => setField('trainingAreas', e.target.value)}
              className="w-full"
            />
          </FormField>

          <FormField label="Certificações" htmlFor="tf-certifications">
            <Textarea
              id="tf-certifications"
              value={form.certifications}
              onChange={(e) => setField('certifications', e.target.value)}
              rows={2}
              className="w-full resize-none"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Experiência profissional" htmlFor="tf-professionalExperience">
              <Textarea
                id="tf-professionalExperience"
                value={form.professionalExperience}
                onChange={(e) => setField('professionalExperience', e.target.value)}
                rows={2}
                className="w-full resize-none"
              />
            </FormField>
            <FormField label="Experiência como formador" htmlFor="tf-trainerExperience">
              <Textarea
                id="tf-trainerExperience"
                value={form.trainerExperience}
                onChange={(e) => setField('trainerExperience', e.target.value)}
                rows={2}
                className="w-full resize-none"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Disponibilidade" htmlFor="tf-availability">
              <Input
                id="tf-availability"
                value={form.availability}
                onChange={(e) => setField('availability', e.target.value)}
                className="w-full"
                placeholder="Ex: Seg-Sex, 09h-18h"
              />
            </FormField>
            <FormField label="Custo/hora (Kz)" htmlFor="tf-hourlyCost">
              <Input
                id="tf-hourlyCost"
                type="number"
                min={0}
                value={form.hourlyCost}
                onChange={(e) => setField('hourlyCost', e.target.value)}
                className="w-full"
              />
            </FormField>
          </div>

          <FormField label="URL de documentação" htmlFor="tf-documentUrl">
            <Input
              id="tf-documentUrl"
              value={form.documentUrl}
              onChange={(e) => setField('documentUrl', e.target.value)}
              className="w-full"
              placeholder="https://…"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Estado" htmlFor="tf-status">
              <Select
                items={STATUS_ITEMS}
                value={form.status}
                onValueChange={(v) => setField('status', v as typeof form.status)}
                className="w-full"
              />
            </FormField>
          </div>

          <FormField label="Observações" htmlFor="tf-notes">
            <Textarea
              id="tf-notes"
              value={form.notes}
              onChange={(e) => setField('notes', e.target.value)}
              rows={2}
              className="w-full resize-none"
            />
          </FormField>
        </div>

        <div className="mt-6 flex gap-3 border-t border-border pt-4">
          <Button intent="secondary" className="flex-1 justify-center" onClick={onClose}>
            Cancelar
          </Button>
          <Button className="flex-1 justify-center" onClick={handleSubmit} loading={loading}>
            {loading ? 'A guardar...' : editing ? 'Guardar alterações' : 'Criar formador'}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
