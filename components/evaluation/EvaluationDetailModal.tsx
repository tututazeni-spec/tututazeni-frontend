// components/evaluation/EvaluationDetailModal.tsx
// "Ver"/"Editar" de uma linha da aba "Avaliações" — detalhe (pedidos
// irmãos SELF/MANAGER/PEER do mesmo colaborador+ciclo, resultado já
// submetido) + edição dos campos próprios da avaliação (nome, tipo,
// prazo, objectivos — docs/modulo_evaluation.md ponto 2, etapa 6).

'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Plus, Trash2 } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useToast } from '@/providers/ToastProvider';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button, IconButton } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Textarea } from '@/components/ui/Textarea';
import { EVAL_TYPE_MAP, PURPOSE_LABEL, REQUEST_STATUS_MAP, STAGE_LABEL } from './constants';
import type { EvaluationObjective, EvaluationRequestDetail } from './types';

export interface EvaluationDetailModalProps {
  requestId: number;
  editable: boolean;
  onClose: () => void;
}

const PURPOSE_ITEMS = Object.entries(PURPOSE_LABEL).map(([value, label]) => ({ value, label }));

function emptyObjective(): EvaluationObjective {
  return { objective: '' };
}

export function EvaluationDetailModal({ requestId, editable, onClose }: EvaluationDetailModalProps) {
  const notify = useToast();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [objectives, setObjectives] = useState<EvaluationObjective[]>([]);

  const { data, isLoading } = useApiQuery<EvaluationRequestDetail>(
    queryKeys.evaluation.requestDetail(requestId),
    `/evaluations/requests/${requestId}`,
  );

  useEffect(() => {
    if (!data) return;
    setName(data.name ?? '');
    setPurpose(data.purpose ?? '');
    setDueDate(data.dueDate ? data.dueDate.slice(0, 10) : '');
    setObjectives(data.objectives?.length ? data.objectives : []);
  }, [data]);

  const save = useApiMutation(
    () =>
      apiClient.patch(`/evaluations/requests/${requestId}`, {
        ...(name.trim() ? { name: name.trim() } : {}),
        ...(purpose ? { purpose } : {}),
        ...(dueDate ? { dueDate } : {}),
        objectives: objectives.filter((o) => o.objective.trim()),
      }),
    {
      invalidateKeys: [queryKeys.evaluation.requests(), queryKeys.evaluation.requestDetail(requestId)],
      onSuccess: () => {
        notify({ title: 'Avaliação actualizada', intent: 'success' });
        setEditing(false);
      },
      onError: (e) =>
        notify({ title: e instanceof Error ? e.message : 'Erro ao guardar.', intent: 'danger' }),
    },
  );

  const updateObjective = (i: number, patch: Partial<EvaluationObjective>) =>
    setObjectives((prev) => prev.map((o, idx) => (idx === i ? { ...o, ...patch } : o)));

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title={data ? `Avaliação — ${data.evaluated.fullName}` : 'Avaliação'}
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        {isLoading || !data ? (
          <Skeleton rows={4} wrapperClassName="mt-5 space-y-3" itemClassName="skeleton-shimmer h-12 rounded-card" />
        ) : (
          <div className="mt-5 space-y-5">
            <div className="flex items-center gap-3">
              <Avatar name={data.evaluated.fullName} url={data.evaluated.avatarUrl} size="lg" />
              <div>
                <p className="text-sm font-semibold text-ink">{data.evaluated.fullName}</p>
                <p className="text-xs text-ink-faint">
                  {data.evaluated.position?.name} · {data.evaluated.department?.name}
                </p>
              </div>
              <div className="ml-auto flex flex-col items-end gap-1">
                <StatusBadge value={data.status} map={REQUEST_STATUS_MAP} variant="pill" />
                {data.stage && <span className="text-[11px] text-ink-faint">{STAGE_LABEL[data.stage] ?? data.stage}</span>}
              </div>
            </div>

            {editing ? (
              <>
                <FormField label="Nome da avaliação" htmlFor="ev-name">
                  <Input id="ev-name" value={name} onChange={(e) => setName(e.target.value)} className="w-full" />
                </FormField>
                <FormField label="Tipo de avaliação" htmlFor="ev-purpose">
                  <Select items={PURPOSE_ITEMS} value={purpose} onValueChange={setPurpose} className="w-full" />
                </FormField>
                <FormField label="Prazo" htmlFor="ev-due">
                  <Input id="ev-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full" />
                </FormField>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-ink-faint">Tipo</p>
                  <p className="text-ink">{data.purpose ? PURPOSE_LABEL[data.purpose] : '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-ink-faint">Prazo</p>
                  <p className="text-ink">{data.dueDate ? new Date(data.dueDate).toLocaleDateString('pt') : '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-ink-faint">Ciclo</p>
                  <p className="text-ink">{data.cycle?.name ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-ink-faint">Resultado</p>
                  <p className="text-ink">{data.result != null ? data.result.toFixed(1) : '—'}</p>
                </div>
              </div>
            )}

            {/* Objetivos — ponto 2, etapa 6 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-ink">Objetivos</p>
                {editing && (
                  <Button size="sm" intent="secondary" onClick={() => setObjectives((p) => [...p, emptyObjective()])}>
                    <Plus size={14} strokeWidth={1.75} className="mr-1" /> Adicionar
                  </Button>
                )}
              </div>
              {objectives.length === 0 && <p className="text-xs text-ink-faint">Sem objectivos definidos.</p>}
              <div className="space-y-2">
                {objectives.map((o, i) =>
                  editing ? (
                    <div key={i} className="rounded-card border border-border p-3 space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Objectivo"
                          value={o.objective}
                          onChange={(e) => updateObjective(i, { objective: e.target.value })}
                          className="flex-1"
                        />
                        <IconButton
                          icon={Trash2}
                          label="Remover objectivo"
                          size="sm"
                          onClick={() => setObjectives((prev) => prev.filter((_, idx) => idx !== i))}
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <Input
                          placeholder="Indicador"
                          value={o.indicator ?? ''}
                          onChange={(e) => updateObjective(i, { indicator: e.target.value })}
                        />
                        <Input
                          placeholder="Meta"
                          value={o.target ?? ''}
                          onChange={(e) => updateObjective(i, { target: e.target.value })}
                        />
                        <Input
                          type="number"
                          placeholder="Peso %"
                          value={o.weight ?? ''}
                          onChange={(e) => updateObjective(i, { weight: e.target.value ? Number(e.target.value) : undefined })}
                        />
                      </div>
                    </div>
                  ) : (
                    <div key={i} className="rounded-card border border-border p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-ink">{o.objective}</p>
                        {o.weight !== undefined && <Badge intent="info">{o.weight}%</Badge>}
                      </div>
                      <p className="text-xs text-ink-faint">
                        {[o.indicator, o.target].filter(Boolean).join(' · ') || '—'}
                      </p>
                      {o.achievedResult && (
                        <p className="text-xs text-ink-muted mt-1">Resultado: {o.achievedResult}</p>
                      )}
                    </div>
                  ),
                )}
              </div>
            </div>

            {/* Pedidos individuais (SELF/MANAGER/PEER) */}
            <div>
              <p className="text-sm font-semibold text-ink mb-2">Avaliadores</p>
              <div className="space-y-1.5">
                {data.siblings.map((s) => (
                  <div key={s.id} className="flex items-center justify-between text-xs rounded-control bg-surface-sunken px-3 py-2">
                    <span className="text-ink-muted">
                      {EVAL_TYPE_MAP[s.type]?.label ?? s.type} — {s.evaluator?.fullName ?? '—'}
                    </span>
                    <StatusBadge value={s.status} map={REQUEST_STATUS_MAP} variant="pill" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex gap-3 border-t border-border pt-4">
          {editable && !editing && data && data.status !== 'COMPLETED' && (
            <Button intent="secondary" className="flex-1 justify-center" onClick={() => setEditing(true)}>
              Editar
            </Button>
          )}
          {editing ? (
            <>
              <Button intent="secondary" className="flex-1 justify-center" onClick={() => setEditing(false)}>
                Cancelar edição
              </Button>
              <Button className="flex-1 justify-center" loading={save.isPending} onClick={() => save.mutate(undefined)}>
                Guardar
              </Button>
            </>
          ) : (
            <Button className="flex-1 justify-center" onClick={onClose}>
              Fechar
            </Button>
          )}
        </div>
        {save.isError && (
          <div className="mt-3 flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
            <AlertCircle size={16} strokeWidth={1.75} />
            Não foi possível guardar as alterações.
          </div>
        )}
      </ModalContent>
    </Modal>
  );
}
