// components/performance/CreatePerformanceCycleModal.tsx
// Formulário "Criar Avaliação de Desempenho" — cobre as secções do
// documento docs/criar_formulario_para_avaliacao_de_desempenho.md que o
// backend (src/performance) já suporta: informações gerais, período,
// população-alvo (departamento específico ou todos), avaliadores, pesos,
// escala e regras/configurações (secção 21). Só EVAL_CREATOR_ROLES (ADMIN,
// GESTOR, RH, DIRECTOR, LIDER — ver lib/roles.ts) chega a este modal.
//
// Fora de âmbito deste formulário (não duplicados aqui — ver CLAUDE.md
// "orquestrar módulos existentes"): selecção de objectivos/competências
// específicos (vivem em Goal/Competency, associados por review individual,
// não ao ciclo), responsável pela avaliação (sem picker de utilizador nesta
// versão) e o fluxo de preenchimento em si (autoavaliação/avaliação do
// gestor/calibração/PDI/reunião — já existem como acções próprias depois do
// ciclo activo, ver MyDashboard/TeamView).

'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/providers/ToastProvider';
import type { PaginatedDepts } from '@/components/departments/types';

export interface CreatePerformanceCycleModalProps {
  onClose: () => void;
}

const TYPE_ITEMS = [
  { value: 'ANNUAL', label: 'Anual' },
  { value: 'SEMESTER', label: 'Semestral' },
  { value: 'QUARTERLY', label: 'Trimestral' },
  { value: 'PROBATION', label: 'Período experimental' },
  { value: 'AD_HOC', label: 'Extraordinária / Outro' },
];

const SCALE_ITEMS = [3, 4, 5, 7, 10].map((n) => ({ value: String(n), label: `1–${n}` }));

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-2 text-sm text-ink">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-border-strong"
      />
      <span>
        {label}
        {hint && <span className="block text-xs text-ink-faint">{hint}</span>}
      </span>
    </label>
  );
}

export function CreatePerformanceCycleModal({ onClose }: CreatePerformanceCycleModalProps) {
  const notify = useToast();

  // 1. Informações gerais
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('ANNUAL');

  // 2/4. Período
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selfEvalDeadline, setSelfEvalDeadline] = useState('');
  const [managerEvalDeadline, setManagerEvalDeadline] = useState('');

  // 2. População a avaliar
  const [allDepartments, setAllDepartments] = useState(true);
  const [targetDepartmentIds, setTargetDepartmentIds] = useState<number[]>([]);

  // 3. Avaliadores
  const [allowSelfEvaluation, setAllowSelfEvaluation] = useState(true);
  const [allowManagerEvaluation, setAllowManagerEvaluation] = useState(true);
  const [allowRhEvaluation, setAllowRhEvaluation] = useState(false);
  const [selfBeforeManager, setSelfBeforeManager] = useState(true);

  // 8. Pesos + 7. Escala
  const [goalsWeight, setGoalsWeight] = useState('40');
  const [competenciesWeight, setCompetenciesWeight] = useState('40');
  const [behaviorsWeight, setBehaviorsWeight] = useState('20');
  const [scoreScale, setScoreScale] = useState('5');
  const [anonymous360, setAnonymous360] = useState(true);

  // 21. Regras/configurações
  const [allowComments, setAllowComments] = useState(true);
  const [requireCommentsBelow, setRequireCommentsBelow] = useState('');
  const [allowAttachments, setAllowAttachments] = useState(true);
  const [calibrationEnabled, setCalibrationEnabled] = useState(true);
  const [pdiEnabled, setPdiEnabled] = useState(true);
  const [feedbackMeetingEnabled, setFeedbackMeetingEnabled] = useState(true);
  const [allowDispute, setAllowDispute] = useState(true);
  const [requireAcceptance, setRequireAcceptance] = useState(false);

  const [submitError, setSubmitError] = useState('');

  const deptsQ = useApiQuery<PaginatedDepts>(
    queryKeys.departments.list({ limit: 200 }),
    '/departments',
    { params: { limit: 200 } },
  );
  const departments = deptsQ.data?.data ?? [];

  const toggleDepartment = (id: number) => {
    setTargetDepartmentIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id],
    );
  };

  const weightsSum =
    (parseInt(goalsWeight, 10) || 0) +
    (parseInt(competenciesWeight, 10) || 0) +
    (parseInt(behaviorsWeight, 10) || 0);
  const weightsOk = weightsSum === 100;

  const datesOk = !startDate || !endDate || new Date(endDate).getTime() > new Date(startDate).getTime();

  const canSubmit = name.trim().length > 0 && !!startDate && !!endDate && datesOk && weightsOk;

  const createCycle = useApiMutation(
    (body: Record<string, unknown>) => apiClient.post<{ id: number }>('/performance/cycles', body),
    {
      invalidateKeys: [queryKeys.performance.cycles()],
      onSuccess: () => {
        notify({ title: 'Avaliação de desempenho criada', intent: 'success' });
        onClose();
      },
      onError: (e) => setSubmitError(e.message || 'Erro ao criar a avaliação. Tente novamente.'),
    },
  );
  const loading = createCycle.isPending;

  const handleSubmit = () => {
    if (!canSubmit || loading) return;
    setSubmitError('');
    createCycle.mutate({
      name: name.trim(),
      ...(code.trim() ? { code: code.trim() } : {}),
      ...(description.trim() ? { description: description.trim() } : {}),
      type,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      ...(selfEvalDeadline ? { selfEvalDeadline: new Date(selfEvalDeadline).toISOString() } : {}),
      ...(managerEvalDeadline
        ? { managerEvalDeadline: new Date(managerEvalDeadline).toISOString() }
        : {}),
      targetDepartmentIds: allDepartments ? [] : targetDepartmentIds,
      selfBeforeManager,
      anonymous360,
      goalsWeight: parseInt(goalsWeight, 10) || 0,
      competenciesWeight: parseInt(competenciesWeight, 10) || 0,
      behaviorsWeight: parseInt(behaviorsWeight, 10) || 0,
      scoreScale: parseInt(scoreScale, 10) || 5,
      rules: {
        allowSelfEvaluation,
        allowComments,
        ...(requireCommentsBelow ? { requireCommentsBelow: parseFloat(requireCommentsBelow) } : {}),
        allowAttachments,
        allowManagerEvaluation,
        allowRhEvaluation,
        calibrationEnabled,
        pdiEnabled,
        feedbackMeetingEnabled,
        allowDispute,
        requireAcceptance,
      },
    });
  };

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Criar avaliação de desempenho"
        description="Fica como rascunho (PLANNED) até activares — a população-alvo só é inscrita na activação."
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="mt-5 space-y-6">
          {submitError && (
            <div className="flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
              <AlertCircle size={16} strokeWidth={1.75} />
              {submitError}
            </div>
          )}

          {/* 1. Informações gerais */}
          <div className="space-y-4">
            <h3 className="font-display text-xs font-bold uppercase tracking-wide text-ink-faint">
              Informações gerais
            </h3>
            <FormField label="Nome *" htmlFor="pc-name">
              <Input
                id="pc-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Avaliação Anual 2026"
              />
            </FormField>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Código" htmlFor="pc-code" hint="Opcional.">
                <Input
                  id="pc-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Ex.: AD-2026-01"
                />
              </FormField>
              <FormField label="Tipo de avaliação" htmlFor="pc-type">
                <Select items={TYPE_ITEMS} value={type} onValueChange={setType} />
              </FormField>
            </div>
            <FormField label="Descrição" htmlFor="pc-description" hint="Opcional.">
              <Textarea
                id="pc-description"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </FormField>
          </div>

          {/* 2/4. Período */}
          <div className="space-y-4">
            <h3 className="font-display text-xs font-bold uppercase tracking-wide text-ink-faint">
              Período
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Início *" htmlFor="pc-start">
                <Input
                  id="pc-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </FormField>
              <FormField label="Fim *" htmlFor="pc-end">
                <Input
                  id="pc-end"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  invalid={!datesOk}
                />
              </FormField>
            </div>
            {!datesOk && <p className="text-xs text-danger-ink">O fim tem de ser posterior ao início.</p>}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                label="Deadline autoavaliação"
                htmlFor="pc-self-deadline"
                hint="Opcional — pode ser posterior ao fim do período de desempenho."
              >
                <Input
                  id="pc-self-deadline"
                  type="date"
                  value={selfEvalDeadline}
                  onChange={(e) => setSelfEvalDeadline(e.target.value)}
                />
              </FormField>
              <FormField label="Deadline avaliação do gestor" htmlFor="pc-mgr-deadline" hint="Opcional.">
                <Input
                  id="pc-mgr-deadline"
                  type="date"
                  value={managerEvalDeadline}
                  onChange={(e) => setManagerEvalDeadline(e.target.value)}
                />
              </FormField>
            </div>
          </div>

          {/* 2. População a avaliar */}
          <div className="space-y-3">
            <h3 className="font-display text-xs font-bold uppercase tracking-wide text-ink-faint">
              População a avaliar
            </h3>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={allDepartments}
                onChange={(e) => setAllDepartments(e.target.checked)}
                className="h-4 w-4 rounded border-border-strong"
              />
              Todos os departamentos
            </label>
            {!allDepartments && (
              <div className="grid max-h-40 grid-cols-2 gap-2 overflow-y-auto rounded-card border border-border p-3">
                {departments.map((d) => (
                  <label key={d.id} className="flex items-center gap-2 text-sm text-ink">
                    <input
                      type="checkbox"
                      checked={targetDepartmentIds.includes(d.id)}
                      onChange={() => toggleDepartment(d.id)}
                      className="h-4 w-4 rounded border-border-strong"
                    />
                    {d.name}
                  </label>
                ))}
                {departments.length === 0 && (
                  <span className="text-xs text-ink-faint">A carregar departamentos…</span>
                )}
              </div>
            )}
          </div>

          {/* 3. Avaliadores */}
          <div className="space-y-3">
            <h3 className="font-display text-xs font-bold uppercase tracking-wide text-ink-faint">
              Avaliadores
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Toggle label="Permitir autoavaliação" checked={allowSelfEvaluation} onChange={setAllowSelfEvaluation} />
              <Toggle
                label="Permitir avaliação pelo gestor"
                checked={allowManagerEvaluation}
                onChange={setAllowManagerEvaluation}
              />
              <Toggle label="Permitir avaliação pelo RH" checked={allowRhEvaluation} onChange={setAllowRhEvaluation} />
              <Toggle
                label="Autoavaliação antes do gestor"
                hint="Se desligado, o gestor pode avaliar sem esperar pela autoavaliação."
                checked={selfBeforeManager}
                onChange={setSelfBeforeManager}
              />
            </div>
          </div>

          {/* 7/8. Escala e pesos */}
          <div className="space-y-4">
            <h3 className="font-display text-xs font-bold uppercase tracking-wide text-ink-faint">
              Escala e pesos
            </h3>
            <FormField label="Escala de avaliação" htmlFor="pc-scale">
              <Select items={SCALE_ITEMS} value={scoreScale} onValueChange={setScoreScale} />
            </FormField>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormField label="Objectivos/KPIs (%)" htmlFor="pc-goals-w">
                <Input
                  id="pc-goals-w"
                  type="number"
                  min={0}
                  max={100}
                  value={goalsWeight}
                  onChange={(e) => setGoalsWeight(e.target.value)}
                />
              </FormField>
              <FormField label="Competências (%)" htmlFor="pc-comp-w">
                <Input
                  id="pc-comp-w"
                  type="number"
                  min={0}
                  max={100}
                  value={competenciesWeight}
                  onChange={(e) => setCompetenciesWeight(e.target.value)}
                />
              </FormField>
              <FormField label="Comportamentos/Valores (%)" htmlFor="pc-behav-w">
                <Input
                  id="pc-behav-w"
                  type="number"
                  min={0}
                  max={100}
                  value={behaviorsWeight}
                  onChange={(e) => setBehaviorsWeight(e.target.value)}
                />
              </FormField>
            </div>
            <p className={`text-xs ${weightsOk ? 'text-ink-faint' : 'text-danger-ink'}`}>
              Total: {weightsSum}% {weightsOk ? '' : '— a soma dos pesos tem de ser 100%.'}
            </p>
            <Toggle
              label="Anonimato na avaliação 360°"
              checked={anonymous360}
              onChange={setAnonymous360}
            />
          </div>

          {/* 21. Regras e configurações */}
          <div className="space-y-3">
            <h3 className="font-display text-xs font-bold uppercase tracking-wide text-ink-faint">
              Regras e configurações
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Toggle label="Permitir comentários" checked={allowComments} onChange={setAllowComments} />
              <Toggle label="Permitir anexos/evidências" checked={allowAttachments} onChange={setAllowAttachments} />
              <Toggle label="Activar calibração" checked={calibrationEnabled} onChange={setCalibrationEnabled} />
              <Toggle label="Activar criação de PDI" checked={pdiEnabled} onChange={setPdiEnabled} />
              <Toggle
                label="Activar reunião de feedback"
                checked={feedbackMeetingEnabled}
                onChange={setFeedbackMeetingEnabled}
              />
              <Toggle label="Permitir contestação/revisão" checked={allowDispute} onChange={setAllowDispute} />
              <Toggle
                label="Exigir aceitação do colaborador"
                hint="O colaborador tem de confirmar que leu o resultado publicado."
                checked={requireAcceptance}
                onChange={setRequireAcceptance}
              />
            </div>
            <FormField
              label="Comentário obrigatório abaixo de"
              htmlFor="pc-min-comment"
              hint="Opcional — nota mínima (na escala escolhida) a partir da qual o comentário passa a ser obrigatório."
            >
              <Input
                id="pc-min-comment"
                type="number"
                min={0}
                step="0.1"
                value={requireCommentsBelow}
                onChange={(e) => setRequireCommentsBelow(e.target.value)}
                placeholder="Ex.: 2.5"
              />
            </FormField>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button intent="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit} loading={loading}>
            Criar avaliação
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
