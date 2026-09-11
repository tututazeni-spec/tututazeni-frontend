// components/leadership/ProgramWizard.tsx
// Assistente de 16 etapas para criar/configurar um programa de liderança
// (spec § "Interface"). Persiste incrementalmente:
//  - etapa 1 → POST /leadership/programs (cria em DRAFT, devolve o id)
//  - etapas escalares → PUT /leadership/programs/:id
//  - bloco de configuração → PUT /leadership/programs/:id/configuration
//
// As etapas são navegáveis: depois de a etapa 1 criar o programa, qualquer
// círculo de etapa fica clicável — pode-se editar a etapa 2 e saltar para a 7.
// Ao sair de uma etapa escalar por salto, o que lá está é gravado; a
// configuração e um flush final de tudo acontecem ao "Concluir". Antes de
// concluir, o resumo lista as etapas com problemas (bloqueiam) e as etapas
// opcionais ainda por preencher (não bloqueiam) — todas clicáveis.
//
// O backend valida sempre role + ownership + regras — a UI é só um guia.

'use client';

import { useMemo, useState } from 'react';
import { AlertCircle, Check } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { ProgramFormSteps } from './ProgramFormSteps';
import { WIZARD_STEPS, type WizardStepId } from './constants';
import type { WizardForm } from './types';

const EMPTY_FORM: WizardForm = {
  code: '',
  name: '',
  level: '',
  type: '',
  corporateLevel: '',
  description: '',
  objective: '',
  mandatory: false,
  startDate: '',
  endDate: '',
  durationWeeks: '',
  workloadHours: '',
  totalSessions: '',
  modality: '',
  capacity: '',
  minParticipants: '',
  minAttendanceRate: '',
  minFinalScore: '',
  requireFinalProject: false,
  completionCriteria: '',
  certificationEnabled: false,
  certificateTitle: '',
  objectives: [],
  targeting: [],
  selectionCriteria: [],
  competencies: [],
  contents: [],
  methodologies: [],
  advisors: [],
};

const NEW_ROW = {
  objectives: { title: '', indicator: '' },
  targeting: { scope: '', description: '' },
  selectionCriteria: { name: '', source: '', weight: '' },
  competencies: { competencyId: '', targetLevel: '', weight: '' },
  contents: { contentType: '', refId: '', title: '' },
  methodologies: { type: '', weight: '' },
  advisors: { userId: '', role: '', focusArea: '' },
} satisfies Record<string, Record<string, string>>;

type ListKey = keyof typeof NEW_ROW;

export interface ProgramWizardProps {
  onClose: () => void;
  onSuccess: () => void;
}

const n = (v: string): number | undefined => {
  const x = Number(v);
  return v.trim() === '' || Number.isNaN(x) ? undefined : x;
};

const sum = (xs: string[]) => xs.reduce((s, v) => s + (Number(v) || 0), 0);
const round2 = (v: number) => Math.round(v * 100) / 100;

/** Problemas que impedem uma etapa de ser dada como válida (lista vazia = ok). */
function stepIssues(id: WizardStepId, f: WizardForm): string[] {
  switch (id) {
    case 'identity': {
      const missing: string[] = [];
      if (!f.code.trim()) missing.push('código');
      if (!f.name.trim()) missing.push('nome');
      if (!f.level) missing.push('nível');
      return missing.length ? [`Falta preencher: ${missing.join(', ')}`] : [];
    }
    case 'selection': {
      if (f.selectionCriteria.length === 0) return [];
      const out: string[] = [];
      if (f.selectionCriteria.some((c) => !c.name.trim() || !c.source)) {
        out.push('cada critério precisa de nome e fonte');
      }
      const total = sum(f.selectionCriteria.map((c) => c.weight));
      if (Math.abs(total - 100) > 0.01) {
        out.push(`os pesos têm de somar 100 (atual: ${round2(total)})`);
      }
      return out;
    }
    case 'methodologies': {
      const weighted = f.methodologies.filter((m) => m.weight.trim() !== '');
      if (weighted.length === 0) return [];
      const total = sum(f.methodologies.map((m) => m.weight));
      return Math.abs(total - 100) > 0.01
        ? [`os pesos das metodologias têm de somar 100 (atual: ${round2(total)})`]
        : [];
    }
    case 'competencies':
      return f.competencies.some((c) => !c.competencyId.trim() || !c.targetLevel.trim())
        ? ['cada competência precisa de ID e nível-alvo']
        : [];
    case 'contents':
      return f.contents.some((c) => c.contentType && !c.refId.trim())
        ? ['cada conteúdo precisa do ID/URL do seu tipo']
        : [];
    case 'advisors':
      return f.advisors.some((a) => (a.userId.trim() || a.role) && (!a.userId.trim() || !a.role))
        ? ['cada acompanhante precisa de User ID e papel']
        : [];
    default:
      return [];
  }
}

/** Heurística: a etapa foi tocada / tem conteúdo. */
function stepFilled(id: WizardStepId, f: WizardForm): boolean {
  switch (id) {
    case 'identity':
      return Boolean(f.code || f.name || f.level);
    case 'classification':
      return Boolean(f.type || f.corporateLevel || f.mandatory);
    case 'objective':
      return Boolean(f.objective.trim());
    case 'planning':
      return Boolean(f.startDate || f.endDate || f.durationWeeks || f.workloadHours);
    case 'sessions':
      return Boolean(f.totalSessions || f.modality);
    case 'capacity':
      return Boolean(f.capacity || f.minParticipants);
    case 'audience':
      return f.targeting.length > 0;
    case 'selection':
      return f.selectionCriteria.length > 0;
    case 'competencies':
      return f.competencies.length > 0;
    case 'objectives':
      return f.objectives.length > 0;
    case 'contents':
      return f.contents.length > 0;
    case 'methodologies':
      return f.methodologies.length > 0;
    case 'advisors':
      return f.advisors.length > 0;
    case 'completion':
      return Boolean(
        f.minAttendanceRate ||
          f.minFinalScore ||
          f.requireFinalProject ||
          f.completionCriteria.trim(),
      );
    case 'certification':
      return f.certificationEnabled;
    case 'review':
      return true;
  }
}

export function ProgramWizard({ onClose, onSuccess }: ProgramWizardProps) {
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<WizardForm>(EMPTY_FORM);
  const [programId, setProgramId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const current = WIZARD_STEPS[step];
  const isLast = step === WIZARD_STEPS.length - 1;

  const setField = <K extends keyof WizardForm>(key: K, value: WizardForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const addRow = (key: ListKey) =>
    setForm((f) => ({
      ...f,
      [key]: [...(f[key] as unknown[]), { ...NEW_ROW[key] }],
    }));
  const removeRow = (key: ListKey, index: number) =>
    setForm((f) => ({
      ...f,
      [key]: (f[key] as unknown[]).filter((_, i) => i !== index),
    }));
  const setRow = (key: ListKey, index: number, patch: Record<string, string>) =>
    setForm((f) => ({
      ...f,
      [key]: (f[key] as Array<Record<string, string>>).map((row, i) =>
        i === index ? { ...row, ...patch } : row,
      ),
    }));

  const currentIssues = useMemo(() => stepIssues(current.id, form), [current.id, form]);

  // Todas as etapas (menos a revisão) com problemas — bloqueiam a conclusão.
  const blockingSteps = useMemo(
    () =>
      WIZARD_STEPS.map((s, i) => ({ i, s, issues: stepIssues(s.id, form) })).filter(
        (x) => x.s.id !== 'review' && x.issues.length > 0,
      ),
    [form],
  );

  // Etapas opcionais ainda por preencher — informativas, não bloqueiam.
  const emptyOptionalSteps = useMemo(
    () =>
      WIZARD_STEPS.map((s, i) => ({ i, s })).filter(
        ({ s }) => s.id !== 'review' && !stepFilled(s.id, form) && stepIssues(s.id, form).length === 0,
      ),
    [form],
  );

  const canAdvance =
    current.id === 'review' ? blockingSteps.length === 0 : currentIssues.length === 0;

  const scalarPayload = () => ({
    name: form.name.trim(),
    description: form.description.trim() || undefined,
    objective: form.objective.trim() || undefined,
    type: form.type || undefined,
    corporateLevel: form.corporateLevel || undefined,
    mandatory: form.mandatory,
    startDate: form.startDate || undefined,
    endDate: form.endDate || undefined,
    durationWeeks: n(form.durationWeeks),
    workloadHours: n(form.workloadHours),
    totalSessions: n(form.totalSessions),
    modality: form.modality || undefined,
    capacity: n(form.capacity),
    minParticipants: n(form.minParticipants),
    minAttendanceRate: n(form.minAttendanceRate),
    minFinalScore: n(form.minFinalScore),
    requireFinalProject: form.requireFinalProject,
    completionCriteria: form.completionCriteria.trim() || undefined,
    certificationEnabled: form.certificationEnabled,
    certificateTitle: form.certificateTitle.trim() || undefined,
  });

  const configPayload = () => ({
    objectives: form.objectives
      .filter((o) => o.title.trim())
      .map((o) => ({ title: o.title.trim(), indicator: o.indicator.trim() || undefined })),
    targeting: form.targeting
      .filter((t) => t.scope)
      .map((t) => ({ scope: t.scope, description: t.description.trim() || undefined })),
    selectionCriteria: form.selectionCriteria
      .filter((c) => c.name.trim() && c.source)
      .map((c) => ({ name: c.name.trim(), source: c.source, weight: Number(c.weight) || 0 })),
    competencies: form.competencies
      .filter((c) => c.competencyId.trim())
      .map((c) => ({
        competencyId: Number(c.competencyId),
        targetLevel: Number(c.targetLevel) || 0,
        weight: n(c.weight),
      })),
    contents: form.contents
      .filter((c) => c.contentType)
      .map((c) => ({
        contentType: c.contentType,
        courseId: c.contentType === 'COURSE' ? n(c.refId) : undefined,
        learningPathId: c.contentType === 'LEARNING_PATH' ? n(c.refId) : undefined,
        microLearningId: c.contentType === 'MICRO_LEARNING' ? n(c.refId) : undefined,
        assessmentId: c.contentType === 'ASSESSMENT' ? n(c.refId) : undefined,
        externalUrl: c.contentType === 'EXTERNAL' ? c.refId.trim() || undefined : undefined,
        title: c.title.trim() || undefined,
      })),
    methodologies: form.methodologies
      .filter((m) => m.type)
      .map((m) => ({ type: m.type, weight: n(m.weight) })),
    advisors: form.advisors
      .filter((a) => a.userId.trim() && a.role)
      .map((a) => ({
        userId: Number(a.userId),
        role: a.role,
        focusArea: a.focusArea.trim() || undefined,
      })),
  });

  /** Cria o programa (etapa 1). Devolve o id novo. */
  const createProgram = async (): Promise<number> => {
    const created = await apiClient.post<{ id: number }>('/leadership/programs', {
      code: form.code.trim(),
      name: form.name.trim(),
      level: form.level,
      description: form.description.trim() || undefined,
    });
    setProgramId(created.id);
    return created.id;
  };

  const putScalars = (id: number) =>
    apiClient.put(`/leadership/programs/${id}`, scalarPayload());
  const putConfig = (id: number) =>
    apiClient.put(`/leadership/programs/${id}/configuration`, configPayload());

  /** Grava a etapa atual antes de sair dela (linear ou por salto). */
  const persistCurrent = async (): Promise<void> => {
    if (current.persist === 'create') {
      if (!programId) await createProgram();
      return;
    }
    if (!programId) return;
    if (current.persist === 'scalars') await putScalars(programId);
    // 'config' e 'review': gravados só no flush final ("Concluir").
  };

  /** Salto directo para uma etapa. */
  const goToStep = async (target: number) => {
    if (busy || target === step) return;
    // Etapas seguintes só ficam acessíveis depois de a etapa 1 criar o programa.
    if (target > 0 && !programId && step !== 0) return;
    setError('');
    setBusy(true);
    try {
      if (step === 0 && !programId) {
        if (stepIssues('identity', form).length) {
          setError('Preencha código, nome e nível antes de avançar.');
          return;
        }
        await createProgram();
      } else if (
        programId &&
        current.persist === 'scalars' &&
        currentIssues.length === 0 &&
        stepFilled(current.id, form)
      ) {
        await putScalars(programId);
      }
      setStep(target);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao gravar esta etapa.');
    } finally {
      setBusy(false);
    }
  };

  const advance = async () => {
    if (busy || !canAdvance) return;
    setBusy(true);
    setError('');
    try {
      await persistCurrent();
      if (isLast) {
        // Flush final: tudo o que foi preenchido (mesmo em etapas saltadas)
        // fica gravado.
        const id = programId ?? (await createProgram());
        await putScalars(id);
        await putConfig(id);
        qc.invalidateQueries({ queryKey: queryKeys.leadership.all });
        onSuccess();
        onClose();
        return;
      }
      setStep((s) => s + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao gravar esta etapa.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Novo programa de liderança"
        description={`Etapa ${step + 1} de ${WIZARD_STEPS.length} — ${current.label}`}
        className="max-h-[90vh] max-w-2xl overflow-y-auto"
      >
        <ol className="mt-4 mb-1 flex flex-wrap gap-1">
          {WIZARD_STEPS.map((s, i) => {
            const issues = stepIssues(s.id, form);
            const reachable = i === 0 || Boolean(programId);
            const isCurrent = i === step;
            const cls = isCurrent
              ? 'bg-primary text-canvas ring-2 ring-primary/40'
              : issues.length
                ? 'bg-danger-subtle text-danger-ink'
                : stepFilled(s.id, form)
                  ? 'bg-success text-canvas'
                  : 'bg-surface-sunken text-ink-faint';
            return (
              <li key={s.id}>
                <button
                  type="button"
                  disabled={!reachable || busy}
                  onClick={() => goToStep(i)}
                  title={`${i + 1}. ${s.label}${issues.length ? ' — ' + issues.join('; ') : ''}`}
                  className={
                    'flex h-6 w-6 items-center justify-center rounded-full font-body text-[11px] ' +
                    'transition-colors disabled:cursor-not-allowed disabled:opacity-40 ' +
                    cls
                  }
                >
                  {issues.length && !isCurrent ? (
                    '!'
                  ) : !isCurrent &&
                    s.id !== 'review' &&
                    stepFilled(s.id, form) &&
                    issues.length === 0 ? (
                    <Check size={12} strokeWidth={2.5} />
                  ) : (
                    i + 1
                  )}
                </button>
              </li>
            );
          })}
        </ol>
        <p className="mb-5 font-body text-[11px] text-ink-faint">
          Clique numa etapa para lá saltar.
        </p>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-card bg-danger-subtle p-3 font-body text-sm text-danger-ink">
            <AlertCircle size={16} strokeWidth={1.75} />
            {error}
          </div>
        )}

        <ProgramFormSteps
          stepId={current.id}
          form={form}
          setField={setField}
          addRow={addRow}
          removeRow={removeRow}
          setRow={setRow}
        />

        {current.id === 'review' && (
          <div className="mt-4 space-y-3">
            {blockingSteps.length > 0 && (
              <div className="rounded-card bg-danger-subtle p-3">
                <p className="mb-1 font-body text-sm font-semibold text-danger-ink">
                  Corrija estas etapas antes de concluir:
                </p>
                <ul className="space-y-1">
                  {blockingSteps.map(({ i, s, issues }) => (
                    <li key={s.id} className="font-body text-sm text-danger-ink">
                      <button
                        type="button"
                        onClick={() => goToStep(i)}
                        className="underline underline-offset-2"
                      >
                        {i + 1}. {s.label}
                      </button>
                      <span className="text-xs"> — {issues.join('; ')}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {emptyOptionalSteps.length > 0 && (
              <div className="rounded-card bg-surface-sunken p-3">
                <p className="mb-1.5 font-body text-sm font-medium text-ink-muted">
                  Etapas opcionais ainda por preencher:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {emptyOptionalSteps.map(({ i, s }) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => goToStep(i)}
                      className="rounded-full bg-surface px-2 py-0.5 font-body text-xs text-ink-muted hover:text-ink"
                    >
                      {i + 1}. {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {blockingSteps.length === 0 && (
              <p className="font-body text-sm text-success-ink">
                Tudo pronto — pode concluir. As etapas opcionais em falta ficam vazias.
              </p>
            )}
          </div>
        )}

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
            {isLast ? 'Concluir' : 'Continuar'}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
