// components/evaluation/NewEvaluationWizard.tsx
// "Nova Avaliação" — assistente de 8 etapas (docs/modulo_evaluation.md
// ponto 2). Por trás reaproveita inteiramente o motor de Ciclos já
// existente (decisão confirmada com o utilizador — ver plano): cria (ou
// reaproveita) um EvaluationCampaign com os campos recolhidos nas etapas
// 1/3/4/5/7/8, e atribui participantes (etapa 2) — explicitamente via
// bulk-assign quando o âmbito é "Grupo de colaboradores" (com
// avaliador/objectivos por colaborador), ou por auto-atribuição do ciclo
// (hierarquia de gestor, já existente) quando o âmbito é Todos/
// Departamento/Unidade.
//
// Mesmo padrão de assistente por etapas de
// components/development-plans/CreatePlanWizard.tsx.

'use client';

import { useMemo, useRef, useState } from 'react';
import { AlertCircle, Check, Plus, Trash2, X } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useToast } from '@/providers/ToastProvider';
import { useQueryClient } from '@tanstack/react-query';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { DepartmentUserPicker } from '@/components/departments/DepartmentUserPicker';
import { useDirectoryUsers, useUnits, type DirectoryUser } from '@/components/departments/departmentFormData';
import { BLOCK_OPTIONS, MODEL_LABEL, POPULATION_TYPE_LABEL, PURPOSE_LABEL } from './constants';
import type { Cycle, EvaluationObjective } from './types';

interface CriteriaOption {
  id: number;
  name: string;
  category?: string | null;
}
interface ScaleOption {
  id: number;
  name: string;
  minValue: number;
  maxValue: number;
}

const STEPS = [
  { id: 'general', label: 'Dados gerais' },
  { id: 'participants', label: 'Participantes' },
  { id: 'structure', label: 'Estrutura' },
  { id: 'criteria', label: 'Critérios' },
  { id: 'scale', label: 'Escala' },
  { id: 'objectives', label: 'Objetivos' },
  { id: 'selfEval', label: 'Autoavaliação' },
  { id: 'flow', label: 'Fluxo' },
] as const;

const PURPOSE_ITEMS = Object.entries(PURPOSE_LABEL).map(([value, label]) => ({ value, label }));
const MODEL_ITEMS = Object.entries(MODEL_LABEL).map(([value, label]) => ({ value, label }));
const POPULATION_ITEMS = Object.entries(POPULATION_TYPE_LABEL).map(([value, label]) => ({ value, label }));

function emptyObjective(): EvaluationObjective {
  return { objective: '' };
}

export interface NewEvaluationWizardProps {
  onClose: () => void;
}

export function NewEvaluationWizard({ onClose }: NewEvaluationWizardProps) {
  const notify = useToast();
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const nextKeyRef = useRef(0);

  // Etapa 1
  const [name, setName] = useState('');
  const [purpose, setPurpose] = useState('PERFORMANCE');
  const [cycleMode, setCycleMode] = useState<'standalone' | 'existing'>('standalone');
  const [existingCycleId, setExistingCycleId] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dueDate, setDueDate] = useState('');

  // Etapa 2
  const [populationType, setPopulationType] = useState<'ALL' | 'DEPARTMENT' | 'UNIT' | 'GROUP'>('GROUP');
  const [departmentId, setDepartmentId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<DirectoryUser[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [primaryEvaluator, setPrimaryEvaluator] = useState<DirectoryUser | null>(null);
  const [secondaryEvaluator, setSecondaryEvaluator] = useState<DirectoryUser | null>(null);

  // Etapa 3
  const [model, setModel] = useState('360');
  const [blocks, setBlocks] = useState<string[]>(['GOALS', 'COMPETENCIES']);

  // Etapa 4
  const [criteriaWeights, setCriteriaWeights] = useState<Record<number, number>>({});

  // Etapa 5
  const [scaleId, setScaleId] = useState('');

  // Etapa 6
  const [objectives, setObjectives] = useState<EvaluationObjective[]>([]);

  // Etapa 7
  const [allowSelfEval, setAllowSelfEval] = useState(true);
  const [selfEvalDueDate, setSelfEvalDueDate] = useState('');
  const [requireComments, setRequireComments] = useState(false);
  const [requireEvidence, setRequireEvidence] = useState(false);

  // Etapa 8
  const [allowCalibration, setAllowCalibration] = useState(true);

  const { data: cyclesData } = useApiQuery<{ data: Cycle[] }>(
    queryKeys.evaluation.cycles(),
    '/evaluations/cycles',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const { data: deptTree } = useApiQuery<{ id: number; name: string; children?: unknown[] }[]>(
    queryKeys.departments.tree(),
    '/departments/tree',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const departments = useMemo(() => {
    const flat: { id: number; name: string }[] = [];
    const walk = (nodes: typeof deptTree) => {
      for (const n of nodes ?? []) {
        flat.push({ id: n.id, name: n.name });
        walk(n.children as typeof deptTree);
      }
    };
    walk(deptTree);
    return flat;
  }, [deptTree]);
  const { units } = useUnits(true);
  const { data: criteriaList } = useApiQuery<CriteriaOption[]>(
    queryKeys.evaluation.criteria(),
    '/evaluations/criteria',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const { data: scalesList } = useApiQuery<ScaleOption[]>(
    queryKeys.evaluation.scales(),
    '/evaluations/scales',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const { users: searchResults } = useDirectoryUsers(userSearch, userSearch.trim().length > 0);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const stepIssues: string[] = (() => {
    switch (current.id) {
      case 'general': {
        const missing: string[] = [];
        if (!name.trim()) missing.push('nome');
        if (cycleMode === 'standalone' && (!startDate || !endDate)) missing.push('datas');
        if (cycleMode === 'existing' && !existingCycleId) missing.push('ciclo');
        return missing.length ? [`Falta preencher: ${missing.join(', ')}`] : [];
      }
      case 'participants': {
        if (populationType === 'GROUP' && selectedUsers.length === 0) return ['selecciona pelo menos um colaborador'];
        if (populationType === 'DEPARTMENT' && !departmentId) return ['selecciona um departamento'];
        if (populationType === 'UNIT' && !unitId) return ['selecciona uma unidade'];
        return [];
      }
      default:
        return [];
    }
  })();
  const canAdvance = stepIssues.length === 0;

  const toggleBlock = (v: string) =>
    setBlocks((prev) => (prev.includes(v) ? prev.filter((b) => b !== v) : [...prev, v]));

  const addUser = (u: DirectoryUser) => {
    if (!selectedUsers.some((s) => s.id === u.id)) setSelectedUsers((prev) => [...prev, u]);
    setUserSearch('');
  };

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      // Etapa 4/5 — critérios+escala viram um EvaluationTemplate ad-hoc
      // (reaproveita createTemplate/createCriteria já existentes) para que
      // o ciclo criado abaixo os use via templateId.
      let templateId: number | undefined;
      const criteriaEntries = Object.entries(criteriaWeights).filter(([, w]) => w > 0);
      if (criteriaEntries.length > 0 || scaleId) {
        const template = await apiClient.post<{ id: number }>('/evaluations/templates', {
          name: `${name.trim()} — Modelo`,
          type: purpose,
          scaleId: scaleId ? Number(scaleId) : undefined,
          criteria: criteriaEntries.map(([criteriaId, weight]) => ({
            criteriaId: Number(criteriaId),
            weight,
          })),
        });
        templateId = template.id;
      }

      let cycleId: number;
      if (cycleMode === 'existing') {
        cycleId = Number(existingCycleId);
      } else {
        const created = await apiClient.post<{ id: number }>('/evaluations/cycles', {
          name: name.trim(),
          purpose,
          model,
          startDate,
          endDate,
          ...(description.trim() ? { description: description.trim() } : {}),
          templateId,
          blocks,
          populationType,
          ...(populationType === 'DEPARTMENT' ? { targetDeptIds: [Number(departmentId)] } : {}),
          ...(populationType === 'UNIT' ? { targetUnitIds: [Number(unitId)] } : {}),
          ...(populationType === 'GROUP' ? { targetUserIds: selectedUsers.map((u) => u.id) } : {}),
          ...(selfEvalDueDate ? { selfEvalDueDate } : {}),
          ...(dueDate ? { managerEvalDueDate: dueDate } : {}),
          requireComments,
          requireEvidence,
          allowCalibration,
          weights: allowSelfEval
            ? [
                { type: 'SELF', weight: 30 },
                { type: 'MANAGER', weight: 70 },
              ]
            : [{ type: 'MANAGER', weight: 100 }],
        });
        cycleId = created.id;
      }

      // Etapa 2 — âmbito "Grupo de colaboradores" com avaliador escolhido
      // à mão: atribuição explícita (com objectivos da etapa 6). Para
      // Todos/Departamento/Unidade, o ciclo já fica correctamente
      // segmentado acima; a atribuição real acontece quando o ciclo for
      // activado (auto-atribuição por hierarquia, fluxo já existente).
      if (populationType === 'GROUP' && primaryEvaluator) {
        const cleanObjectives = objectives.filter((o) => o.objective.trim());
        const assignments = selectedUsers.flatMap((u) => {
          const rows = [
            {
              evaluatedId: u.id,
              evaluatorId: primaryEvaluator.id,
              type: 'MANAGER',
              purpose,
              objectives: cleanObjectives.length ? cleanObjectives : undefined,
            },
          ];
          if (secondaryEvaluator) {
            rows.push({
              evaluatedId: u.id,
              evaluatorId: secondaryEvaluator.id,
              type: 'PEER',
              purpose,
              objectives: undefined,
            });
          }
          if (allowSelfEval) {
            rows.push({ evaluatedId: u.id, evaluatorId: u.id, type: 'SELF', purpose, objectives: undefined });
          }
          return rows;
        });
        await apiClient.post('/evaluations/bulk-assign', { cycleId, assignments });
      }

      qc.invalidateQueries({ queryKey: queryKeys.evaluation.cycles() });
      qc.invalidateQueries({ queryKey: queryKeys.evaluation.all });
      notify({ title: 'Avaliação criada', intent: 'success' });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao criar a avaliação.');
    } finally {
      setBusy(false);
    }
  };

  const advance = () => {
    if (!canAdvance) return;
    if (isLast) {
      void submit();
      return;
    }
    setStep((s) => s + 1);
  };

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Nova Avaliação"
        description={`Etapa ${step + 1} de ${STEPS.length} — ${current.label}`}
        className="max-h-[90vh] max-w-2xl overflow-y-auto"
      >
        <ol className="mt-4 mb-4 flex flex-wrap gap-1">
          {STEPS.map((s, i) => {
            const isCurrent = i === step;
            const done = i < step;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => i < step && setStep(i)}
                  title={`${i + 1}. ${s.label}`}
                  className={
                    'flex h-6 w-6 items-center justify-center rounded-full font-body text-[11px] transition-colors disabled:cursor-not-allowed ' +
                    (isCurrent
                      ? 'bg-primary text-primary-fg ring-2 ring-primary/40'
                      : done
                        ? 'bg-success text-canvas'
                        : 'bg-surface-sunken text-ink-faint')
                  }
                >
                  {done && !isCurrent ? <Check size={12} strokeWidth={2.5} /> : i + 1}
                </button>
              </li>
            );
          })}
        </ol>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
            <AlertCircle size={16} strokeWidth={1.75} />
            {error}
          </div>
        )}

        {current.id === 'general' && (
          <div className="space-y-4">
            <FormField label="Nome da avaliação *" htmlFor="ne-name">
              <Input id="ne-name" value={name} onChange={(e) => setName(e.target.value)} className="w-full" />
            </FormField>
            <FormField label="Tipo de avaliação" htmlFor="ne-purpose">
              <Select items={PURPOSE_ITEMS} value={purpose} onValueChange={setPurpose} className="w-full" />
            </FormField>
            <div className="flex gap-2">
              <Button
                size="sm"
                intent={cycleMode === 'standalone' ? 'primary' : 'secondary'}
                onClick={() => setCycleMode('standalone')}
              >
                Nova avaliação independente
              </Button>
              <Button
                size="sm"
                intent={cycleMode === 'existing' ? 'primary' : 'secondary'}
                onClick={() => setCycleMode('existing')}
              >
                Associar a ciclo existente
              </Button>
            </div>
            {cycleMode === 'existing' ? (
              <FormField label="Ciclo de avaliação *" htmlFor="ne-cycle">
                <Select
                  items={(cyclesData?.data ?? []).map((c) => ({ value: String(c.id), label: c.name }))}
                  value={existingCycleId}
                  onValueChange={setExistingCycleId}
                  className="w-full"
                />
              </FormField>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Início *" htmlFor="ne-start">
                  <Input id="ne-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full" />
                </FormField>
                <FormField label="Fim *" htmlFor="ne-end">
                  <Input id="ne-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full" />
                </FormField>
              </div>
            )}
            <FormField label="Prazo de resposta (avaliador)" htmlFor="ne-due">
              <Input id="ne-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full" />
            </FormField>
            <FormField label="Descrição" htmlFor="ne-desc">
              <Textarea id="ne-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full" />
            </FormField>
          </div>
        )}

        {current.id === 'participants' && (
          <div className="space-y-4">
            <FormField label="População abrangida" htmlFor="ne-pop">
              <Select
                items={POPULATION_ITEMS}
                value={populationType}
                onValueChange={(v) => setPopulationType(v as typeof populationType)}
                className="w-full"
              />
            </FormField>
            {populationType === 'DEPARTMENT' && (
              <FormField label="Departamento *" htmlFor="ne-dept">
                <Select
                  items={departments.map((d) => ({ value: String(d.id), label: d.name }))}
                  value={departmentId}
                  onValueChange={setDepartmentId}
                  className="w-full"
                />
              </FormField>
            )}
            {populationType === 'UNIT' && (
              <FormField label="Unidade *" htmlFor="ne-unit">
                <Select
                  items={units.map((u) => ({ value: String(u.id), label: u.name }))}
                  value={unitId}
                  onValueChange={setUnitId}
                  className="w-full"
                />
              </FormField>
            )}
            {populationType === 'GROUP' && (
              <>
                <FormField label="Colaboradores *" htmlFor="ne-users">
                  <Input
                    id="ne-users"
                    placeholder="Pesquisar por nome…"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full"
                  />
                  {searchResults.length > 0 && (
                    <div className="mt-1 max-h-40 overflow-y-auto rounded-card border border-border bg-surface">
                      {searchResults.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => addUser(u)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-sunken"
                        >
                          <Avatar name={u.fullName} url={u.avatarUrl ?? undefined} size="sm" />
                          {u.fullName}
                        </button>
                      ))}
                    </div>
                  )}
                </FormField>
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map((u) => (
                    <Badge key={u.id} intent="info" className="gap-1">
                      {u.fullName}
                      <button type="button" onClick={() => setSelectedUsers((p) => p.filter((s) => s.id !== u.id))}>
                        <X size={12} strokeWidth={2} />
                      </button>
                    </Badge>
                  ))}
                </div>
                <DepartmentUserPicker
                  label="Avaliador principal"
                  htmlFor="ne-primary-eval"
                  value={primaryEvaluator}
                  onChange={setPrimaryEvaluator}
                />
                <DepartmentUserPicker
                  label="Avaliador secundário (opcional)"
                  htmlFor="ne-secondary-eval"
                  value={secondaryEvaluator}
                  onChange={setSecondaryEvaluator}
                />
              </>
            )}
            {populationType !== 'GROUP' && (
              <p className="text-xs text-ink-faint">
                A atribuição de avaliadores segue a hierarquia (gestor directo) quando o ciclo for
                activado em &quot;Ciclos de Avaliação&quot;.
              </p>
            )}
          </div>
        )}

        {current.id === 'structure' && (
          <div className="space-y-4">
            <FormField label="Modelo" htmlFor="ne-model">
              <Select items={MODEL_ITEMS} value={model} onValueChange={setModel} className="w-full" />
            </FormField>
            <div>
              <p className="mb-2 text-sm font-medium text-ink">Blocos</p>
              <div className="flex flex-wrap gap-2">
                {BLOCK_OPTIONS.map((b) => (
                  <button
                    key={b.value}
                    type="button"
                    onClick={() => toggleBlock(b.value)}
                    className={
                      'rounded-pill border px-3 py-1.5 text-xs transition-colors ' +
                      (blocks.includes(b.value)
                        ? 'border-primary bg-primary-subtle text-primary'
                        : 'border-border bg-surface text-ink-muted')
                    }
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {current.id === 'criteria' && (
          <div className="space-y-2">
            <p className="text-xs text-ink-faint mb-2">Escolhe os critérios e o peso (%) de cada um.</p>
            {(criteriaList ?? []).map((c) => (
              <div key={c.id} className="flex items-center gap-3">
                <label className="flex-1 text-sm text-ink-muted">{c.name}</label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={criteriaWeights[c.id] ?? ''}
                  onChange={(e) =>
                    setCriteriaWeights((prev) => ({ ...prev, [c.id]: Number(e.target.value) || 0 }))
                  }
                  className="w-24"
                  placeholder="0"
                />
              </div>
            ))}
            {(criteriaList ?? []).length === 0 && (
              <p className="text-sm text-ink-faint">Sem critérios cadastrados ainda.</p>
            )}
          </div>
        )}

        {current.id === 'scale' && (
          <FormField label="Escala de avaliação" htmlFor="ne-scale">
            <Select
              items={(scalesList ?? []).map((s) => ({
                value: String(s.id),
                label: `${s.name} (${s.minValue}–${s.maxValue})`,
              }))}
              value={scaleId}
              onValueChange={setScaleId}
              placeholder="Usar escala por omissão"
              className="w-full"
            />
          </FormField>
        )}

        {current.id === 'objectives' && (
          <div className="space-y-3">
            {populationType !== 'GROUP' ? (
              <p className="text-sm text-ink-faint">
                Objectivos individuais só ficam disponíveis quando o âmbito é &quot;Grupo de
                colaboradores&quot; (etapa Participantes) — para Departamento/Unidade/Todos, define
                objectivos depois, por colaborador, em &quot;Avaliações&quot;.
              </p>
            ) : (
              <>
                <Button size="sm" intent="secondary" onClick={() => setObjectives((p) => [...p, emptyObjective()])}>
                  <Plus size={14} strokeWidth={1.75} className="mr-1" /> Adicionar objectivo
                </Button>
                {objectives.map((o, i) => (
                  <div key={i} className="rounded-card border border-border p-3 space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Objectivo"
                        value={o.objective}
                        onChange={(e) =>
                          setObjectives((prev) => prev.map((x, idx) => (idx === i ? { ...x, objective: e.target.value } : x)))
                        }
                        className="flex-1"
                      />
                      <Button size="sm" intent="secondary" onClick={() => setObjectives((prev) => prev.filter((_, idx) => idx !== i))}>
                        <Trash2 size={14} strokeWidth={1.75} />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        placeholder="Indicador"
                        value={o.indicator ?? ''}
                        onChange={(e) =>
                          setObjectives((prev) => prev.map((x, idx) => (idx === i ? { ...x, indicator: e.target.value } : x)))
                        }
                      />
                      <Input
                        placeholder="Meta"
                        value={o.target ?? ''}
                        onChange={(e) =>
                          setObjectives((prev) => prev.map((x, idx) => (idx === i ? { ...x, target: e.target.value } : x)))
                        }
                      />
                      <Input
                        type="number"
                        placeholder="Peso %"
                        value={o.weight ?? ''}
                        onChange={(e) =>
                          setObjectives((prev) =>
                            prev.map((x, idx) => (idx === i ? { ...x, weight: Number(e.target.value) || undefined } : x)),
                          )
                        }
                      />
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {current.id === 'selfEval' && (
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm text-ink">
              <input type="checkbox" checked={allowSelfEval} onChange={(e) => setAllowSelfEval(e.target.checked)} />
              Permitir autoavaliação
            </label>
            {allowSelfEval && (
              <FormField label="Prazo da autoavaliação" htmlFor="ne-self-due">
                <Input
                  id="ne-self-due"
                  type="date"
                  value={selfEvalDueDate}
                  onChange={(e) => setSelfEvalDueDate(e.target.value)}
                  className="w-full"
                />
              </FormField>
            )}
            <label className="flex items-center gap-2 text-sm text-ink">
              <input type="checkbox" checked={requireComments} onChange={(e) => setRequireComments(e.target.checked)} />
              Comentários obrigatórios
            </label>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input type="checkbox" checked={requireEvidence} onChange={(e) => setRequireEvidence(e.target.checked)} />
              Exigir evidências
            </label>
          </div>
        )}

        {current.id === 'flow' && (
          <div className="space-y-4">
            <p className="text-xs text-ink-faint">
              Fluxo: Autoavaliação → Avaliação do gestor → Revisão RH → Calibração → Conversa 1:1 →
              Aprovação → Resultado final.
            </p>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input type="checkbox" checked={allowCalibration} onChange={(e) => setAllowCalibration(e.target.checked)} />
              Incluir etapa de calibração
            </label>
          </div>
        )}

        <div className="mt-6 flex gap-3 border-t border-border pt-4">
          <Button intent="secondary" className="justify-center" onClick={() => (step === 0 ? onClose() : setStep((s) => s - 1))} disabled={busy}>
            {step === 0 ? 'Cancelar' : 'Voltar'}
          </Button>
          <Button className="flex-1 justify-center" onClick={advance} loading={busy} disabled={!canAdvance}>
            {isLast ? 'Criar Avaliação' : 'Continuar'}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
