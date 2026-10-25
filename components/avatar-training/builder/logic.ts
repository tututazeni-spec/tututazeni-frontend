// components/avatar-training/builder/logic.ts
// Regras do Construtor de Sessões (docs/Avatar_Training.md §7) sem React:
// manipulação das etapas (mover, remover, ramificações válidas), limpeza dos
// editores de ramificação/reforço/regras de falha, validação e corpo dos
// pedidos. Extraído de BuilderTab.tsx.

import type {
  BuilderQuestion,
  BuilderStep,
  ExperienceType,
  SessionRules,
  StepBranches,
  StepReinforcement,
} from '../types';

/** Valor do selector que significa «sem salto / seguir em sequência». */
export const NEXT = 'NEXT';

export interface StepRef {
  key: string;
  title: string;
}

// ── Opções de pergunta ──────────────────────────────────────────────────────

/** Opções de resposta; sem opções, a resposta é texto livre. */
export const questionChoices = (q: BuilderQuestion): string[] =>
  q.kind === 'TRUE_FALSE' ? ['Verdadeiro', 'Falso'] : (q.options ?? []);

/** Uma opção por linha, sem linhas vazias. */
export const parseOptions = (text: string): string[] =>
  text
    .split('\n')
    .map((o) => o.trim())
    .filter(Boolean);

/** Actualiza a pergunta; sem pergunta prévia, assume resposta curta. */
export const patchQuestion = (
  q: BuilderQuestion | undefined,
  patch: Partial<BuilderQuestion>,
): BuilderQuestion => ({ kind: 'SHORT', ...q, ...patch });

const hasQuestion = (type: BuilderStep['type']): boolean =>
  type === 'QUESTION' || type === 'SCENARIO';

/**
 * Mudar o tipo da etapa: perguntas e cenários têm pergunta (cenário começa em
 * escolha única) e ramificações; os outros tipos perdem ambas.
 */
export function stepTypePatch(
  step: BuilderStep,
  type: BuilderStep['type'],
): Partial<BuilderStep> {
  return {
    type,
    question: hasQuestion(type)
      ? (step.question ?? { kind: type === 'SCENARIO' ? 'SINGLE' : 'SHORT' })
      : undefined,
    branches: hasQuestion(type) ? step.branches : undefined,
  };
}

// ── Ramificações ────────────────────────────────────────────────────────────

/** Selector de destino: «seguir em sequência» + as etapas indicadas. */
export const targetItems = (refs: StepRef[], noneLabel: string) => [
  { value: NEXT, label: noneLabel },
  ...refs.map((l) => ({ value: l.key, label: l.title || l.key })),
];

export const pickBranch = (v: string): string | undefined =>
  v === NEXT ? undefined : v;

/** Remove destinos vazios; sem nada que guardar devolve undefined. */
export function cleanBranches(next: StepBranches): StepBranches | undefined {
  const byOption = Object.fromEntries(
    Object.entries(next.byOption ?? {}).filter(([, v]) => v),
  );
  const out: StepBranches = {
    ...(next.onCorrect ? { onCorrect: next.onCorrect } : {}),
    ...(next.onIncorrect ? { onIncorrect: next.onIncorrect } : {}),
    ...(Object.keys(byOption).length ? { byOption } : {}),
  };
  return Object.keys(out).length ? out : undefined;
}

/** Ao remover uma etapa, retira as ramificações que apontavam para ela. */
export function dropBranchesTo(
  steps: BuilderStep[],
  key: string,
): BuilderStep[] {
  return steps.map((s) => {
    const b = s.branches;
    if (!b) return s;
    const byOption = Object.fromEntries(
      Object.entries(b.byOption ?? {}).filter(([, v]) => v !== key),
    );
    const next: StepBranches = {
      ...(b.onCorrect && b.onCorrect !== key ? { onCorrect: b.onCorrect } : {}),
      ...(b.onIncorrect && b.onIncorrect !== key
        ? { onIncorrect: b.onIncorrect }
        : {}),
      ...(Object.keys(byOption).length ? { byOption } : {}),
    };
    return { ...s, branches: Object.keys(next).length ? next : undefined };
  });
}

/** Só se pode saltar para etapas posteriores: retira os saltos para trás. */
export function pruneBackwardBranches(steps: BuilderStep[]): BuilderStep[] {
  return steps.map((st, idx) => {
    if (!st.branches) return st;
    const later = new Set(steps.slice(idx + 1).map((x) => x.key));
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
}

// ── Reforço e regras de falha ───────────────────────────────────────────────

/** Mantém só o que tem valor; repetir a etapa leva 2 repetições por omissão. */
export function cleanReinforcement(
  next: StepReinforcement,
): StepReinforcement | undefined {
  const out: StepReinforcement = {
    ...(next.message?.trim() ? { message: next.message } : {}),
    ...(next.reviewStepKey ? { reviewStepKey: next.reviewStepKey } : {}),
    ...(next.resourceUrl?.trim() ? { resourceUrl: next.resourceUrl } : {}),
    ...(next.retryOnIncorrect
      ? { retryOnIncorrect: true, maxRetries: next.maxRetries ?? 2 }
      : {}),
  };
  return Object.keys(out).length ? out : undefined;
}

/** Repetições entre 1 e 5; valor inválido volta às 2 por omissão. */
export const clampRetries = (raw: string): number =>
  Math.min(5, Math.max(1, Number(raw) || 2));

export function cleanFailRules(
  next: NonNullable<SessionRules['onFail']>,
): SessionRules {
  const out = {
    ...(next.message?.trim() ? { message: next.message } : {}),
    ...(next.resourceUrl?.trim() ? { resourceUrl: next.resourceUrl } : {}),
    ...(next.recommendSessionId
      ? { recommendSessionId: next.recommendSessionId }
      : {}),
  };
  return Object.keys(out).length ? { onFail: out } : {};
}

// ── Lista de etapas ─────────────────────────────────────────────────────────

export const patchStep = (
  steps: BuilderStep[],
  i: number,
  patch: Partial<BuilderStep>,
): BuilderStep[] =>
  steps.map((st, idx) => (idx === i ? { ...st, ...patch } : st));

/** Troca a etapa com a vizinha e retira os saltos que passam a ser inválidos. */
export function moveStep(
  steps: BuilderStep[],
  i: number,
  dir: -1 | 1,
): BuilderStep[] {
  const j = i + dir;
  if (j < 0 || j >= steps.length) return steps;
  const next = [...steps];
  [next[i], next[j]] = [next[j], next[i]];
  return pruneBackwardBranches(next);
}

export const removeStep = (steps: BuilderStep[], i: number): BuilderStep[] =>
  dropBranchesTo(steps, steps[i].key).filter((_, idx) => idx !== i);

/** Primeira chave «etapa-N» livre. */
export function nextStepKey(steps: BuilderStep[]): string {
  let n = steps.length + 1;
  while (steps.some((s) => s.key === `etapa-${n}`)) n++;
  return `etapa-${n}`;
}

export const addStep = (steps: BuilderStep[]): BuilderStep[] => [
  ...steps,
  { key: nextStepKey(steps), title: 'Nova etapa', type: 'CONTENT' },
];

/** Etapas anterior/posteriores a `i`, para os selectores de destino. */
export function stepRefs(steps: BuilderStep[], i: number) {
  const ref = (x: BuilderStep): StepRef => ({ key: x.key, title: x.title });
  return {
    later: steps.slice(i + 1).map(ref),
    earlier: steps.slice(0, i).map(ref),
  };
}

// ── Sessão ──────────────────────────────────────────────────────────────────

export interface SessionFormValues {
  title: string;
  welcome: string;
  duration: string;
  experienceType: ExperienceType;
  steps: BuilderStep[];
  rules: SessionRules;
}

/** Gravar exige título da sessão e título em todas as etapas. */
export const canSaveSession = (v: Pick<SessionFormValues, 'title' | 'steps'>) =>
  !!v.title.trim() && !v.steps.some((s) => !s.title.trim());

export const buildSessionPayload = (v: SessionFormValues) => ({
  title: v.title.trim(),
  welcomeMessage: v.welcome.trim() || undefined,
  durationMinutes: v.duration ? Number(v.duration) : undefined,
  experienceType: v.experienceType,
  steps: v.steps,
  rules: v.rules,
});

export const canCreateSession = (
  programId: string | undefined,
  title: string,
): boolean => !!programId && !!title.trim();

export const buildNewSessionPayload = (programId: string, title: string) => ({
  programId: Number(programId),
  title: title.trim(),
});

// ── Atribuição ──────────────────────────────────────────────────────────────

/** A procura por nome só arranca com 2+ caracteres. */
export const MIN_SEARCH_LENGTH = 2;

/** Texto só com dígitos é também um ID de colaborador. */
export const idFromQuery = (query: string): number | null =>
  /^\d+$/.test(query.trim()) ? Number(query.trim()) : null;

export const buildAssignPayload = (
  userIds: number[],
  dueDate: string,
  mandatory: boolean,
) => ({
  userIds,
  dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
  mandatory,
});

/** O backend só atribui sessões publicadas de formações publicadas. */
export function assignErrorMessage(message: string): string {
  return /publicada não encontrada/i.test(message)
    ? 'Só é possível atribuir sessões publicadas de formações publicadas. Publica a sessão e a formação e tenta de novo.'
    : message;
}
