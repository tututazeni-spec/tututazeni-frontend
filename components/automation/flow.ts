// components/automation/flow.ts
// Modelo do Construtor de Fluxos (docs/modulo_automation.md §4) — espelha
// src/automation/automation-flow.ts. Os passos vivem numa árvore (as condições
// têm os ramos Sim/Não); os helpers alteram-na sempre de forma imutável,
// endereçando cada lista por um caminho [índice, 'then'|'else', índice, …].

export type FlowBranch = 'then' | 'else';

export interface FlowConditionRow {
  field: string;
  operator: string;
  value?: string;
}

export interface FlowActionStep {
  id: string;
  type: 'action';
  label?: string;
  action: string;
  params: Record<string, unknown>;
  onError?: 'stop' | 'continue';
}

export interface FlowDelayStep {
  id: string;
  type: 'delay';
  label?: string;
  minutes: number;
}

export interface FlowConditionStep {
  id: string;
  type: 'condition';
  label?: string;
  logic: 'AND' | 'OR';
  rows: FlowConditionRow[];
  then: FlowStep[];
  else: FlowStep[];
}

export type FlowStep = FlowActionStep | FlowDelayStep | FlowConditionStep;

export interface FlowDefinition {
  steps: FlowStep[];
}

/** Caminho até uma lista de passos: [] = raiz; [2, 'then'] = ramo Sim do 3.º passo. */
export type ListPath = (number | FlowBranch)[];

let counter = 0;
const newId = () => `s${Date.now().toString(36)}${(counter++).toString(36)}`;

export function newStep(type: FlowStep['type']): FlowStep {
  if (type === 'delay') return { id: newId(), type, minutes: 60 };
  if (type === 'condition') {
    return {
      id: newId(),
      type,
      logic: 'AND',
      rows: [{ field: '', operator: 'equals', value: '' }],
      then: [],
      else: [],
    };
  }
  return {
    id: newId(),
    type: 'action',
    action: 'send_notification',
    params: { channel: 'internal' },
  };
}

function getList(root: FlowStep[], path: ListPath): FlowStep[] {
  let list = root;
  for (let i = 0; i < path.length; i += 2) {
    const step = list[path[i] as number] as FlowConditionStep;
    list = step[path[i + 1] as FlowBranch];
  }
  return list;
}

/** Aplica `fn` à lista no caminho e devolve uma nova árvore. */
function mapList(
  root: FlowStep[],
  path: ListPath,
  fn: (list: FlowStep[]) => FlowStep[],
): FlowStep[] {
  if (path.length === 0) return fn(root);
  const [index, branch, ...rest] = path as [number, FlowBranch, ...ListPath];
  return root.map((step, i) =>
    i === index && step.type === 'condition'
      ? { ...step, [branch]: mapList(step[branch], rest, fn) }
      : step,
  );
}

export const addStep = (root: FlowStep[], path: ListPath, step: FlowStep) =>
  mapList(root, path, (l) => [...l, step]);

export const removeStep = (root: FlowStep[], path: ListPath, index: number) =>
  mapList(root, path, (l) => l.filter((_, i) => i !== index));

export const moveStep = (
  root: FlowStep[],
  path: ListPath,
  index: number,
  delta: -1 | 1,
) =>
  mapList(root, path, (l) => {
    const target = index + delta;
    if (target < 0 || target >= l.length) return l;
    const copy = [...l];
    [copy[index], copy[target]] = [copy[target], copy[index]];
    return copy;
  });

export const updateStep = (
  root: FlowStep[],
  path: ListPath,
  index: number,
  patch: Partial<FlowStep>,
) =>
  mapList(root, path, (l) =>
    l.map((s, i) => (i === index ? ({ ...s, ...patch } as FlowStep) : s)),
  );

export function countSteps(steps: FlowStep[]): number {
  return steps.reduce(
    (n, s) =>
      n +
      1 +
      (s.type === 'condition' ? countSteps(s.then) + countSteps(s.else) : 0),
    0,
  );
}

/** Garante ids em fluxos vindos do backend (que podem não os ter). */
export function normaliseFlow(
  raw: { steps?: unknown[] } | null | undefined,
): FlowStep[] {
  const walk = (list: unknown[] = []): FlowStep[] =>
    list.map((s) => {
      const step = s as Partial<FlowStep> & Record<string, unknown>;
      const id = (step.id as string) || newId();
      if (step.type === 'condition') {
        return {
          ...(step as unknown as FlowConditionStep),
          id,
          logic: (step.logic as 'AND' | 'OR') ?? 'AND',
          rows: (step.rows as FlowConditionRow[]) ?? [],
          then: walk(step.then as unknown[]),
          else: walk(step.else as unknown[]),
        };
      }
      if (step.type === 'delay') {
        return { ...(step as unknown as FlowDelayStep), id };
      }
      return {
        ...(step as unknown as FlowActionStep),
        id,
        params: (step.params as Record<string, unknown>) ?? {},
      };
    });
  return walk(raw?.steps);
}

/** Serializa para o DTO: tira o que o backend não espera e limpa valores vazios. */
export function serialiseFlow(steps: FlowStep[]): FlowDefinition {
  const clean = (list: FlowStep[]): unknown[] =>
    list.map((s) => {
      if (s.type === 'condition') {
        return {
          id: s.id,
          type: 'condition',
          ...(s.label ? { label: s.label } : {}),
          logic: s.logic,
          rows: s.rows.map((r) => ({
            field: r.field.trim(),
            operator: r.operator,
            ...(r.value ? { value: r.value } : {}),
          })),
          then: clean(s.then),
          else: clean(s.else),
        };
      }
      if (s.type === 'delay') {
        return {
          id: s.id,
          type: 'delay',
          ...(s.label ? { label: s.label } : {}),
          minutes: s.minutes,
        };
      }
      const params = Object.fromEntries(
        Object.entries(s.params).filter(
          ([, v]) => v !== '' && v !== undefined && v !== null,
        ),
      );
      return {
        id: s.id,
        type: 'action',
        ...(s.label ? { label: s.label } : {}),
        action: s.action,
        params,
        ...(s.onError ? { onError: s.onError } : {}),
      };
    });
  return { steps: clean(steps) as unknown as FlowStep[] };
}

export { getList };
