// components/development-plans/CreatePlanWizard.tsx
// Assistente de 7 etapas para criar um PDI (docs/CRIAR_NOVO_PDI_ESTRUTURA_
// COMPLETA.md). Persiste incrementalmente, mesmo padrão de
// components/leadership/ProgramWizard.tsx:
//  - etapa 1 (Identificação) → POST /development-plans (cria em DRAFT,
//    devolve o id); revisitar a etapa depois de criado faz um PUT leve.
//  - etapas 2-3 (Diagnóstico, Competências) → PUT /development-plans/:id
//    (competencyGaps é substituição total — reenviar a lista toda é seguro
//    e idempotente, ver development-plans.service.ts#update).
//  - etapa 4 (Objectivos) → PUT (ligação de carreira) + POST
//    /development-plans/goals por cada meta ainda sem id.
//  - etapa 5 (Plano de acção) → POST /development-plans/actions por cada
//    acção ainda sem id.
//  - etapa 6 (Indicadores) → POST /development-plans/checkpoints por cada
//    checkpoint ainda sem id.
//  - etapa 7 (Revisão): só leitura — o PDI fica em DRAFT; submeter para
//    aprovação continua a ser feito no detalhe do plano (botão já existente
//    em DetailView), não aqui.
//
// Uma linha de meta/acção/checkpoint já persistida (tem `id`) fica bloqueada
// nesta modal — não há endpoint para editar/remover metas ou checkpoints
// isolados, só para os criar. Editar/remover depois de criado é trabalho do
// detalhe do plano (fora do âmbito desta modal).

'use client';

import { useRef, useState } from 'react';
import { AlertCircle, Check } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { reportError } from '@/lib/errorReporting';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { PlanFormSteps } from './PlanFormSteps';
import { WIZARD_STEPS } from './constants';
import type {
  ActionDraft,
  CheckpointDraft,
  CompetencyGapDraft,
  GoalDraft,
  WizardForm,
} from './types';

type ListKey = 'competencyGaps' | 'goals' | 'actions' | 'checkpoints';

// Recebem a key em vez de a gerarem — o contador vive numa ref por instância
// do wizard (ver `nextKeyRef` no componente), não a nível de módulo. Duas
// modais abertas em simultâneo (ou um hot-reload) partilhariam o mesmo
// contador módulo-a-módulo; por instância, cada wizard começa do zero e
// nunca colide consigo próprio, que é a única garantia que a key de lista
// do React precisa.
const emptyGap = (key: number): CompetencyGapDraft => ({
  key,
  id: null,
  competencyId: '',
  currentLevel: '',
  targetLevel: '',
  priority: 'MEDIUM',
});
const emptyGoal = (key: number): GoalDraft => ({
  key,
  id: null,
  title: '',
  description: '',
  successIndicator: '',
  dueDate: '',
  weight: '',
});
const emptyAction = (key: number): ActionDraft => ({
  key,
  id: null,
  title: '',
  description: '',
  type: 'COURSE',
  courseId: '',
  workloadHours: '',
  dueDate: '',
  mandatory: false,
});
const emptyCheckpoint = (key: number): CheckpointDraft => ({
  key,
  id: null,
  title: '',
  description: '',
  scheduledAt: '',
  type: 'QUICK',
});

const EMPTY_ROW: Record<
  ListKey,
  (key: number) => CompetencyGapDraft | GoalDraft | ActionDraft | CheckpointDraft
> = {
  competencyGaps: emptyGap,
  goals: emptyGoal,
  actions: emptyAction,
  checkpoints: emptyCheckpoint,
};

const EMPTY_FORM: WizardForm = {
  employee: null,
  manager: null,
  name: '',
  goal: '',
  priority: 'MEDIUM',
  period: '',
  startDate: '',
  endDate: '',
  durationPreset: '',
  origin: '',
  originJustification: '',
  strengths: '',
  developmentNeeds: '',
  competencyGaps: [],
  goals: [],
  careerLinked: false,
  careerPlanId: '',
  careerReadinessPercent: '',
  actions: [],
  checkpoints: [],
};

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

function extractMessage(e: unknown): string {
  return e instanceof Error ? e.message : 'Erro ao gravar esta etapa. Tente novamente.';
}

export interface CreatePlanWizardProps {
  onClose: () => void;
  /** Chamado com o id do plano criado, para a page navegar para o detalhe. */
  onSuccess: (planId: number) => void;
}

export function CreatePlanWizard({ onClose, onSuccess }: CreatePlanWizardProps) {
  const qc = useQueryClient();
  const notify = useToast();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<WizardForm>(EMPTY_FORM);
  const [planId, setPlanId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  // Contador de keys de rascunho por instância do wizard — ver nota em
  // EMPTY_ROW acima.
  const nextKeyRef = useRef(0);

  const current = WIZARD_STEPS[step];
  const isLast = step === WIZARD_STEPS.length - 1;

  const setField = <K extends keyof WizardForm>(key: K, value: WizardForm[K]) => {
    setForm((f) => {
      if (key === 'startDate') {
        const v = value as unknown as string;
        const next: WizardForm = { ...f, startDate: v };
        if (f.durationPreset && f.durationPreset !== 'custom' && v) {
          next.endDate = addMonths(v, Number(f.durationPreset));
        }
        return next;
      }
      if (key === 'durationPreset') {
        const v = value as unknown as string;
        const next: WizardForm = { ...f, durationPreset: v };
        if (v !== 'custom' && v !== '' && f.startDate) {
          next.endDate = addMonths(f.startDate, Number(v));
        }
        return next;
      }
      return { ...f, [key]: value };
    });
  };

  // As três funções abaixo escrevem num campo escolhido em runtime (`key`) —
  // TS não consegue verificar por chave individual que o array resultante
  // bate com o tipo declarado de cada campo (CompetencyGapDraft[] vs
  // GoalDraft[] vs...), por isso o cast final `as WizardForm` (mesmo padrão
  // de components/leadership/ProgramWizard.tsx). Quem garante a forma certa
  // por linha são EMPTY_ROW (criação) e o próprio formulário (edição campo a
  // campo via `patch`).
  const addRow = (key: ListKey) =>
    setForm(
      (f) =>
        ({
          ...f,
          [key]: [...(f[key] as unknown[]), EMPTY_ROW[key](nextKeyRef.current++)],
        }) as WizardForm,
    );
  const removeRow = (key: ListKey, index: number) =>
    setForm(
      (f) =>
        ({ ...f, [key]: (f[key] as unknown[]).filter((_, i) => i !== index) }) as WizardForm,
    );
  const setRow = (key: ListKey, index: number, patch: Record<string, unknown>) =>
    setForm(
      (f) =>
        ({
          ...f,
          [key]: (f[key] as unknown as Array<Record<string, unknown>>).map((row, i) =>
            i === index ? { ...row, ...patch } : row,
          ),
        }) as WizardForm,
    );

  // ─── Validação por etapa (bloqueia "Continuar") ────────────────────────
  const stepIssues = (): string[] => {
    switch (current.id) {
      case 'identification': {
        const missing: string[] = [];
        if (!form.employee) missing.push('colaborador');
        if (!form.name.trim()) missing.push('título');
        if (!form.goal.trim()) missing.push('objectivo geral');
        return missing.length ? [`Falta preencher: ${missing.join(', ')}`] : [];
      }
      case 'competencies':
        return form.competencyGaps.some((g) => !g.competencyId)
          ? ['cada competência adicionada precisa de ser escolhida']
          : [];
      case 'objectives':
        return form.goals.some((g) => g.id === null && !g.title.trim())
          ? ['cada objectivo precisa de um nome']
          : [];
      case 'actionPlan':
        return form.actions.some((a) => a.id === null && !a.title.trim())
          ? ['cada acção precisa de um nome']
          : [];
      case 'tracking':
        return form.checkpoints.some((c) => c.id === null && (!c.title.trim() || !c.scheduledAt))
          ? ['cada checkpoint precisa de título e data']
          : [];
      default:
        return [];
    }
  };
  const currentIssues = stepIssues();
  const canAdvance = currentIssues.length === 0;

  // ─── Persistência ───────────────────────────────────────────────────────

  const createPlan = async (): Promise<number> => {
    if (!form.employee) throw new Error('Colaborador não seleccionado.');
    const created = await apiClient.post<{ id: number }>('/development-plans', {
      userId: form.employee.id,
      name: form.name.trim(),
      goal: form.goal.trim(),
      managerId: form.manager?.id,
      priority: form.priority,
      period: form.period.trim() || undefined,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
    });
    setPlanId(created.id);
    return created.id;
  };

  const putIdentification = (id: number) =>
    apiClient.put(`/development-plans/${id}`, {
      name: form.name.trim(),
      goal: form.goal.trim(),
      managerId: form.manager?.id,
      priority: form.priority,
      period: form.period.trim() || undefined,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
    });

  const putDiagnosis = (id: number) =>
    apiClient.put(`/development-plans/${id}`, {
      origin: form.origin || undefined,
      originJustification: form.originJustification.trim() || undefined,
      strengths: form.strengths.trim() || undefined,
      developmentNeeds: form.developmentNeeds.trim() || undefined,
    });

  const putCompetencyGaps = (id: number) =>
    apiClient.put(`/development-plans/${id}`, {
      competencyGaps: form.competencyGaps
        .filter((g) => g.competencyId)
        .map((g) => ({
          competencyId: Number(g.competencyId),
          currentLevel: g.currentLevel.trim() ? Number(g.currentLevel) : undefined,
          targetLevel: g.targetLevel.trim() ? Number(g.targetLevel) : undefined,
          priority: g.priority,
        })),
    });

  const putCareerLink = (id: number) =>
    apiClient.put(`/development-plans/${id}`, {
      careerPlanId:
        form.careerLinked && form.careerPlanId.trim() ? Number(form.careerPlanId) : undefined,
      careerReadinessPercent:
        form.careerLinked && form.careerReadinessPercent.trim()
          ? Number(form.careerReadinessPercent)
          : undefined,
    });

  const persistNewGoals = async (id: number) => {
    const updated = await Promise.all(
      form.goals.map(async (g) => {
        if (g.id !== null || !g.title.trim()) return g;
        const created = await apiClient.post<{ id: number }>('/development-plans/goals', {
          planId: id,
          title: g.title.trim(),
          description: g.description.trim() || undefined,
          successIndicator: g.successIndicator.trim() || undefined,
          dueDate: g.dueDate || undefined,
          weight: g.weight.trim() ? Number(g.weight) : undefined,
        });
        return { ...g, id: created.id };
      }),
    );
    setForm((f) => ({ ...f, goals: updated }));
  };

  const persistNewActions = async (id: number) => {
    const updated = await Promise.all(
      form.actions.map(async (a, seq) => {
        if (a.id !== null || !a.title.trim()) return a;
        const created = await apiClient.post<{ id: number }>('/development-plans/actions', {
          planId: id,
          title: a.title.trim(),
          description: a.description.trim() || undefined,
          type: a.type,
          courseId: a.courseId.trim() ? Number(a.courseId) : undefined,
          workloadHours: a.workloadHours.trim() ? Number(a.workloadHours) : undefined,
          dueDate: a.dueDate || undefined,
          mandatory: a.mandatory,
          seq,
        });
        return { ...a, id: created.id };
      }),
    );
    setForm((f) => ({ ...f, actions: updated }));
  };

  const persistNewCheckpoints = async (id: number) => {
    const updated = await Promise.all(
      form.checkpoints.map(async (c) => {
        if (c.id !== null || !c.title.trim() || !c.scheduledAt) return c;
        const created = await apiClient.post<{ id: number }>('/development-plans/checkpoints', {
          planId: id,
          title: c.title.trim(),
          description: c.description.trim() || undefined,
          scheduledAt: c.scheduledAt,
          type: c.type,
        });
        return { ...c, id: created.id };
      }),
    );
    setForm((f) => ({ ...f, checkpoints: updated }));
  };

  /** Grava a etapa actual (linear ou por salto). Devolve o id do plano. */
  const persistCurrent = async (): Promise<number | null> => {
    if (current.id === 'identification') {
      if (planId) {
        await putIdentification(planId);
        return planId;
      }
      return createPlan();
    }
    if (!planId) return null; // não deveria acontecer — etapa 1 sempre cria primeiro
    switch (current.id) {
      case 'diagnosis':
        await putDiagnosis(planId);
        break;
      case 'competencies':
        await putCompetencyGaps(planId);
        break;
      case 'objectives':
        await putCareerLink(planId);
        await persistNewGoals(planId);
        break;
      case 'actionPlan':
        await persistNewActions(planId);
        break;
      case 'tracking':
        await persistNewCheckpoints(planId);
        break;
    }
    return planId;
  };

  const goToStep = async (target: number) => {
    if (busy || target === step) return;
    if (target > 0 && !planId && step !== 0) return;
    setError('');
    setBusy(true);
    try {
      if (canAdvance) await persistCurrent();
      setStep(target);
    } catch (e) {
      reportError(e, { source: 'CreatePlanWizard.goToStep' });
      setError(extractMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const advance = async () => {
    if (busy || !canAdvance) return;
    setBusy(true);
    setError('');
    try {
      const id = await persistCurrent();
      if (isLast) {
        qc.invalidateQueries({ queryKey: queryKeys.developmentPlans.all });
        notify({ title: 'PDI criado — fica em Rascunho até ser submetido', intent: 'success' });
        if (id) onSuccess(id);
        onClose();
        return;
      }
      setStep((s) => s + 1);
    } catch (e) {
      reportError(e, { source: 'CreatePlanWizard.advance' });
      setError(extractMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Novo PDI"
        description={`Etapa ${step + 1} de ${WIZARD_STEPS.length} — ${current.label}`}
        className="max-h-[90vh] max-w-2xl overflow-y-auto"
      >
        <ol className="mt-4 mb-1 flex flex-wrap gap-1">
          {WIZARD_STEPS.map((s, i) => {
            const reachable = i === 0 || Boolean(planId);
            const isCurrent = i === step;
            const done = i < step;
            const cls = isCurrent
              ? 'bg-primary text-canvas ring-2 ring-primary/40'
              : done
                ? 'bg-success text-canvas'
                : 'bg-surface-sunken text-ink-faint';
            return (
              <li key={s.id}>
                <button
                  type="button"
                  disabled={!reachable || busy}
                  onClick={() => goToStep(i)}
                  title={`${i + 1}. ${s.label}`}
                  className={
                    'flex h-6 w-6 items-center justify-center rounded-full font-body text-[11px] ' +
                    'transition-colors disabled:cursor-not-allowed disabled:opacity-40 ' +
                    cls
                  }
                >
                  {done && !isCurrent ? <Check size={12} strokeWidth={2.5} /> : i + 1}
                </button>
              </li>
            );
          })}
        </ol>
        <p className="mb-5 font-body text-[11px] text-ink-faint">
          {planId
            ? 'Clique numa etapa já concluída para lá voltar.'
            : 'Preencha a Identificação para criar o PDI em Rascunho.'}
        </p>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-card bg-danger-subtle p-3 font-body text-sm text-danger-ink">
            <AlertCircle size={16} strokeWidth={1.75} />
            {error}
          </div>
        )}

        <PlanFormSteps
          stepId={current.id}
          form={form}
          setField={setField}
          addRow={addRow}
          removeRow={removeRow}
          setRow={setRow}
        />

        <div className="mt-6 flex gap-3 border-t border-border pt-4">
          <Button
            intent="secondary"
            className="justify-center"
            onClick={() => (step === 0 ? onClose() : setStep((s) => s - 1))}
            disabled={busy}
          >
            {step === 0 ? 'Cancelar' : 'Voltar'}
          </Button>
          <Button
            className="flex-1 justify-center"
            onClick={advance}
            loading={busy}
            disabled={!canAdvance}
          >
            {isLast ? 'Criar PDI' : 'Continuar'}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
