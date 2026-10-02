// components/avatar-training/BuilderTab.tsx
// Construtor de Sessões (docs/Avatar_Training.md §7): dados da sessão, etapas
// (conteúdo, pergunta, cenário, exercício), gabarito e atribuição a
// colaboradores. O backend valida as etapas (chaves únicas, mínimo de opções,
// resposta correcta entre as opções) — os erros são mostrados tal como vêm.

'use client';

import { useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2, Wrench } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { QueryError } from '@/components/ui/QueryError';
import { Select } from '@/components/ui/Select';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Textarea } from '@/components/ui/Textarea';
import { EXPERIENCE_LABEL, PROGRAM_STATUS } from './constants';
import { SessionPicker, useSessionDetail } from './SessionPicker';
import type {
  AvatarProgram,
  BuilderQuestion,
  BuilderStep,
  ExperienceType,
  SessionDetail,
} from './types';

const STEP_TYPES: { value: BuilderStep['type']; label: string }[] = [
  { value: 'CONTENT', label: 'Conteúdo' },
  { value: 'QUESTION', label: 'Pergunta' },
  { value: 'SCENARIO', label: 'Cenário' },
  { value: 'EXERCISE', label: 'Exercício' },
];

const KINDS: { value: BuilderQuestion['kind']; label: string }[] = [
  { value: 'SINGLE', label: 'Escolha única' },
  { value: 'TRUE_FALSE', label: 'Verdadeiro / Falso' },
  { value: 'SHORT', label: 'Resposta curta' },
];

function StepEditor({
  step,
  index,
  total,
  onChange,
  onMove,
  onRemove,
}: {
  step: BuilderStep;
  index: number;
  total: number;
  onChange: (patch: Partial<BuilderStep>) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}) {
  const q = step.question;
  const setQ = (patch: Partial<BuilderQuestion>) =>
    onChange({ question: { kind: 'SHORT', ...q, ...patch } });

  return (
    <div className="space-y-3 rounded-card border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-ink-faint">
          Etapa {index + 1} · {step.key}
        </span>
        <div className="flex gap-1">
          <Button
            size="sm"
            intent="ghost"
            aria-label="Subir etapa"
            disabled={index === 0}
            onClick={() => onMove(-1)}
          >
            <ArrowUp size={14} />
          </Button>
          <Button
            size="sm"
            intent="ghost"
            aria-label="Descer etapa"
            disabled={index === total - 1}
            onClick={() => onMove(1)}
          >
            <ArrowDown size={14} />
          </Button>
          <Button
            size="sm"
            intent="ghost"
            aria-label="Remover etapa"
            onClick={onRemove}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormField label="Título" htmlFor={`st-title-${index}`}>
          <Input
            id={`st-title-${index}`}
            value={step.title}
            onChange={(e) => onChange({ title: e.target.value })}
          />
        </FormField>
        <FormField label="Tipo" htmlFor={`st-type-${index}`}>
          <Select
            value={step.type}
            onValueChange={(v) =>
              onChange({
                type: v as BuilderStep['type'],
                question:
                  v === 'QUESTION' ? (q ?? { kind: 'SHORT' }) : undefined,
              })
            }
            items={STEP_TYPES}
          />
        </FormField>
      </div>

      <FormField label="Texto apresentado pelo avatar" htmlFor={`st-c-${index}`}>
        <Textarea
          id={`st-c-${index}`}
          rows={3}
          value={step.content ?? ''}
          onChange={(e) => onChange({ content: e.target.value })}
        />
      </FormField>

      <FormField
        label="Recurso aprovado (URL)"
        htmlFor={`st-r-${index}`}
        hint="Slide, imagem, vídeo ou documento"
      >
        <Input
          id={`st-r-${index}`}
          value={step.resourceUrl ?? ''}
          onChange={(e) =>
            onChange({ resourceUrl: e.target.value || undefined })
          }
        />
      </FormField>

      {step.type === 'QUESTION' && q && (
        <div className="space-y-3 rounded-card bg-surface-sunken p-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label="Formato" htmlFor={`st-k-${index}`}>
              <Select
                value={q.kind}
                onValueChange={(v) => setQ({ kind: v as BuilderQuestion['kind'] })}
                items={KINDS}
              />
            </FormField>
            <FormField label="Pergunta" htmlFor={`st-p-${index}`}>
              <Input
                id={`st-p-${index}`}
                value={q.prompt ?? ''}
                onChange={(e) => setQ({ prompt: e.target.value })}
              />
            </FormField>
          </div>
          {q.kind === 'SINGLE' && (
            <FormField
              label="Opções (uma por linha, mínimo 2)"
              htmlFor={`st-o-${index}`}
            >
              <Textarea
                id={`st-o-${index}`}
                rows={3}
                value={(q.options ?? []).join('\n')}
                onChange={(e) =>
                  setQ({
                    options: e.target.value
                      .split('\n')
                      .map((o) => o.trim())
                      .filter(Boolean),
                  })
                }
              />
            </FormField>
          )}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField
              label="Resposta correcta"
              htmlFor={`st-a-${index}`}
              hint="Nunca é mostrada ao formando; vazio = sem correcção automática"
            >
              <Input
                id={`st-a-${index}`}
                value={q.correctAnswer ?? ''}
                onChange={(e) =>
                  setQ({ correctAnswer: e.target.value || undefined })
                }
              />
            </FormField>
            <FormField label="Explicação após responder" htmlFor={`st-e-${index}`}>
              <Input
                id={`st-e-${index}`}
                value={q.explanation ?? ''}
                onChange={(e) =>
                  setQ({ explanation: e.target.value || undefined })
                }
              />
            </FormField>
          </div>
        </div>
      )}
    </div>
  );
}

function AssignBox({ sessionId }: { sessionId: number }) {
  const notify = useToast();
  const [ids, setIds] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [mandatory, setMandatory] = useState(true);
  const userIds = ids
    .split(/[\s,;]+/)
    .map((x) => Number(x))
    .filter((n) => Number.isInteger(n) && n > 0);

  const assign = useApiMutation(
    () =>
      apiClient.post(`/avatar-training/sessions/${sessionId}/assign`, {
        userIds,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        mandatory,
      }),
    {
      onSuccess: () => {
        notify({ title: 'Sessão atribuída', intent: 'success' });
        setIds('');
      },
      onError: (e) =>
        notify({
          title: 'Não foi possível atribuir',
          description: e.message,
          intent: 'danger',
        }),
    },
  );

  return (
    <div className="space-y-3 rounded-card border border-border bg-surface p-4">
      <h3 className="font-display text-sm font-semibold text-ink">
        Atribuir a colaboradores
      </h3>
      <FormField
        label="IDs dos colaboradores"
        htmlFor="as-ids"
        hint="Separados por vírgula. GESTOR/LIDER só podem atribuir à sua equipa."
      >
        <Input
          id="as-ids"
          value={ids}
          onChange={(e) => setIds(e.target.value)}
        />
      </FormField>
      <div className="flex flex-wrap items-end gap-3">
        <FormField label="Prazo" htmlFor="as-due">
          <Input
            id="as-due"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </FormField>
        <label className="flex items-center gap-2 pb-2 font-body text-sm text-ink">
          <input
            type="checkbox"
            checked={mandatory}
            onChange={(e) => setMandatory(e.target.checked)}
          />
          Obrigatória
        </label>
        <Button
          size="sm"
          loading={assign.isPending}
          disabled={userIds.length === 0}
          onClick={() => assign.mutate(undefined)}
        >
          Atribuir ({userIds.length})
        </Button>
      </div>
    </div>
  );
}

function SessionForm({ session }: { session: SessionDetail }) {
  const notify = useToast();
  const [title, setTitle] = useState(session.title);
  const [welcome, setWelcome] = useState(session.welcomeMessage ?? '');
  const [duration, setDuration] = useState(
    session.durationMinutes ? String(session.durationMinutes) : '',
  );
  const [experienceType, setExperienceType] = useState<ExperienceType>(
    session.experienceType,
  );
  const [steps, setSteps] = useState<BuilderStep[]>(session.steps);

  const patch = (i: number, p: Partial<BuilderStep>) =>
    setSteps((s) => s.map((st, idx) => (idx === i ? { ...st, ...p } : st)));
  const move = (i: number, dir: -1 | 1) =>
    setSteps((s) => {
      const next = [...s];
      [next[i], next[i + dir]] = [next[i + dir], next[i]];
      return next;
    });
  const nextKey = () => {
    let n = steps.length + 1;
    while (steps.some((s) => s.key === `etapa-${n}`)) n++;
    return `etapa-${n}`;
  };

  const save = useApiMutation(
    () =>
      apiClient.patch(`/avatar-training/sessions/${session.id}`, {
        title: title.trim(),
        welcomeMessage: welcome.trim() || undefined,
        durationMinutes: duration ? Number(duration) : undefined,
        experienceType,
        steps,
      }),
    {
      invalidateKeys: [
        queryKeys.avatarTraining.session(session.id),
        queryKeys.avatarTraining.sessions(),
      ],
      onSuccess: () => notify({ title: 'Sessão guardada', intent: 'success' }),
      onError: (e) =>
        notify({
          title: 'Não foi possível guardar a sessão',
          description: e.message,
          intent: 'danger',
        }),
    },
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 font-body text-xs text-ink-muted">
        <StatusBadge value={session.status} map={PROGRAM_STATUS} variant="dot" />
        v{session.version} · {session.program.title}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <FormField label="Título" htmlFor="sf-title">
          <Input
            id="sf-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </FormField>
        <FormField label="Tipo de experiência" htmlFor="sf-type">
          <Select
            value={experienceType}
            onValueChange={(v) => setExperienceType(v as ExperienceType)}
            items={(Object.keys(EXPERIENCE_LABEL) as ExperienceType[]).map(
              (t) => ({ value: t, label: EXPERIENCE_LABEL[t] }),
            )}
          />
        </FormField>
        <FormField label="Duração (min)" htmlFor="sf-dur">
          <Input
            id="sf-dur"
            type="number"
            min={1}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
        </FormField>
      </div>
      <FormField label="Mensagem inicial do avatar" htmlFor="sf-welcome">
        <Textarea
          id="sf-welcome"
          rows={2}
          value={welcome}
          onChange={(e) => setWelcome(e.target.value)}
        />
      </FormField>

      <div className="space-y-3">
        {steps.map((s, i) => (
          <StepEditor
            key={s.key}
            step={s}
            index={i}
            total={steps.length}
            onChange={(p) => patch(i, p)}
            onMove={(d) => move(i, d)}
            onRemove={() => setSteps((x) => x.filter((_, idx) => idx !== i))}
          />
        ))}
        <Button
          size="sm"
          intent="secondary"
          onClick={() =>
            setSteps((x) => [
              ...x,
              { key: nextKey(), title: 'Nova etapa', type: 'CONTENT' },
            ])
          }
        >
          <Plus size={14} /> Adicionar etapa
        </Button>
      </div>

      <Button
        size="sm"
        loading={save.isPending}
        disabled={!title.trim() || steps.some((s) => !s.title.trim())}
        onClick={() => save.mutate(undefined)}
      >
        Guardar sessão
      </Button>

      <AssignBox sessionId={session.id} />
    </div>
  );
}

function NewSession({ onCreated }: { onCreated: (id: number) => void }) {
  const notify = useToast();
  const [programId, setProgramId] = useState<string>();
  const [title, setTitle] = useState('');
  const programs = useApiQuery<AvatarProgram[]>(
    queryKeys.avatarTraining.programs({}),
    '/avatar-training/programs',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const create = useApiMutation(
    () =>
      apiClient.post<{ id: number }>('/avatar-training/sessions', {
        programId: Number(programId),
        title: title.trim(),
      }),
    {
      invalidateKeys: [queryKeys.avatarTraining.sessions()],
      onSuccess: (s) => {
        setTitle('');
        onCreated(s.id);
      },
      onError: (e) =>
        notify({
          title: 'Não foi possível criar a sessão',
          description: e.message,
          intent: 'danger',
        }),
    },
  );

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-card border border-border bg-surface p-4">
      <FormField label="Formação" htmlFor="ns-prog">
        <Select
          value={programId}
          onValueChange={setProgramId}
          placeholder="Escolha a formação"
          items={(programs.data ?? []).map((p) => ({
            value: String(p.id),
            label: p.title,
          }))}
        />
      </FormField>
      <FormField label="Título da nova sessão" htmlFor="ns-title">
        <Input
          id="ns-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </FormField>
      <Button
        size="sm"
        loading={create.isPending}
        disabled={!programId || !title.trim()}
        onClick={() => create.mutate(undefined)}
      >
        <Plus size={14} /> Criar sessão
      </Button>
    </div>
  );
}

export function BuilderTab() {
  const [sessionId, setSessionId] = useState<number | null>(null);
  const { data, error, refetch } = useSessionDetail(sessionId);

  return (
    <div className="space-y-4">
      <NewSession onCreated={setSessionId} />
      <SessionPicker value={sessionId} onChange={setSessionId} />
      {sessionId === null ? (
        <EmptyState
          icon={Wrench}
          title="Escolha ou crie uma sessão"
          description="Configure etapas, perguntas e gabarito; depois submeta a formação a revisão para publicar."
        />
      ) : error ? (
        <QueryError error={error} onRetry={() => refetch()} />
      ) : (
        data && <SessionForm key={`${data.id}-${data.version}-${data.steps.length}`} session={data} />
      )}
    </div>
  );
}
