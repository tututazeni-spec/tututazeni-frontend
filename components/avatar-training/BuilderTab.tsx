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
  SessionRules,
  StepBranches,
  StepReinforcement,
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

const NEXT = 'NEXT';

/** Ramificações (role-play): para onde segue o formando conforme a resposta. */
function BranchEditor({
  step,
  index,
  later,
  onChange,
}: {
  step: BuilderStep;
  index: number;
  /** Só etapas posteriores — o backend recusa saltos para trás. */
  later: { key: string; title: string }[];
  onChange: (branches: StepBranches | undefined) => void;
}) {
  const q = step.question;
  if (!q) return null;
  const options = q.kind === 'TRUE_FALSE' ? ['Verdadeiro', 'Falso'] : (q.options ?? []);
  const graded = !!q.correctAnswer;
  const b = step.branches ?? {};
  const items = [
    { value: NEXT, label: 'Seguir em sequência' },
    ...later.map((l) => ({ value: l.key, label: l.title || l.key })),
  ];
  if (later.length === 0 || (options.length === 0 && !graded)) return null;

  const clean = (next: StepBranches) => {
    const byOption = Object.fromEntries(
      Object.entries(next.byOption ?? {}).filter(([, v]) => v),
    );
    const out: StepBranches = {
      ...(next.onCorrect ? { onCorrect: next.onCorrect } : {}),
      ...(next.onIncorrect ? { onIncorrect: next.onIncorrect } : {}),
      ...(Object.keys(byOption).length ? { byOption } : {}),
    };
    onChange(Object.keys(out).length ? out : undefined);
  };
  const pick = (v: string) => (v === NEXT ? undefined : v);

  return (
    <fieldset className="space-y-2 rounded-card bg-surface-sunken p-3">
      <legend className="px-1 font-body text-sm font-medium text-ink">
        Ramificações (opcional)
      </legend>
      <p className="font-body text-xs text-ink-faint">
        Escolha a etapa seguinte conforme a resposta. As etapas saltadas deixam de ser
        exigidas e não contam para a nota.
      </p>
      {graded && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField label="Se acertar, ir para" htmlFor={`br-ok-${index}`}>
            <Select
              value={b.onCorrect ?? NEXT}
              onValueChange={(v) => clean({ ...b, onCorrect: pick(v) })}
              items={items}
            />
          </FormField>
          <FormField label="Se errar, ir para" htmlFor={`br-ko-${index}`}>
            <Select
              value={b.onIncorrect ?? NEXT}
              onValueChange={(v) => clean({ ...b, onIncorrect: pick(v) })}
              items={items}
            />
          </FormField>
        </div>
      )}
      {options.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {options.map((o) => (
            <FormField key={o} label={`Se escolher «${o}», ir para`} htmlFor={`br-${index}-${o}`}>
              <Select
                value={b.byOption?.[o] ?? NEXT}
                onValueChange={(v) =>
                  clean({ ...b, byOption: { ...b.byOption, [o]: pick(v) ?? '' } })
                }
                items={items}
              />
            </FormField>
          ))}
        </div>
      )}
    </fieldset>
  );
}

/** Reforço (§7): o que mostrar e se a etapa se repete quando a resposta está errada. */
function ReinforcementEditor({
  step,
  index,
  earlier,
  onChange,
}: {
  step: BuilderStep;
  index: number;
  /** Só etapas anteriores — o backend recusa a revisão de etapas à frente. */
  earlier: { key: string; title: string }[];
  onChange: (reinforcement: StepReinforcement | undefined) => void;
}) {
  if (!step.question?.correctAnswer) return null;
  const r = step.reinforcement ?? {};
  const clean = (next: StepReinforcement) => {
    const out: StepReinforcement = {
      ...(next.message?.trim() ? { message: next.message } : {}),
      ...(next.reviewStepKey ? { reviewStepKey: next.reviewStepKey } : {}),
      ...(next.resourceUrl?.trim() ? { resourceUrl: next.resourceUrl } : {}),
      ...(next.retryOnIncorrect
        ? { retryOnIncorrect: true, maxRetries: next.maxRetries ?? 2 }
        : {}),
    };
    onChange(Object.keys(out).length ? out : undefined);
  };
  return (
    <fieldset className="space-y-2 rounded-card bg-surface-sunken p-3">
      <legend className="px-1 font-body text-sm font-medium text-ink">
        Reforço se errar (opcional)
      </legend>
      <p className="font-body text-xs text-ink-faint">
        Mensagem e conteúdo complementar mostrados após uma resposta errada; pode
        obrigar a repetir a etapa antes de avançar.
      </p>
      <FormField label="Mensagem de reforço" htmlFor={`rf-m-${index}`}>
        <Textarea
          id={`rf-m-${index}`}
          rows={2}
          value={r.message ?? ''}
          onChange={(e) => clean({ ...r, message: e.target.value })}
        />
      </FormField>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormField label="Etapa anterior a rever" htmlFor={`rf-s-${index}`}>
          <Select
            value={r.reviewStepKey ?? NEXT}
            onValueChange={(v) => clean({ ...r, reviewStepKey: v === NEXT ? undefined : v })}
            items={[
              { value: NEXT, label: 'Nenhuma' },
              ...earlier.map((l) => ({ value: l.key, label: l.title || l.key })),
            ]}
          />
        </FormField>
        <FormField label="Conteúdo complementar (URL)" htmlFor={`rf-u-${index}`}>
          <Input
            id={`rf-u-${index}`}
            value={r.resourceUrl ?? ''}
            onChange={(e) => clean({ ...r, resourceUrl: e.target.value })}
          />
        </FormField>
      </div>
      <div className="flex flex-wrap items-center gap-4 font-body text-sm text-ink">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!r.retryOnIncorrect}
            onChange={(e) => clean({ ...r, retryOnIncorrect: e.target.checked })}
          />
          Repetir a etapa antes de avançar
        </label>
        {r.retryOnIncorrect && (
          <label className="flex items-center gap-2">
            Repetições
            <input
              type="number"
              min={1}
              max={5}
              className="w-16 rounded-card border border-border bg-surface px-2 py-1"
              value={r.maxRetries ?? 2}
              onChange={(e) =>
                clean({ ...r, maxRetries: Math.min(5, Math.max(1, Number(e.target.value) || 2)) })
              }
            />
          </label>
        )}
      </div>
    </fieldset>
  );
}

function StepEditor({
  step,
  index,
  total,
  later,
  earlier,
  onChange,
  onMove,
  onRemove,
}: {
  step: BuilderStep;
  index: number;
  total: number;
  later: { key: string; title: string }[];
  earlier: { key: string; title: string }[];
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
                  v === 'QUESTION' || v === 'SCENARIO'
                    ? (q ?? { kind: v === 'SCENARIO' ? 'SINGLE' : 'SHORT' })
                    : undefined,
                branches: v === 'QUESTION' || v === 'SCENARIO' ? step.branches : undefined,
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

      {(step.type === 'QUESTION' || step.type === 'SCENARIO') && q && (
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
      {step.type === 'QUESTION' && (
        <ReinforcementEditor
          step={step}
          index={index}
          earlier={earlier}
          onChange={(reinforcement) => onChange({ reinforcement })}
        />
      )}
      {(step.type === 'QUESTION' || step.type === 'SCENARIO') && (
        <BranchEditor
          step={step}
          index={index}
          later={later}
          onChange={(branches) => onChange({ branches })}
        />
      )}
    </div>
  );
}

/** Regras de conclusão (§7): o que recomendar quando a nota fica abaixo da mínima. */
function FailRules({
  rules,
  onChange,
}: {
  rules: SessionRules;
  onChange: (rules: SessionRules) => void;
}) {
  const f = rules.onFail ?? {};
  const set = (next: NonNullable<SessionRules['onFail']>) => {
    const out = {
      ...(next.message?.trim() ? { message: next.message } : {}),
      ...(next.resourceUrl?.trim() ? { resourceUrl: next.resourceUrl } : {}),
      ...(next.recommendSessionId ? { recommendSessionId: next.recommendSessionId } : {}),
    };
    onChange(Object.keys(out).length ? { onFail: out } : {});
  };
  return (
    <fieldset className="space-y-2 rounded-card border border-border p-3">
      <legend className="px-1 font-body text-sm font-medium text-ink">
        Se ficar abaixo da nota mínima
      </legend>
      <FormField label="Mensagem" htmlFor="fr-msg">
        <Textarea
          id="fr-msg"
          rows={2}
          value={f.message ?? ''}
          onChange={(e) => set({ ...f, message: e.target.value })}
        />
      </FormField>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormField label="Conteúdo complementar (URL)" htmlFor="fr-url">
          <Input
            id="fr-url"
            value={f.resourceUrl ?? ''}
            onChange={(e) => set({ ...f, resourceUrl: e.target.value })}
          />
        </FormField>
        <FormField label="Sessão complementar (id)" htmlFor="fr-sess">
          <Input
            id="fr-sess"
            type="number"
            min={1}
            value={f.recommendSessionId ?? ''}
            onChange={(e) => set({ ...f, recommendSessionId: Number(e.target.value) || undefined })}
          />
        </FormField>
      </div>
    </fieldset>
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

/** Ao remover/mover uma etapa, retira as ramificações que apontavam para ela. */
function dropBranchesTo(steps: BuilderStep[], key: string): BuilderStep[] {
  return steps.map((s) => {
    const b = s.branches;
    if (!b) return s;
    const byOption = Object.fromEntries(
      Object.entries(b.byOption ?? {}).filter(([, v]) => v !== key),
    );
    const next: StepBranches = {
      ...(b.onCorrect && b.onCorrect !== key ? { onCorrect: b.onCorrect } : {}),
      ...(b.onIncorrect && b.onIncorrect !== key ? { onIncorrect: b.onIncorrect } : {}),
      ...(Object.keys(byOption).length ? { byOption } : {}),
    };
    return { ...s, branches: Object.keys(next).length ? next : undefined };
  });
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
  const [rules, setRules] = useState<SessionRules>(session.rules ?? {});

  const patch = (i: number, p: Partial<BuilderStep>) =>
    setSteps((s) => s.map((st, idx) => (idx === i ? { ...st, ...p } : st)));
  const move = (i: number, dir: -1 | 1) =>
    setSteps((s) => {
      const next = [...s];
      [next[i], next[i + dir]] = [next[i + dir], next[i]];
      // Mover pode deixar ramificações a apontar para trás: retiram-se as que passam a ser inválidas.
      return next.map((st, idx) => {
        if (!st.branches) return st;
        const later = new Set(next.slice(idx + 1).map((x) => x.key));
        let out = st;
        for (const k of [
          st.branches.onCorrect,
          st.branches.onIncorrect,
          ...Object.values(st.branches.byOption ?? {}),
        ]) {
          if (k && !later.has(k)) out = dropBranchesTo([out], k)[0];
        }
        return out;
      });
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
        rules,
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

      <FailRules rules={rules} onChange={setRules} />

      <div className="space-y-3">
        {steps.map((s, i) => (
          <StepEditor
            key={s.key}
            step={s}
            index={i}
            total={steps.length}
            later={steps.slice(i + 1).map((x) => ({ key: x.key, title: x.title }))}
            earlier={steps.slice(0, i).map((x) => ({ key: x.key, title: x.title }))}
            onChange={(p) => patch(i, p)}
            onMove={(d) => move(i, d)}
            onRemove={() => setSteps((x) => dropBranchesTo(x, x[i].key).filter((_, idx) => idx !== i))}
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
