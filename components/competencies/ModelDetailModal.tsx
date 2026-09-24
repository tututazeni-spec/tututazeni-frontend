// components/competencies/ModelDetailModal.tsx
// Detalhe de um modelo de competências — mostra os campos do modelo e
// gere as competências incluídas (docs/módulo_competencies.md §4, Fase
// 2). Leitura aberta a qualquer utilizador autenticado (GET
// /competencies/models/:id não tem @Roles); gestão de itens e
// eliminação só ADMIN/RH, espelhando @Roles(ADMIN, RH) no backend.

'use client';

import { useState } from 'react';
import { AlertCircle, Trash2 } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CATEGORY_CFG, HIERARCHY_LEVEL_CFG, STATUS_CFG } from './constants';
import { useCompetencyOptions } from './modelFormData';
import type { CompetencyModelDetail } from './types';

export interface ModelDetailModalProps {
  modelId: number;
  canManage: boolean;
  onEdit: () => void;
  onClose: () => void;
}

export function ModelDetailModal({ modelId, canManage, onEdit, onClose }: ModelDetailModalProps) {
  const confirm = useConfirm();
  const toast = useToast();

  const { data, isLoading, error } = useApiQuery<CompetencyModelDetail>(
    queryKeys.competencies.modelDetail(modelId),
    `/competencies/models/${modelId}`,
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const invalidateKeys = [
    queryKeys.competencies.all,
    queryKeys.competencies.modelDetail(modelId),
  ];
  const toastError = (e: Error) => toast({ title: e.message, intent: 'danger' });

  const removeModel = useApiMutation(() => apiClient.delete(`/competencies/models/${modelId}`), {
    invalidateKeys,
    onSuccess: () => {
      toast({ title: 'Modelo eliminado.', intent: 'success' });
      onClose();
    },
    onError: toastError,
  });

  const removeItem = useApiMutation(
    (competencyId: number) =>
      apiClient.delete(`/competencies/models/${modelId}/items/${competencyId}`),
    {
      invalidateKeys,
      onSuccess: () => toast({ title: 'Competência removida do modelo.', intent: 'success' }),
      onError: toastError,
    },
  );

  async function onDeleteModel() {
    const ok = await confirm({
      title: `Eliminar "${data?.name}"?`,
      message: 'Esta acção é irreversível. Remova primeiro as competências associadas.',
      confirmLabel: 'Eliminar',
      destructive: true,
    });
    if (ok) removeModel.mutate(undefined);
  }

  async function onRemoveItem(competencyId: number, name: string) {
    const ok = await confirm({
      title: `Remover "${name}" do modelo?`,
      confirmLabel: 'Remover',
      destructive: true,
    });
    if (ok) removeItem.mutate(competencyId);
  }

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title={data?.name ?? 'Modelo de competências'}
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        {isLoading ? (
          <div className="mt-5">
            <Skeleton rows={5} />
          </div>
        ) : error || !data ? (
          <div className="mt-5 flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
            <AlertCircle size={16} strokeWidth={1.75} />
            Não foi possível carregar o modelo.
          </div>
        ) : (
          <>
            <div className="mt-4 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge value={data.status} map={STATUS_CFG} />
                {data.hierarchyLevel && (
                  <StatusBadge value={data.hierarchyLevel} map={HIERARCHY_LEVEL_CFG} />
                )}
                <span className="rounded bg-surface-sunken px-1.5 py-0.5 font-body text-xs text-ink-muted">
                  v{data.version}
                </span>
              </div>

              <div className="flex flex-wrap gap-4 font-body text-xs text-ink-faint">
                {data.code && <span>Código: {data.code}</span>}
                {data.type && <span>Tipo: {data.type}</span>}
                {data.department && <span>Departamento: {data.department.name}</span>}
                {data.positionFamily && <span>Família: {data.positionFamily}</span>}
              </div>

              {data.description && (
                <p className="font-body text-sm text-ink-muted">{data.description}</p>
              )}

              {data.objective && (
                <p className="font-body text-sm text-ink-muted">
                  <span className="font-semibold text-ink">Objetivo: </span>
                  {data.objective}
                </p>
              )}

              {(data.effectiveDate || data.endDate) && (
                <p className="font-body text-xs text-ink-faint">
                  Vigência: {data.effectiveDate?.slice(0, 10) ?? '—'} a{' '}
                  {data.endDate?.slice(0, 10) ?? '—'}
                </p>
              )}

              {data.owner && (
                <p className="font-body text-xs text-ink-faint">
                  Responsável: {data.owner.fullName}
                </p>
              )}

              <div>
                <h3 className="mb-2 font-body text-xs font-semibold uppercase tracking-wide text-ink-faint">
                  Competências incluídas ({data.items.length})
                </h3>
                {data.items.length === 0 ? (
                  <p className="font-body text-sm text-ink-faint">
                    Nenhuma competência associada a este modelo.
                  </p>
                ) : (
                  <div className="overflow-hidden rounded-card border border-border">
                    {data.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 border-b border-border px-3 py-2 last:border-0"
                      >
                        <div className="flex-1">
                          <div className="font-body text-sm font-medium text-ink">
                            {item.competency.name}
                          </div>
                          <StatusBadge value={item.competency.category} map={CATEGORY_CFG} />
                        </div>
                        <span className="font-data text-xs text-ink-muted">
                          nível {item.expectedLevel} · peso {item.weight}
                        </span>
                        {item.isMandatory && (
                          <span className="rounded bg-warning-subtle px-1.5 py-0.5 font-body text-xs text-warning-ink">
                            Obrigatória
                          </span>
                        )}
                        {item.isCritical && (
                          <span className="rounded bg-danger-subtle px-1.5 py-0.5 font-body text-xs text-danger-ink">
                            Crítica
                          </span>
                        )}
                        {canManage && (
                          <button
                            type="button"
                            aria-label="Remover competência do modelo"
                            onClick={() => onRemoveItem(item.competencyId, item.competency.name)}
                            className="rounded p-1.5 text-ink-faint hover:bg-danger-subtle hover:text-danger-ink"
                          >
                            <Trash2 size={14} strokeWidth={1.75} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {canManage && (
                  <AddItemForm modelId={modelId} existingIds={data.items.map((i) => i.competencyId)} />
                )}
              </div>
            </div>

            {canManage && (
              <div className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-4">
                <Button
                  intent="danger"
                  onClick={onDeleteModel}
                  loading={removeModel.isPending}
                  disabled={data.items.length > 0}
                >
                  Eliminar
                </Button>
                <Button intent="ghost" onClick={onEdit}>
                  Editar
                </Button>
              </div>
            )}
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

function AddItemForm({ modelId, existingIds }: { modelId: number; existingIds: number[] }) {
  const toast = useToast();
  const { options: allOptions, loading } = useCompetencyOptions();
  const options = allOptions.filter((o) => !existingIds.includes(parseInt(o.value, 10)));

  const [competencyId, setCompetencyId] = useState('');
  const [expectedLevel, setExpectedLevel] = useState('3');
  const [weight, setWeight] = useState('1');
  const [isMandatory, setIsMandatory] = useState(false);
  const [isCritical, setIsCritical] = useState(false);

  const invalidateKeys = [
    queryKeys.competencies.all,
    queryKeys.competencies.modelDetail(modelId),
  ];

  const add = useApiMutation(
    (body: Record<string, unknown>) =>
      apiClient.post(`/competencies/models/${modelId}/items`, body),
    {
      invalidateKeys,
      onSuccess: () => {
        toast({ title: 'Competência adicionada ao modelo.', intent: 'success' });
        setCompetencyId('');
        setExpectedLevel('3');
        setWeight('1');
        setIsMandatory(false);
        setIsCritical(false);
      },
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  const canAdd = competencyId.length > 0 && expectedLevel.length > 0;

  return (
    <div className="mt-3 rounded-card border border-dashed border-border p-3">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Competência" htmlFor="mi-competency">
          <Select
            items={options}
            value={competencyId || undefined}
            onValueChange={setCompetencyId}
            placeholder={loading ? 'A carregar…' : 'Selecionar'}
            disabled={loading}
            className="w-full"
          />
        </FormField>
        <FormField label="Nível esperado (1-5)" htmlFor="mi-level">
          <Input
            id="mi-level"
            type="number"
            min={1}
            max={5}
            value={expectedLevel}
            onChange={(e) => setExpectedLevel(e.target.value)}
            className="w-full"
          />
        </FormField>
      </div>
      <div className="mt-3 flex items-center gap-4">
        <FormField label="Peso" htmlFor="mi-weight">
          <Input
            id="mi-weight"
            type="number"
            min={0}
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-24"
          />
        </FormField>
        <label className="mt-6 flex items-center gap-2 text-sm text-ink-muted">
          <input
            type="checkbox"
            checked={isMandatory}
            onChange={(e) => setIsMandatory(e.target.checked)}
            className="h-4 w-4 rounded border-border-strong accent-primary"
          />
          Obrigatória
        </label>
        <label className="mt-6 flex items-center gap-2 text-sm text-ink-muted">
          <input
            type="checkbox"
            checked={isCritical}
            onChange={(e) => setIsCritical(e.target.checked)}
            className="h-4 w-4 rounded border-border-strong accent-primary"
          />
          Crítica
        </label>
        <Button
          size="sm"
          className="ml-auto mt-6"
          disabled={!canAdd}
          loading={add.isPending}
          onClick={() =>
            add.mutate({
              competencyId: parseInt(competencyId, 10),
              expectedLevel: parseInt(expectedLevel, 10),
              weight: weight ? parseFloat(weight) : 1,
              isMandatory,
              isCritical,
            })
          }
        >
          Adicionar
        </Button>
      </div>
    </div>
  );
}
