// components/competencies/CompetencyFormModal.tsx
// Modal único de criação e edição de competências, aberto a partir do
// cabeçalho ("+ Nova competência") e do CompetencyDetailModal ("Editar").
// Só ADMIN/RH — o mesmo RBAC de @Roles(ADMIN, RH) em competencies.controller.ts
// (POST /competencies e PUT /competencies/:id). Segue o padrão de
// components/courses/EditCourseModal: em modo edição faz GET /competencies/:id
// ao abrir e o formulário só monta depois de os dados chegarem, para os
// campos arrancarem já com os valores reais.
//
// DTO CreateCompetencyDto: name (obrigatório, máx 120) e category (enum
// CompetencyCategory, obrigatório); description, tags[] e status opcionais.
// PUT aceita PartialType do mesmo DTO. O backend responde 409 se o nome
// colidir (case-insensitive) — mostramos a mensagem tal como vem.

'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { CATEGORY_CFG } from './constants';
import type { CompetencyDetail } from './types';

export interface CompetencyFormModalProps {
  /** Ausente/null → criar; número → editar essa competência. */
  competencyId?: number | null;
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORY_ITEMS = Object.entries(CATEGORY_CFG).map(([value, cfg]) => ({
  value,
  label: cfg.label,
}));

const STATUS_ITEMS = [
  { value: 'ACTIVE', label: 'Activa' },
  { value: 'INACTIVE', label: 'Arquivada' },
];

export function CompetencyFormModal({
  competencyId,
  onClose,
  onSuccess,
}: CompetencyFormModalProps) {
  const editing = competencyId != null;

  const detail = useApiQuery<CompetencyDetail>(
    queryKeys.competencies.detail(competencyId ?? 0),
    `/competencies/${competencyId}`,
    { enabled: editing, staleTime: STALE_TIME.DYNAMIC },
  );

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title={editing ? 'Editar competência' : 'Nova competência'}
        description={
          editing
            ? 'Actualiza os dados da competência. As alterações aplicam-se de imediato.'
            : 'Cria uma competência no catálogo da organização.'
        }
        className="max-w-lg max-h-[90vh] overflow-y-auto"
      >
        {editing && (detail.isLoading || !detail.data) && !detail.error ? (
          <p className="mt-5 font-body text-sm text-ink-muted">A carregar…</p>
        ) : editing && detail.error ? (
          <div className="mt-5 flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
            <AlertCircle size={16} strokeWidth={1.75} />
            Não foi possível carregar a competência.
          </div>
        ) : (
          <CompetencyForm
            competencyId={competencyId ?? null}
            initial={detail.data ?? null}
            onClose={onClose}
            onSuccess={onSuccess}
          />
        )}
      </ModalContent>
    </Modal>
  );
}

interface CompetencyFormProps {
  competencyId: number | null;
  initial: CompetencyDetail | null;
  onClose: () => void;
  onSuccess: () => void;
}

function CompetencyForm({
  competencyId,
  initial,
  onClose,
  onSuccess,
}: CompetencyFormProps) {
  const editing = competencyId != null;

  const [name, setName] = useState(initial?.name ?? '');
  const [category, setCategory] = useState<string>(initial?.category ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [tagsRaw, setTagsRaw] = useState((initial?.tags ?? []).join(', '));
  const [status, setStatus] = useState<string>(initial?.status ?? 'ACTIVE');
  const [submitError, setSubmitError] = useState('');

  const canSubmit = name.trim().length > 0 && category.length > 0;

  const save = useApiMutation(
    (body: Record<string, unknown>) =>
      editing
        ? apiClient.put(`/competencies/${competencyId}`, body)
        : apiClient.post('/competencies', body),
    {
      invalidateKeys: [queryKeys.competencies.all],
      onSuccess: () => {
        onSuccess();
        onClose();
      },
      onError: (e) =>
        setSubmitError(
          e.message || 'Erro ao guardar a competência. Tente novamente.',
        ),
    },
  );
  const loading = save.isPending;

  const handleSubmit = () => {
    if (!canSubmit || loading) return;
    setSubmitError('');
    const tags = tagsRaw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const body: Record<string, unknown> = {
      name: name.trim(),
      category,
      description: description.trim() || null,
      tags,
    };
    // status só é editável para competências já existentes (criar → ACTIVE
    // por defeito no backend).
    if (editing) body.status = status;
    save.mutate(body);
  };

  return (
    <>
      <div className="mt-5 space-y-4">
        {submitError && (
          <div className="flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
            <AlertCircle size={16} strokeWidth={1.75} />
            {submitError}
          </div>
        )}

        <FormField label="Nome *" htmlFor="cf-name">
          <Input
            id="cf-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Comunicação Eficaz"
            maxLength={120}
            className="w-full"
          />
        </FormField>

        <FormField label="Categoria *" htmlFor="cf-category">
          <Select
            items={CATEGORY_ITEMS}
            value={category || undefined}
            onValueChange={setCategory}
            placeholder="Selecionar categoria"
            className="w-full"
          />
        </FormField>

        <FormField label="Descrição" htmlFor="cf-description">
          <Textarea
            id="cf-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Opcional — o que esta competência representa."
            className="w-full"
          />
        </FormField>

        <FormField label="Tags" htmlFor="cf-tags" hint="Separadas por vírgula.">
          <Input
            id="cf-tags"
            value={tagsRaw}
            onChange={(e) => setTagsRaw(e.target.value)}
            placeholder="liderança, feedback, comunicação"
            className="w-full"
          />
        </FormField>

        {editing && (
          <FormField label="Estado" htmlFor="cf-status">
            <Select
              items={STATUS_ITEMS}
              value={status}
              onValueChange={setStatus}
              className="w-full"
            />
          </FormField>
        )}
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button intent="ghost" onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={!canSubmit} loading={loading}>
          {editing ? 'Guardar' : 'Criar'}
        </Button>
      </div>
    </>
  );
}
