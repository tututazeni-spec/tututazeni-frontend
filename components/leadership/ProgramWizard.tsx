// components/leadership/ProgramWizard.tsx
// Assistente de 16 etapas para criar/configurar um programa de liderança
// (spec § "Interface"). Persiste incrementalmente:
//  - etapa 1 → POST /leadership/programs (cria em DRAFT, devolve o id)
//  - etapas escalares → PUT /leadership/programs/:id
//  - bloco de configuração → PUT /leadership/programs/:id/configuration (uma
//    única chamada replace-all ao sair da última etapa de configuração)
//
// "Continuar" fica bloqueado enquanto a etapa atual for inválida (ex.: etapa 1
// sem código/nome/nível; critérios de seleção cujos pesos ativos não somam
// 100). O backend valida sempre role + ownership + regras — a UI é só um guia.

'use client';

import { useMemo, useState } from 'react';
import { AlertCircle, Check } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { ProgramFormSteps } from './ProgramFormSteps';
import { WIZARD_STEPS } from './constants';
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

  const canAdvance = useMemo(() => {
    switch (current.id) {
      case 'identity':
        return Boolean(form.code.trim() && form.name.trim() && form.level);
      case 'selection': {
        const active = form.selectionCriteria;
        if (active.length === 0) return true;
        if (active.some((c) => !c.name.trim() || !c.source)) return false;
        return Math.abs(sum(active.map((c) => c.weight)) - 100) < 0.01;
      }
      case 'methodologies': {
        const weighted = form.methodologies.filter((m) => m.weight.trim() !== '');
        if (weighted.length === 0) return true;
        return Math.abs(sum(form.methodologies.map((m) => m.weight)) - 100) < 0.01;
      }
      case 'competencies':
        return form.competencies.every((c) => c.competencyId.trim() && c.targetLevel.trim());
      default:
        return true;
    }
  }, [current.id, form]);

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

  const persistStep = async (): Promise<void> => {
    if (current.persist === 'create') {
      if (programId) return;
      const created = await apiClient.post<{ id: number }>('/leadership/programs', {
        code: form.code.trim(),
        name: form.name.trim(),
        level: form.level,
        description: form.description.trim() || undefined,
      });
      setProgramId(created.id);
      return;
    }
    if (!programId) return;
    if (current.persist === 'scalars') {
      await apiClient.put(`/leadership/programs/${programId}`, scalarPayload());
      return;
    }
    if (current.persist === 'config') {
      const nextIsConfig = WIZARD_STEPS[step + 1]?.persist === 'config';
      if (!nextIsConfig) {
        await apiClient.put(
          `/leadership/programs/${programId}/configuration`,
          configPayload(),
        );
      }
    }
  };

  const advance = async () => {
    if (busy || !canAdvance) return;
    setBusy(true);
    setError('');
    try {
      await persistStep();
      if (isLast) {
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
        <ol className="mt-4 mb-5 flex flex-wrap gap-1">
          {WIZARD_STEPS.map((s, i) => (
            <li
              key={s.id}
              className={
                'flex h-6 w-6 items-center justify-center rounded-full font-body text-[11px] ' +
                (i < step
                  ? 'bg-success text-canvas'
                  : i === step
                    ? 'bg-primary text-canvas'
                    : 'bg-surface-sunken text-ink-faint')
              }
              title={s.label}
            >
              {i < step ? <Check size={12} strokeWidth={2.5} /> : i + 1}
            </li>
          ))}
        </ol>

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
