// components/live-classes/wizard/NewLiveClassSteps.tsx
// Campos de cada etapa do assistente "Nova Aula" (docs/aulas-ao-vivo.md
// secção 3, etapas 1-9). Sem estado próprio — recebe `form`/`setField` do
// CreateLiveClassWizard. Mesmo padrão de
// components/development-plans/PlanFormSteps.tsx.

'use client';

import { Combobox } from '@/components/ui/Combobox';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import {
  ENROLLMENT_MODE_CFG,
  RECURRENCE_CFG,
  TYPE_CFG,
  WEEKDAY_ITEMS,
} from '../constants';
import {
  useCourseModules,
  useCourseOptions,
  useDepartmentOptions,
  useInstructorOptions,
  usePositionOptions,
  useUnitOptions,
} from './wizardData';
import type { WizardStepId } from '../constants';
import type { WizardForm } from './wizardTypes';

const TYPE_ITEMS = Object.entries(TYPE_CFG).map(([value, cfg]) => ({ value, label: cfg.label }));
const RECURRENCE_ITEMS = Object.entries(RECURRENCE_CFG).map(([value, cfg]) => ({ value, label: cfg.label }));
const ENROLLMENT_MODE_ITEMS = Object.entries(ENROLLMENT_MODE_CFG).map(([value, cfg]) => ({
  value,
  label: cfg.label,
}));
const MODALITY_ITEMS = [
  { value: 'ONLINE', label: 'Online' },
  { value: 'PRESENTIAL', label: 'Presencial' },
  { value: 'HYBRID', label: 'Híbrida' },
];

function toggleId(list: number[], id: number): number[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

export interface NewLiveClassStepsProps {
  stepId: WizardStepId;
  form: WizardForm;
  setField: <K extends keyof WizardForm>(key: K, value: WizardForm[K]) => void;
}

export function NewLiveClassSteps({ stepId, form, setField }: NewLiveClassStepsProps) {
  const { options: courseOptions } = useCourseOptions();
  const { options: instructorOptions } = useInstructorOptions();
  const modules = useCourseModules(form.courseId);
  const departmentOptions = useDepartmentOptions();
  const unitOptions = useUnitOptions();
  const positionOptions = usePositionOptions();

  if (stepId === 'general') {
    const lessonOptions = modules.find((m) => String(m.id) === form.moduleId)?.lessons ?? [];
    return (
      <div className="space-y-4">
        <FormField label="Curso *" htmlFor="lc-course">
          <Combobox
            items={courseOptions}
            value={form.courseId}
            onValueChange={(v) => {
              setField('courseId', v);
              setField('moduleId', '');
              setField('lessonId', '');
            }}
            placeholder="Selecionar curso…"
            searchPlaceholder="Escreva para filtrar…"
          />
        </FormField>
        <FormField label="Título da aula *" htmlFor="lc-topic">
          <Input id="lc-topic" value={form.topic} onChange={(e) => setField('topic', e.target.value)} className="w-full" />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Código" htmlFor="lc-code" hint="Opcional — gerado automaticamente se vazio.">
            <Input id="lc-code" value={form.code} onChange={(e) => setField('code', e.target.value)} className="w-full" />
          </FormField>
          <FormField label="Tipo de sessão" htmlFor="lc-type">
            <Select items={TYPE_ITEMS} value={form.type} onValueChange={(v) => setField('type', v as WizardForm['type'])} className="w-full" />
          </FormField>
        </div>
        <FormField label="Descrição" htmlFor="lc-description">
          <Textarea id="lc-description" value={form.description} onChange={(e) => setField('description', e.target.value)} rows={2} className="w-full resize-none" />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Módulo associado" htmlFor="lc-module" hint={!form.courseId ? 'Escolhe primeiro um curso.' : undefined}>
            <Select
              items={[{ value: '', label: '—' }, ...modules.map((m) => ({ value: String(m.id), label: m.title }))]}
              value={form.moduleId}
              onValueChange={(v) => {
                setField('moduleId', v);
                setField('lessonId', '');
              }}
              className="w-full"
            />
          </FormField>
          <FormField label="Lição associada" htmlFor="lc-lesson" hint={!form.moduleId ? 'Escolhe primeiro um módulo.' : undefined}>
            <Select
              items={[{ value: '', label: '—' }, ...lessonOptions.map((l) => ({ value: String(l.id), label: l.title }))]}
              value={form.lessonId}
              onValueChange={(v) => setField('lessonId', v)}
              className="w-full"
            />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Formador" htmlFor="lc-instructor">
            <Combobox
              items={instructorOptions}
              value={form.instructorId}
              onValueChange={(v) => setField('instructorId', v)}
              placeholder="Selecionar formador…"
              searchPlaceholder="Escreva para filtrar…"
            />
          </FormField>
          <FormField label="Co-formador" htmlFor="lc-coinstructor">
            <Combobox
              items={instructorOptions}
              value={form.coInstructorId}
              onValueChange={(v) => setField('coInstructorId', v)}
              placeholder="Selecionar co-formador…"
              searchPlaceholder="Escreva para filtrar…"
            />
          </FormField>
        </div>
      </div>
    );
  }

  if (stepId === 'schedule') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Data e hora de início *" htmlFor="lc-scheduled">
            <Input id="lc-scheduled" type="datetime-local" value={form.scheduledAt} onChange={(e) => setField('scheduledAt', e.target.value)} className="w-full" />
          </FormField>
          <FormField label="Duração (min) *" htmlFor="lc-duration">
            <Input id="lc-duration" type="number" min={1} value={form.duration} onChange={(e) => setField('duration', e.target.value)} className="w-full" />
          </FormField>
        </div>
        <FormField label="Fuso horário" htmlFor="lc-timezone">
          <Input id="lc-timezone" value={form.timezone} onChange={(e) => setField('timezone', e.target.value)} className="w-full" />
        </FormField>
        <FormField label="Recorrência" htmlFor="lc-recurrence">
          <Select items={RECURRENCE_ITEMS} value={form.recurrence} onValueChange={(v) => setField('recurrence', v as WizardForm['recurrence'])} className="w-full" />
        </FormField>
        {form.recurrence !== 'ONCE' && (
          <>
            <FormField label="Data final da recorrência *" htmlFor="lc-recurrence-end">
              <Input id="lc-recurrence-end" type="date" value={form.recurrenceEndDate} onChange={(e) => setField('recurrenceEndDate', e.target.value)} className="w-full" />
            </FormField>
            <FormField label="Dias da semana" htmlFor="lc-weekdays" hint="Opcional — em branco usa o dia da data de início.">
              <div className="flex flex-wrap gap-2">
                {WEEKDAY_ITEMS.map((d) => {
                  const active = form.recurrenceDaysOfWeek.includes(d.value);
                  return (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() =>
                        setField(
                          'recurrenceDaysOfWeek',
                          active
                            ? form.recurrenceDaysOfWeek.filter((v) => v !== d.value)
                            : [...form.recurrenceDaysOfWeek, d.value],
                        )
                      }
                      className={`rounded-control border px-3 py-1.5 text-xs font-medium ${
                        active ? 'border-primary bg-primary-subtle text-primary' : 'border-border text-ink-muted'
                      }`}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </FormField>
          </>
        )}
      </div>
    );
  }

  if (stepId === 'modality') {
    return (
      <div className="space-y-4">
        <FormField label="Modalidade" htmlFor="lc-modality">
          <Select items={MODALITY_ITEMS} value={form.modality} onValueChange={(v) => setField('modality', v as WizardForm['modality'])} className="w-full" />
        </FormField>
        {form.modality !== 'PRESENTIAL' && (
          <FormField label="Link/ID da reunião" htmlFor="lc-zoom" hint="Sala Jitsi própria da plataforma é criada automaticamente; usa este campo só para um link/ID externo.">
            <Input id="lc-zoom" value={form.zoomMeetingId} onChange={(e) => setField('zoomMeetingId', e.target.value)} className="w-full" />
          </FormField>
        )}
        {form.modality !== 'ONLINE' && (
          <div className="grid grid-cols-3 gap-3">
            <FormField label="Local" htmlFor="lc-location">
              <Input id="lc-location" value={form.location} onChange={(e) => setField('location', e.target.value)} className="w-full" />
            </FormField>
            <FormField label="Edifício" htmlFor="lc-building">
              <Input id="lc-building" value={form.building} onChange={(e) => setField('building', e.target.value)} className="w-full" />
            </FormField>
            <FormField label="Sala" htmlFor="lc-room">
              <Input id="lc-room" value={form.room} onChange={(e) => setField('room', e.target.value)} className="w-full" />
            </FormField>
          </div>
        )}
        {form.modality !== 'ONLINE' && (
          <FormField label="Capacidade" htmlFor="lc-capacity">
            <Input id="lc-capacity" type="number" min={0} value={form.capacity} onChange={(e) => setField('capacity', e.target.value)} className="w-full max-w-[180px]" />
          </FormField>
        )}
      </div>
    );
  }

  if (stepId === 'participants') {
    return (
      <div className="space-y-4">
        <FormField label="Inscrição" htmlFor="lc-enrollment">
          <Select items={ENROLLMENT_MODE_ITEMS} value={form.enrollmentMode} onValueChange={(v) => setField('enrollmentMode', v as WizardForm['enrollmentMode'])} className="w-full" />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Limite de participantes" htmlFor="lc-max" hint="Vazio = sem limite.">
            <Input id="lc-max" type="number" min={0} value={form.maxParticipants} onChange={(e) => setField('maxParticipants', e.target.value)} className="w-full" />
          </FormField>
          <FormField label=" " htmlFor="lc-waitlist">
            <label className="flex items-center gap-2 pt-2 text-sm text-ink">
              <input id="lc-waitlist" type="checkbox" checked={form.waitlistEnabled} onChange={(e) => setField('waitlistEnabled', e.target.checked)} />
              Lista de espera
            </label>
          </FormField>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <FormField label="Unidades abrangidas" htmlFor="lc-units">
            <div className="max-h-32 space-y-1 overflow-y-auto rounded-control border border-border p-2">
              {unitOptions.length === 0 && <p className="text-xs text-ink-faint">Sem unidades.</p>}
              {unitOptions.map((u) => (
                <label key={u.id} className="flex items-center gap-2 text-xs text-ink-muted">
                  <input type="checkbox" checked={form.targetUnitIds.includes(u.id)} onChange={() => setField('targetUnitIds', toggleId(form.targetUnitIds, u.id))} />
                  {u.name}
                </label>
              ))}
            </div>
          </FormField>
          <FormField label="Departamentos abrangidos" htmlFor="lc-departments">
            <div className="max-h-32 space-y-1 overflow-y-auto rounded-control border border-border p-2">
              {departmentOptions.length === 0 && <p className="text-xs text-ink-faint">Sem departamentos.</p>}
              {departmentOptions.map((d) => (
                <label key={d.id} className="flex items-center gap-2 text-xs text-ink-muted">
                  <input type="checkbox" checked={form.targetDeptIds.includes(d.id)} onChange={() => setField('targetDeptIds', toggleId(form.targetDeptIds, d.id))} />
                  {d.name}
                </label>
              ))}
            </div>
          </FormField>
          <FormField label="Cargos abrangidos" htmlFor="lc-positions">
            <div className="max-h-32 space-y-1 overflow-y-auto rounded-control border border-border p-2">
              {positionOptions.length === 0 && <p className="text-xs text-ink-faint">Sem cargos.</p>}
              {positionOptions.map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-xs text-ink-muted">
                  <input type="checkbox" checked={form.targetPositionIds.includes(p.id)} onChange={() => setField('targetPositionIds', toggleId(form.targetPositionIds, p.id))} />
                  {p.name}
                </label>
              ))}
            </div>
          </FormField>
        </div>
      </div>
    );
  }

  if (stepId === 'content') {
    return (
      <div className="space-y-4">
        <FormField label="Objetivos da aula" htmlFor="lc-objectives">
          <Textarea id="lc-objectives" value={form.objectives} onChange={(e) => setField('objectives', e.target.value)} rows={2} className="w-full resize-none" />
        </FormField>
        <FormField label="Agenda" htmlFor="lc-agenda">
          <Textarea id="lc-agenda" value={form.agenda} onChange={(e) => setField('agenda', e.target.value)} rows={3} className="w-full resize-none" />
        </FormField>
        <FormField label="Tópicos" htmlFor="lc-topics" hint="Separados por vírgula.">
          <Input id="lc-topics" value={form.topics} onChange={(e) => setField('topics', e.target.value)} className="w-full" placeholder="Ex.: Introdução, Casos práticos, Perguntas" />
        </FormField>
        <FormField label="Materiais da Biblioteca" htmlFor="lc-materials" hint="IDs de documentos, separados por vírgula.">
          <Input id="lc-materials" value={form.materialDocumentIds} onChange={(e) => setField('materialDocumentIds', e.target.value)} className="w-full" />
        </FormField>
      </div>
    );
  }

  if (stepId === 'attendance') {
    return (
      <div className="space-y-4">
        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" checked={form.attendanceAutoRegister} onChange={(e) => setField('attendanceAutoRegister', e.target.checked)} />
          Registo automático de presença (ao entrar na sala)
        </label>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" checked={form.attendanceRequired} onChange={(e) => setField('attendanceRequired', e.target.checked)} />
          Presença obrigatória
        </label>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Percentagem mínima de presença" htmlFor="lc-min-attendance" hint="Regra: Presente = tempo participado ÷ duração × 100 ≥ este valor.">
            <Input id="lc-min-attendance" type="number" min={0} max={100} value={form.minAttendancePercent} onChange={(e) => setField('minAttendancePercent', e.target.value)} className="w-full" />
          </FormField>
          <FormField label="Tolerância de atraso (min)" htmlFor="lc-late-tolerance">
            <Input id="lc-late-tolerance" type="number" min={0} value={form.lateToleranceMinutes} onChange={(e) => setField('lateToleranceMinutes', e.target.value)} className="w-full" />
          </FormField>
        </div>
      </div>
    );
  }

  if (stepId === 'recording') {
    return (
      <div className="space-y-4">
        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" checked={form.recordSession} onChange={(e) => setField('recordSession', e.target.checked)} />
          Gravar sessão
        </label>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" checked={form.allowRecordingDownload} onChange={(e) => setField('allowRecordingDownload', e.target.checked)} />
          Permitir download da gravação
        </label>
        <FormField label="Data de expiração da gravação" htmlFor="lc-recording-expires" hint="Opcional.">
          <Input id="lc-recording-expires" type="date" value={form.recordingExpiresAt} onChange={(e) => setField('recordingExpiresAt', e.target.value)} className="w-full max-w-[220px]" />
        </FormField>
      </div>
    );
  }

  if (stepId === 'evaluation') {
    return (
      <div className="space-y-4">
        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" checked={form.evaluationRequired} onChange={(e) => setField('evaluationRequired', e.target.checked)} />
          Avaliação pós-aula obrigatória
        </label>
        <p className="text-xs text-ink-faint">
          A avaliação pós-aula é criada a partir do detalhe da aula depois de esta se realizar.
        </p>
      </div>
    );
  }

  // notifications
  const NOTIFY_ITEMS: { key: keyof WizardForm; label: string }[] = [
    { key: 'notifyOnEnroll', label: 'Notificação de inscrição' },
    { key: 'notifyReminder24h', label: 'Lembrete 24h antes' },
    { key: 'notifyReminder1h', label: 'Lembrete 1h antes' },
    { key: 'notifyOnStart', label: 'Notificação de início' },
    { key: 'notifyOnReschedule', label: 'Alteração de horário' },
    { key: 'notifyOnCancel', label: 'Cancelamento' },
    { key: 'notifyOnRecordingAvailable', label: 'Disponibilização da gravação' },
  ];
  return (
    <div className="space-y-3">
      <p className="text-xs text-ink-faint">
        Os lembretes temporizados (24h/1h antes) ainda não têm um agendador — as restantes notificações são
        enviadas quando a acção correspondente acontece (adiar/cancelar).
      </p>
      {NOTIFY_ITEMS.map((item) => (
        <label key={item.key} className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={form[item.key] as boolean}
            onChange={(e) => setField(item.key, e.target.checked as WizardForm[typeof item.key])}
          />
          {item.label}
        </label>
      ))}
    </div>
  );
}
