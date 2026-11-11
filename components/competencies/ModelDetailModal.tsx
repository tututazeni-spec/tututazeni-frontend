// components/competencies/ModelDetailModal.tsx
// Detalhe de um modelo de competências — mostra os campos do modelo e
// gere as competências incluídas (docs/módulo_competencies.md §4, Fase
// 2). Leitura aberta a qualquer utilizador autenticado (GET
// /competencies/models/:id não tem @Roles); gestão de itens e
// eliminação só ADMIN/RH, espelhando @Roles(ADMIN, RH) no backend.

'use client';

import { useState } from 'react';
import type { CSSProperties } from 'react';
import {
  AlertCircle,
  Activity,
  Briefcase,
  Building2,
  CalendarRange,
  FileText,
  Hash,
  Layers,
  GitBranch,
  Shapes,
  TrendingUp,
  Target,
  Trash2,
  UserCog,
} from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { Button, IconButton } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import {
  DetailDivider,
  DetailHeader,
  DetailInfoRow,
  DetailSectionRow,
} from '@/components/ui/DetailCardParts';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CATEGORY_CFG, HIERARCHY_LEVEL_CFG, STATUS_CFG } from './constants';
import { useCompetencyOptions } from './modelFormData';
import type { CompetencyModelDetail } from './types';
import { Checkbox } from '@/components/ui/Checkbox';
import { EmptyState } from '@/components/ui/EmptyState';

// Botões do card: letra branca, sem efeito ao passar o cursor.
const NAVY_BTN =
  'border border-[#0F1F3D] bg-[#0F1F3D] text-white hover:bg-[#0F1F3D] hover:text-white';
const RED_BTN =
  'border border-[#DC2626] bg-[#DC2626] text-white hover:bg-[#DC2626] hover:text-white disabled:opacity-100';

export interface ModelDetailModalProps {
  modelId: number;
  canManage: boolean;
  onEdit: () => void;
  onClose: () => void;
}

export function ModelDetailModal({
  modelId,
  canManage,
  onEdit,
  onClose,
}: ModelDetailModalProps) {
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
  const toastError = (e: Error) =>
    toast({ title: e.message, intent: 'danger' });

  const removeModel = useApiMutation(
    () => apiClient.delete(`/competencies/models/${modelId}`),
    {
      invalidateKeys,
      onSuccess: () => {
        toast({ title: 'Modelo eliminado.', intent: 'success' });
        onClose();
      },
      onError: toastError,
    },
  );

  const removeItem = useApiMutation(
    (competencyId: number) =>
      apiClient.delete(`/competencies/models/${modelId}/items/${competencyId}`),
    {
      invalidateKeys,
      onSuccess: () =>
        toast({ title: 'Competência removida do modelo.', intent: 'success' }),
      onError: toastError,
    },
  );

  async function onDeleteModel() {
    const ok = await confirm({
      title: `Eliminar "${data?.name}"?`,
      message:
        'Esta acção é irreversível. Remova primeiro as competências associadas.',
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
        hideHeading
        navyClose
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        style={
          {
            '--detail-label': '#0F1F3D',
            '--color-brand-ink': '#0F1F3D',
            '--color-brand': '#0F1F3D',
            '--color-brand-hover': '#0F1F3D',
            '--color-brand-active': '#0F1F3D',
          } as CSSProperties
        }
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
            <DetailHeader name={data.name} icon={Layers} />

            <div className="mt-6 grid gap-6 md:grid-cols-[1fr_auto_1fr]">
              <div className="space-y-4">
                <DetailInfoRow icon={Hash} label="Código">
                  {data.code || '—'}
                </DetailInfoRow>
                <DetailInfoRow icon={Shapes} label="Tipo">
                  {data.type || '—'}
                </DetailInfoRow>
                <DetailInfoRow icon={Building2} label="Departamento">
                  {data.department?.name ?? '—'}
                </DetailInfoRow>
                <DetailInfoRow icon={TrendingUp} label="Nível hierárquico">
                  {data.hierarchyLevel ? (
                    <StatusBadge
                      value={data.hierarchyLevel}
                      map={HIERARCHY_LEVEL_CFG}
                    />
                  ) : (
                    '—'
                  )}
                </DetailInfoRow>
                <DetailInfoRow
                  icon={Briefcase}
                  label="Cargo / família profissional"
                >
                  {data.positionFamily || '—'}
                </DetailInfoRow>
                <DetailInfoRow icon={UserCog} label="Responsável pelo modelo">
                  {data.owner?.fullName ?? '—'}
                </DetailInfoRow>
              </div>

              <DetailDivider />

              <div className="space-y-4">
                <DetailSectionRow icon={FileText} label="Descrição">
                  <span className="whitespace-pre-wrap">
                    {data.description || '—'}
                  </span>
                </DetailSectionRow>
                <DetailSectionRow icon={Target} label="Objetivo">
                  <span className="whitespace-pre-wrap">
                    {data.objective || '—'}
                  </span>
                </DetailSectionRow>
                <DetailInfoRow icon={GitBranch} label="Versão">
                  v{data.version}
                </DetailInfoRow>
                <DetailInfoRow icon={CalendarRange} label="Vigência">
                  {data.effectiveDate || data.endDate
                    ? `${data.effectiveDate?.slice(0, 10) ?? '—'} a ${data.endDate?.slice(0, 10) ?? '—'}`
                    : '—'}
                </DetailInfoRow>
                <DetailInfoRow icon={Activity} label="Estado">
                  <StatusBadge value={data.status} map={STATUS_CFG} />
                </DetailInfoRow>
              </div>
            </div>

            <div className="mt-6 space-y-4 border-t border-border pt-4">
              <div>
                <h3 className="mb-2 font-body text-xs font-semibold uppercase tracking-wide text-ink-faint">
                  Competências incluídas ({data.items.length})
                </h3>
                {data.items.length === 0 ? (
                  <EmptyState
                    variant="inline"
                    title="Nenhuma competência associada a este modelo"
                  />
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
                          <StatusBadge
                            value={item.competency.category}
                            map={CATEGORY_CFG}
                          />
                        </div>
                        <span className="font-body text-xs text-ink-muted">
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
                          <IconButton
                            icon={Trash2}
                            label="Remover competência do modelo"
                            intent="ghostDanger"
                            size="xs"
                            type="button"
                            onClick={() =>
                              onRemoveItem(
                                item.competencyId,
                                item.competency.name,
                              )
                            }
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {canManage && (
                  <AddItemForm
                    modelId={modelId}
                    existingIds={data.items.map((i) => i.competencyId)}
                  />
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <div>
                {canManage && (
                  <Button
                    intent="secondary"
                    className={RED_BTN}
                    onClick={onDeleteModel}
                    loading={removeModel.isPending}
                    disabled={data.items.length > 0}
                  >
                    Apagar
                  </Button>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  intent="secondary"
                  className={NAVY_BTN}
                  onClick={onClose}
                >
                  Fechar
                </Button>
                {canManage && (
                  <Button className={NAVY_BTN} onClick={onEdit}>
                    Editar
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

function AddItemForm({
  modelId,
  existingIds,
}: {
  modelId: number;
  existingIds: number[];
}) {
  const toast = useToast();
  const { options: allOptions, loading } = useCompetencyOptions();
  const options = allOptions.filter(
    (o) => !existingIds.includes(parseInt(o.value, 10)),
  );

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
        toast({
          title: 'Competência adicionada ao modelo.',
          intent: 'success',
        });
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
    <div className="mt-3 rounded-card border border-dashed border-border p-4">
      <div className="mb-3 font-body text-xs font-semibold uppercase tracking-wide text-ink-faint">
        Adicionar competência
      </div>
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
      <div className="mt-3 flex flex-wrap items-center gap-4">
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
          <Checkbox
            checked={isMandatory}
            onChange={(e) => setIsMandatory(e.target.checked)}
          />
          Obrigatória
        </label>
        <label className="mt-6 flex items-center gap-2 text-sm text-ink-muted">
          <Checkbox
            checked={isCritical}
            onChange={(e) => setIsCritical(e.target.checked)}
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
