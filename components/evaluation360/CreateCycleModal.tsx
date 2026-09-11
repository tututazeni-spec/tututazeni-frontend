// components/evaluation360/CreateCycleModal.tsx
// Modal "Novo Ciclo" do separador "Ciclos" da Avaliação 360º.
//
// Antes submetia para POST /evaluations/cycles — o módulo ERRADO (`evaluation`,
// singular: review de performance geral, não a 360º real). Corrigido para
// falar com o módulo evaluation360.controller.ts (`/evaluation360/cycles`),
// que tem competências/avaliadores/pesos por papel próprios.
//
// Não expõe escolha de modelo (fica sempre DEG_360, único pedido) nem
// picker de competências/perguntas: o backend (createCycle→
// attachStandardCompetencies) já anexa sozinho as 8 competências fixas da
// INNOVA + 1 questão cada quando o ciclo é criado sem `competencies`.
//
// Botão único "Criar e Distribuir" em vez do fluxo manual
// suggest→assign→approve→invite: cria o ciclo, adiciona todos os
// utilizadores activos dos departamentos escolhidos como participantes
// (addParticipantsByDepartment) e distribui automaticamente os avaliadores
// (distribute) — só ADMIN/GESTOR/RH/DIRECTOR/LIDER chegam a ver este modal
// (ver EVAL_CREATOR_ROLES em Evaluation360View.tsx).

'use client';

import { useMemo, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useFormValidation } from '@/hooks/useFormValidation';
import { required } from '@/lib/validation';
import { useToast } from '@/providers/ToastProvider';
import { useDepartmentOptions } from './cycleData';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';

export interface CreateCycleModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

// Espelha o enum Eval360CycleType do backend (evaluation360.dto.ts).
const TYPE_LABEL: Record<string, string> = {
  TRIMESTRAL: 'Trimestral',
  SEMESTRAL: 'Semestral',
  ANUAL: 'Anual',
  PROJECT: 'Por Projecto',
  CUSTOM: 'Personalizado',
};
const TYPE_ITEMS = Object.entries(TYPE_LABEL).map(([value, label]) => ({ value, label }));

// Espelha o enum EvaluatorRole do backend. Pesos por omissão pedidos: 10%
// autoavaliação, 30% gestor directo, 20% pares (mesma função), 40%
// equipa/subordinados — soma 100.
const WEIGHT_TYPES = ['SELF', 'MANAGER', 'PEER', 'SUBORDINATE', 'EXTERNAL'] as const;
type WeightType = (typeof WEIGHT_TYPES)[number];
const WEIGHT_LABEL: Record<WeightType, string> = {
  SELF: 'Autoavaliação',
  MANAGER: 'Gestor directo',
  PEER: 'Pares (mesma função)',
  SUBORDINATE: 'Equipa / Subordinados',
  EXTERNAL: 'Externo',
};
const DEFAULT_WEIGHTS: Record<WeightType, string> = {
  SELF: '10',
  MANAGER: '30',
  PEER: '20',
  SUBORDINATE: '40',
  EXTERNAL: '0',
};

interface CreatedCycle {
  id: string;
}

export function CreateCycleModal({ onClose, onSuccess }: CreateCycleModalProps) {
  const notify = useToast();
  const { options: departmentOptions, loading: departmentsLoading } = useDepartmentOptions();
  const {
    values: form,
    setField,
    errorMessage: validationError,
    handleSubmit: withValidation,
  } = useFormValidation(
    {
      name: '',
      type: 'SEMESTRAL',
      description: '',
      startDate: '',
      endDate: '',
    },
    { name: [required()] },
  );

  const [departmentIds, setDepartmentIds] = useState<string[]>([]);
  const [weights, setWeights] = useState<Record<WeightType, string>>(DEFAULT_WEIGHTS);
  const [submitError, setSubmitError] = useState('');

  const weightPayload = useMemo(
    () =>
      Object.fromEntries(
        WEIGHT_TYPES.map((type) => [
          `weight${type.charAt(0)}${type.slice(1).toLowerCase()}`,
          Number(weights[type]) || 0,
        ]),
      ) as Record<string, number>,
    [weights],
  );
  const weightTotal = WEIGHT_TYPES.reduce((s, t) => s + (Number(weights[t]) || 0), 0);

  const toggleDepartment = (id: string) =>
    setDepartmentIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id],
    );

  const createAndDistribute = useApiMutation(
    async () => {
      const cycle = await apiClient.post<CreatedCycle>('/evaluation360/cycles', {
        tenantId: 'default',
        name: form.name.trim(),
        model: 'DEG_360',
        type: form.type,
        startDate: form.startDate,
        endDate: form.endDate,
        ...weightPayload,
        ...(form.description.trim() ? { description: form.description.trim() } : {}),
      });
      await apiClient.post(`/evaluation360/cycles/${cycle.id}/participants/by-department`, {
        departmentIds,
      });
      return apiClient.post(`/evaluation360/cycles/${cycle.id}/distribute`);
    },
    {
      invalidateKeys: [queryKeys.evaluation360.cycles()],
      onSuccess: () => {
        notify({
          title: 'Ciclo criado e distribuído',
          description:
            'Os avaliadores (autoavaliação, gestor, pares e equipa) já foram atribuídos e convidados.',
          intent: 'success',
        });
        onSuccess();
        onClose();
      },
      onError: () =>
        setSubmitError('Erro ao criar/distribuir o ciclo. Verifica os dados e tenta de novo.'),
    },
  );
  const loading = createAndDistribute.isPending;

  const localError = (() => {
    if (!form.startDate || !form.endDate) return 'Indica as datas de início e fim.';
    if (form.endDate < form.startDate) return 'A data de fim não pode ser anterior à de início.';
    if (departmentIds.length === 0) return 'Escolhe pelo menos um departamento a avaliar.';
    if (weightTotal !== 100)
      return `Os pesos por papel têm de somar 100 (soma actual: ${weightTotal}).`;
    return '';
  })();

  const error = validationError || submitError || localError;

  const handleSubmit = withValidation(() => {
    setSubmitError('');
    if (localError) return;
    createAndDistribute.mutate(undefined);
  });

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Novo Ciclo de Avaliação 360°"
        description="Cria o ciclo com as 8 competências-padrão da INNOVA e distribui os avaliadores automaticamente."
        className="max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="mt-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-danger-subtle text-danger-ink rounded-card text-sm">
              <AlertCircle size={16} strokeWidth={1.75} />
              {error}
            </div>
          )}

          <FormField label="Nome *" htmlFor="cyc-name">
            <Input
              id="cyc-name"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              className="w-full"
              placeholder="Ex.: Avaliação 360° Semestral 2026 — S1"
            />
          </FormField>

          <FormField label="Periodicidade *" htmlFor="cyc-type">
            <Select
              items={TYPE_ITEMS}
              value={form.type || undefined}
              onValueChange={(v) => setField('type', v)}
              className="w-full"
              placeholder="Selecionar periodicidade"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Início *" htmlFor="cyc-start">
              <Input
                id="cyc-start"
                type="date"
                value={form.startDate}
                onChange={(e) => setField('startDate', e.target.value)}
                className="w-full"
              />
            </FormField>
            <FormField label="Fim *" htmlFor="cyc-end">
              <Input
                id="cyc-end"
                type="date"
                value={form.endDate}
                onChange={(e) => setField('endDate', e.target.value)}
                className="w-full"
              />
            </FormField>
          </div>

          <FormField label="Descrição" htmlFor="cyc-description">
            <Textarea
              id="cyc-description"
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              className="w-full"
              rows={2}
              placeholder="Âmbito, objectivos, notas para os participantes…"
            />
          </FormField>

          <div>
            <span className="font-body text-sm font-medium text-ink">
              Departamentos a avaliar *
            </span>
            <p className="mt-1 mb-2 font-body text-xs text-ink-muted">
              Todos os colaboradores activos destes departamentos entram como
              participantes; cada um é avaliado pelos colegas do mesmo
              departamento, pelo gestor directo e pela sua equipa.
            </p>
            <div className="max-h-40 overflow-y-auto rounded-card border border-border p-2 space-y-1">
              {departmentsLoading && (
                <div className="px-1 py-1 text-sm text-ink-muted">A carregar…</div>
              )}
              {!departmentsLoading && departmentOptions.length === 0 && (
                <div className="px-1 py-1 text-sm text-ink-muted">
                  Nenhum departamento encontrado.
                </div>
              )}
              {departmentOptions.map((d) => (
                <label
                  key={d.value}
                  className="flex items-center gap-2 rounded-control px-1 py-1 font-body text-sm text-ink hover:bg-surface-sunken"
                >
                  <input
                    type="checkbox"
                    checked={departmentIds.includes(d.value)}
                    onChange={() => toggleDepartment(d.value)}
                    className="h-4 w-4 rounded border-border-strong"
                  />
                  {d.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <span className="font-body text-sm font-medium text-ink">
                Pesos por papel do avaliador
              </span>
              <span
                className={
                  weightTotal === 100
                    ? 'font-body text-xs text-success-ink'
                    : 'font-body text-xs text-danger-ink'
                }
              >
                Total: {weightTotal} / 100
              </span>
            </div>
            <p className="mt-1 mb-2 font-body text-xs text-ink-muted">
              A soma tem de dar 100. Valores por omissão: 10% autoavaliação,
              30% gestor directo, 20% pares, 40% equipa/subordinados.
            </p>
            <div className="space-y-2">
              {WEIGHT_TYPES.map((type) => (
                <div key={type} className="flex items-center gap-3">
                  <label
                    htmlFor={`cyc-w-${type}`}
                    className="flex-1 font-body text-sm text-ink-muted"
                  >
                    {WEIGHT_LABEL[type]}
                  </label>
                  <Input
                    id={`cyc-w-${type}`}
                    type="number"
                    min={0}
                    max={100}
                    value={weights[type]}
                    onChange={(e) => setWeights((w) => ({ ...w, [type]: e.target.value }))}
                    className="w-24"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3 border-t border-border pt-4">
          <Button intent="secondary" className="flex-1 justify-center" onClick={onClose}>
            Cancelar
          </Button>
          <Button className="flex-1 justify-center" onClick={handleSubmit} loading={loading}>
            {loading ? 'A criar e distribuir...' : 'Criar e Distribuir'}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
