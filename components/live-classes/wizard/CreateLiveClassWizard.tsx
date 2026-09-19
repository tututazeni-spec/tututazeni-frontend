// components/live-classes/wizard/CreateLiveClassWizard.tsx
// Assistente "Nova Aula" de 9 etapas (docs/aulas-ao-vivo.md secção 3).
// Ao contrário do CreatePlanWizard (development-plans), aqui um único
// POST /live-classes no fim aceita o formulário completo — não há
// persistência incremental por etapa, só navegação + validação local.

'use client';

import { useState } from 'react';
import { AlertCircle, Check } from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { reportError } from '@/lib/errorReporting';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { WIZARD_STEPS } from '../constants';
import { NewLiveClassSteps } from './NewLiveClassSteps';
import { EMPTY_WIZARD_FORM, type WizardForm } from './wizardTypes';

export interface CreateLiveClassWizardProps {
  onClose: () => void;
}

function n(value: string): number | undefined {
  if (value.trim() === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function buildPayload(form: WizardForm): Record<string, unknown> {
  return {
    courseId: n(form.courseId),
    topic: form.topic.trim(),
    code: form.code.trim() || undefined,
    description: form.description.trim() || undefined,
    type: form.type,
    moduleId: n(form.moduleId),
    lessonId: n(form.lessonId),
    instructorId: n(form.instructorId),
    coInstructorId: n(form.coInstructorId),

    scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : undefined,
    duration: n(form.duration),
    timezone: form.timezone.trim() || undefined,
    recurrence: form.recurrence,
    recurrenceEndDate:
      form.recurrence !== 'ONCE' && form.recurrenceEndDate
        ? new Date(form.recurrenceEndDate).toISOString()
        : undefined,
    recurrenceDaysOfWeek:
      form.recurrence !== 'ONCE' && form.recurrenceDaysOfWeek.length
        ? form.recurrenceDaysOfWeek.map(Number)
        : undefined,

    modality: form.modality,
    zoomMeetingId: form.zoomMeetingId.trim() || undefined,
    location: form.location.trim() || undefined,
    building: form.building.trim() || undefined,
    room: form.room.trim() || undefined,
    capacity: n(form.capacity),

    enrollmentMode: form.enrollmentMode,
    maxParticipants: n(form.maxParticipants),
    waitlistEnabled: form.waitlistEnabled,
    targetDeptIds: form.targetDeptIds.length ? form.targetDeptIds : undefined,
    targetUnitIds: form.targetUnitIds.length ? form.targetUnitIds : undefined,
    targetPositionIds: form.targetPositionIds.length ? form.targetPositionIds : undefined,

    objectives: form.objectives.trim() || undefined,
    agenda: form.agenda.trim() || undefined,
    topics: form.topics.trim()
      ? form.topics.split(',').map((t) => t.trim()).filter(Boolean)
      : undefined,
    materialDocumentIds: form.materialDocumentIds.trim()
      ? form.materialDocumentIds
          .split(',')
          .map((v) => Number(v.trim()))
          .filter((v) => Number.isFinite(v))
      : undefined,

    attendanceAutoRegister: form.attendanceAutoRegister,
    attendanceRequired: form.attendanceRequired,
    minAttendancePercent: n(form.minAttendancePercent),
    lateToleranceMinutes: n(form.lateToleranceMinutes),

    recordSession: form.recordSession,
    recordingExpiresAt: form.recordingExpiresAt ? new Date(form.recordingExpiresAt).toISOString() : undefined,
    allowRecordingDownload: form.allowRecordingDownload,

    evaluationRequired: form.evaluationRequired,

    notifySettings: {
      onEnroll: form.notifyOnEnroll,
      reminder24h: form.notifyReminder24h,
      reminder1h: form.notifyReminder1h,
      onStart: form.notifyOnStart,
      onReschedule: form.notifyOnReschedule,
      onCancel: form.notifyOnCancel,
      onRecordingAvailable: form.notifyOnRecordingAvailable,
    },
  };
}

function extractMessage(e: unknown): string {
  return e instanceof Error ? e.message : 'Erro ao criar a aula. Tente novamente.';
}

export function CreateLiveClassWizard({ onClose }: CreateLiveClassWizardProps) {
  const notify = useToast();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<WizardForm>(EMPTY_WIZARD_FORM);
  const [error, setError] = useState('');

  const current = WIZARD_STEPS[step];
  const isLast = step === WIZARD_STEPS.length - 1;

  const setField = <K extends keyof WizardForm>(key: K, value: WizardForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const createClass = useApiMutation(
    (body: Record<string, unknown>) => apiClient.post('/live-classes', body),
    {
      invalidateKeys: [queryKeys.liveClasses.all],
      onSuccess: () => {
        notify({ title: 'Aula ao vivo criada', intent: 'success' });
        onClose();
      },
      onError: (e) => setError(extractMessage(e)),
    },
  );

  // ─── Validação por etapa (bloqueia "Continuar") ────────────────────────
  const stepIssues = (): string[] => {
    switch (current.id) {
      case 'general': {
        const missing: string[] = [];
        if (!form.courseId) missing.push('curso');
        if (!form.topic.trim()) missing.push('título');
        return missing.length ? [`Falta preencher: ${missing.join(', ')}`] : [];
      }
      case 'schedule': {
        const missing: string[] = [];
        if (!form.scheduledAt) missing.push('data e hora');
        if (!form.duration || Number(form.duration) <= 0) missing.push('duração');
        if (form.recurrence !== 'ONCE' && !form.recurrenceEndDate) missing.push('data final da recorrência');
        return missing.length ? [`Falta preencher: ${missing.join(', ')}`] : [];
      }
      default:
        return [];
    }
  };
  const currentIssues = stepIssues();
  const canAdvance = currentIssues.length === 0;

  const advance = () => {
    if (!canAdvance) return;
    setError('');
    if (isLast) {
      createClass.mutate(buildPayload(form));
      return;
    }
    setStep((s) => s + 1);
  };

  const goToStep = (target: number) => {
    if (createClass.isPending || target === step || target > step) return;
    setError('');
    setStep(target);
  };

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Nova Aula ao Vivo"
        description={`Etapa ${step + 1} de ${WIZARD_STEPS.length} — ${current.label}`}
        className="max-h-[90vh] max-w-2xl overflow-y-auto"
      >
        <ol className="mt-4 mb-1 flex flex-wrap gap-1">
          {WIZARD_STEPS.map((s, i) => {
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
                  disabled={i > step || createClass.isPending}
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

        {error && (
          <div className="mb-4 mt-3 flex items-center gap-2 rounded-card bg-danger-subtle p-3 font-body text-sm text-danger-ink">
            <AlertCircle size={16} strokeWidth={1.75} />
            {error}
          </div>
        )}

        <div className="mt-4">
          <NewLiveClassSteps stepId={current.id} form={form} setField={setField} />
        </div>

        <div className="mt-6 flex gap-3 border-t border-border pt-4">
          <Button
            intent="secondary"
            className="justify-center"
            onClick={() => (step === 0 ? onClose() : setStep((s) => s - 1))}
            disabled={createClass.isPending}
          >
            {step === 0 ? 'Cancelar' : 'Voltar'}
          </Button>
          <Button
            className="flex-1 justify-center"
            onClick={advance}
            loading={createClass.isPending}
            disabled={!canAdvance}
          >
            {isLast ? 'Criar Aula' : 'Continuar'}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
