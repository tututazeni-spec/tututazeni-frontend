// components/processes/workflow-model.ts
// Modelo editável do construtor de fluxos (docs/Modulo_Processes.md §8) e
// conversões de/para as etapas do servidor. Lógica pura (sem React).
//
// No canvas cada bloco tem uma `key` estável; as dependências e as condições
// referenciam chaves. Só ao guardar é que se atribuem as `order` (por
// camadas do grafo) e as chaves são reescritas para ordens.

import type { ApprovalMode, ProcessStep, RejectionRule, StepType } from './types';

export interface ConditionRowDraft {
  field: string;
  operator: string;
  value: string;
}
export interface ConditionDraft {
  logic: 'AND' | 'OR';
  rows: ConditionRowDraft[];
}

export type ActionType =
  | 'NOTIFY'
  | 'SET_PRIORITY'
  | 'ADD_COMMENT'
  | 'EMIT_EVENT'
  | 'SUSPEND_INSTANCE'
  | 'CANCEL_INSTANCE';

export interface ActionDraft {
  type: ActionType;
  recipients: string[];
  message: string;
  priority: string;
  event: string;
  reason: string;
}

export interface FlowNode {
  key: string;
  type: StepType;
  title: string;
  description: string;
  responsibleId: string;
  responsibleRole: string;
  reviewerId: string;
  slaHours: string;
  calendarMode: 'CALENDAR' | 'BUSINESS_DAYS';
  checklist: string;
  requiresUpload: boolean;
  requiredData: string;
  deps: string[];
  x: number;
  y: number;
  // aprovação
  approverIds: string[];
  approvalMode: ApprovalMode;
  allowDelegation: boolean;
  onReject: RejectionRule;
  maxReturns: string;
  // condições
  entry: ConditionDraft | null;
  exit: ConditionDraft | null;
  // configuração por tipo
  delayHours: string;
  eventName: string;
  recipients: string[];
  message: string;
  integrationModule: string;
  integrationEvent: string;
  template: string;
  autoActions: ActionDraft[];
  // acções e escalonamento
  successActions: ActionDraft[];
  failureActions: ActionDraft[];
  escalationAfterHours: string;
  escalationToId: string;
  escalationToRole: string;
  /** Preservados tal como vieram do servidor. */
  formSchema: string | null;
  legacyExit: string | null;
}

export const NODE_W = 210;
export const NODE_H = 68;

export interface BlockMeta {
  type: StepType;
  label: string;
  hint: string;
  tone: 'success' | 'neutral' | 'info' | 'primary' | 'warning' | 'accent';
}

export const BLOCKS: BlockMeta[] = [
  { type: 'START', label: 'Início do processo', hint: 'Ponto de partida', tone: 'success' },
  { type: 'FORM', label: 'Formulário de entrada', hint: 'Recolha de dados', tone: 'info' },
  { type: 'TASK', label: 'Tarefa manual', hint: 'Executada por uma pessoa', tone: 'info' },
  { type: 'REVIEW', label: 'Aprovação', hint: 'Decisão de um ou mais aprovadores', tone: 'accent' },
  { type: 'DECISION', label: 'Condição lógica', hint: 'Decisão com resultado', tone: 'primary' },
  { type: 'GATEWAY', label: 'Ramificação', hint: 'Divide o fluxo em ramos', tone: 'warning' },
  { type: 'PARALLEL', label: 'Tarefas paralelas', hint: 'Junta/separa ramos paralelos', tone: 'warning' },
  { type: 'WAIT_EVENT', label: 'Espera por evento', hint: 'Aguarda um evento externo', tone: 'neutral' },
  { type: 'TIMER', label: 'Temporizador', hint: 'Espera um período', tone: 'neutral' },
  { type: 'INTEGRATION', label: 'Integração com módulo', hint: 'Pede trabalho a outro módulo', tone: 'primary' },
  { type: 'AUTO_ACTION', label: 'Acção automática', hint: 'Executada pelo sistema', tone: 'primary' },
  { type: 'NOTIFICATION', label: 'Notificação', hint: 'Avisa pessoas', tone: 'info' },
  { type: 'DOCUMENT', label: 'Geração de documento', hint: 'Produz um documento', tone: 'accent' },
  { type: 'END', label: 'Fim do processo', hint: 'Conclui o fluxo', tone: 'neutral' },
];

export const BLOCK_BY_TYPE = Object.fromEntries(BLOCKS.map((b) => [b.type, b])) as Record<
  StepType,
  BlockMeta
>;

export const HUMAN_TYPES: StepType[] = ['TASK', 'DECISION', 'FORM', 'DOCUMENT'];

let counter = 0;
export const newKey = () => `n${Date.now().toString(36)}${(counter++).toString(36)}`;

export const emptyAction = (type: ActionType = 'NOTIFY'): ActionDraft => ({
  type,
  recipients: [],
  message: '',
  priority: 'HIGH',
  event: '',
  reason: '',
});

export function newNode(type: StepType, x: number, y: number): FlowNode {
  return {
    key: newKey(),
    type,
    title: BLOCK_BY_TYPE[type].label,
    description: '',
    responsibleId: '',
    responsibleRole: '',
    reviewerId: '',
    slaHours: '',
    calendarMode: 'CALENDAR',
    checklist: '',
    requiresUpload: false,
    requiredData: '',
    deps: [],
    x,
    y,
    approverIds: [],
    approvalMode: 'SEQUENTIAL',
    allowDelegation: true,
    onReject: 'HOLD',
    maxReturns: '',
    entry: null,
    exit: null,
    delayHours: '',
    eventName: '',
    recipients: [],
    message: '',
    integrationModule: '',
    integrationEvent: '',
    template: '',
    autoActions: [],
    successActions: [],
    failureActions: [],
    escalationAfterHours: '',
    escalationToId: '',
    escalationToRole: '',
    formSchema: null,
    legacyExit: null,
  };
}

// ─── JSON seguro ─────────────────────────────────────────────────────────────

function parse<T>(raw: string | null | undefined): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

const lines = (v: string) =>
  v
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
const csv = (v: string) =>
  v
    .split(',')
    .map((l) => l.trim())
    .filter(Boolean);

// ─── Condições: ordens <-> chaves ────────────────────────────────────────────

function conditionFromServer(
  raw: string | null | undefined,
  keyByOrder: Map<number, string>,
): ConditionDraft | null {
  const c = parse<{ logic?: string; rows?: Array<Partial<ConditionRowDraft>> }>(raw);
  if (!c?.rows?.length) return null;
  return {
    logic: c.logic === 'OR' ? 'OR' : 'AND',
    rows: c.rows.map((r) => ({
      field: (r.field ?? '').replace(/^step:(\d+)\./, (_m, o: string) => {
        const key = keyByOrder.get(Number(o));
        return key ? `step:${key}.` : `step:${o}.`;
      }),
      operator: r.operator ?? 'equals',
      value: r.value ?? '',
    })),
  };
}

function conditionToServer(c: ConditionDraft | null, orderByKey: Map<string, number>) {
  if (!c || c.rows.length === 0) return undefined;
  const rows = c.rows
    .filter((r) => r.field.trim())
    .map((r) => ({
      field: r.field.replace(/^step:([^.]+)\./, (_m, k: string) => {
        const order = orderByKey.get(k);
        return order === undefined ? `step:${k}.` : `step:${order}.`;
      }),
      operator: r.operator,
      ...(r.value !== '' ? { value: r.value } : {}),
    }));
  return rows.length ? { logic: c.logic, rows } : undefined;
}

function actionsFromServer(raw: string | null | undefined): ActionDraft[] {
  const list = parse<Array<Partial<ActionDraft>>>(raw);
  if (!Array.isArray(list)) return [];
  return list.map((a) => ({ ...emptyAction(a.type ?? 'NOTIFY'), ...a, recipients: a.recipients ?? [] }));
}

function actionsToServer(list: ActionDraft[]) {
  return list.map((a) => {
    switch (a.type) {
      case 'NOTIFY':
        return { type: a.type, recipients: a.recipients, message: a.message };
      case 'SET_PRIORITY':
        return { type: a.type, priority: a.priority };
      case 'ADD_COMMENT':
        return { type: a.type, message: a.message };
      case 'EMIT_EVENT':
        return { type: a.type, event: a.event };
      default:
        return { type: a.type, reason: a.reason };
    }
  });
}

// ─── Servidor → canvas ───────────────────────────────────────────────────────

/** Dependências efectivas (espelha effectiveDependencies do backend). */
function effectiveDeps(steps: ProcessStep[]): Map<number, number[]> {
  const orders = [...new Set(steps.map((s) => s.order))].sort((a, b) => a - b);
  const out = new Map<number, number[]>();
  for (const s of steps) {
    const explicit = (s.dependsOnOrders ?? []).filter((o) => o !== s.order);
    if (explicit.length) out.set(s.order, [...new Set(explicit)]);
    else if (s.parallel) out.set(s.order, []);
    else {
      const idx = orders.indexOf(s.order);
      out.set(s.order, idx > 0 ? [orders[idx - 1]] : []);
    }
  }
  return out;
}

export function nodesFromSteps(steps: ProcessStep[]): FlowNode[] {
  const sorted = [...steps].sort((a, b) => a.order - b.order);
  const keyByOrder = new Map<number, string>(sorted.map((s) => [s.order, `s${s.id}`]));
  const deps = effectiveDeps(sorted);
  const nodes = sorted.map<FlowNode>((s) => {
    const cfg =
      parse<{
        delayHours?: number;
        eventName?: string;
        recipients?: string[];
        message?: string;
        module?: string;
        event?: string;
        template?: string;
        actions?: Array<Partial<ActionDraft>>;
      }>(s.config) ?? {};
    const base = newNode(s.type, s.posX ?? NaN, s.posY ?? NaN);
    const exit = conditionFromServer(s.exitConditions, keyByOrder);
    return {
      ...base,
      key: `s${s.id}`,
      title: s.title,
      description: s.description ?? '',
      responsibleId: s.responsible ? String(s.responsible.id) : '',
      responsibleRole: s.responsibleRole ?? '',
      reviewerId: s.reviewer ? String(s.reviewer.id) : '',
      slaHours: s.slaHours ? String(s.slaHours) : '',
      calendarMode: s.calendarMode ?? 'CALENDAR',
      checklist: (s.checklist ?? []).join('\n'),
      requiresUpload: s.requiresUpload,
      requiredData: (s.requiredData ?? []).join(', '),
      deps: (deps.get(s.order) ?? []).map((o) => keyByOrder.get(o)).filter((k): k is string => !!k),
      approverIds: (s.approverIds ?? []).map(String),
      approvalMode: s.approvalMode ?? 'SEQUENTIAL',
      allowDelegation: s.allowDelegation ?? true,
      onReject: s.onReject ?? 'HOLD',
      maxReturns: s.maxReturns != null ? String(s.maxReturns) : '',
      entry: conditionFromServer(s.entryConditions, keyByOrder),
      exit,
      legacyExit: !exit && s.exitConditions && s.exitConditions !== '{}' ? s.exitConditions : null,
      delayHours: cfg.delayHours != null ? String(cfg.delayHours) : '',
      eventName: cfg.eventName ?? '',
      recipients: cfg.recipients ?? [],
      message: cfg.message ?? '',
      integrationModule: cfg.module ?? '',
      integrationEvent: cfg.event ?? '',
      template: cfg.template ?? '',
      autoActions: (cfg.actions ?? []).map((a) => ({
        ...emptyAction(a.type ?? 'NOTIFY'),
        ...a,
        recipients: a.recipients ?? [],
      })),
      successActions: actionsFromServer(s.successActions),
      failureActions: actionsFromServer(s.failureActions),
      escalationAfterHours: s.escalationAfterHours != null ? String(s.escalationAfterHours) : '',
      escalationToId: s.escalationToId != null ? String(s.escalationToId) : '',
      escalationToRole: s.escalationToRole ?? '',
      formSchema: s.formSchema ?? null,
    };
  });
  return autoLayout(nodes);
}

// ─── Grafo ───────────────────────────────────────────────────────────────────

/** Profundidade (maior caminho desde uma raiz) de cada bloco. */
export function depths(nodes: FlowNode[]): Map<string, number> {
  const byKey = new Map(nodes.map((n) => [n.key, n]));
  const memo = new Map<string, number>();
  const visiting = new Set<string>();
  const depth = (k: string): number => {
    if (memo.has(k)) return memo.get(k) as number;
    if (visiting.has(k)) return 0;
    visiting.add(k);
    const n = byKey.get(k);
    const d = n && n.deps.length ? 1 + Math.max(...n.deps.filter((x) => byKey.has(x)).map(depth), -1) : 0;
    visiting.delete(k);
    memo.set(k, d);
    return d;
  };
  nodes.forEach((n) => depth(n.key));
  return memo;
}

/** Atribui posições por camadas aos blocos que ainda não têm. */
export function autoLayout(nodes: FlowNode[], force = false): FlowNode[] {
  const d = depths(nodes);
  const perLayer = new Map<number, number>();
  return nodes.map((n) => {
    const layer = d.get(n.key) ?? 0;
    const idx = perLayer.get(layer) ?? 0;
    perLayer.set(layer, idx + 1);
    if (!force && Number.isFinite(n.x) && Number.isFinite(n.y)) return n;
    return { ...n, x: 40 + layer * (NODE_W + 60), y: 40 + idx * (NODE_H + 40) };
  });
}

/** Ligar `from → to` criaria um ciclo se `to` já alcança `from`. */
export function wouldCycle(nodes: FlowNode[], from: string, to: string): boolean {
  if (from === to) return true;
  const children = new Map<string, string[]>();
  for (const n of nodes) for (const d of n.deps) children.set(d, [...(children.get(d) ?? []), n.key]);
  const seen = new Set<string>();
  const stack = [to];
  while (stack.length) {
    const k = stack.pop() as string;
    if (k === from) return true;
    if (seen.has(k)) continue;
    seen.add(k);
    stack.push(...(children.get(k) ?? []));
  }
  return false;
}

// ─── Canvas → servidor ───────────────────────────────────────────────────────

/** Etapas no formato do DTO (`order` por camadas; raízes arrancam logo). */
export function stepsToServer(nodes: FlowNode[]) {
  const d = depths(nodes);
  const sorted = [...nodes].sort(
    (a, b) => (d.get(a.key) ?? 0) - (d.get(b.key) ?? 0) || a.y - b.y || a.x - b.x,
  );
  const orderByKey = new Map(sorted.map((n, i) => [n.key, i]));

  return sorted.map((n, order) => {
    const cfg: Record<string, unknown> = {};
    if (n.type === 'TIMER') cfg.delayHours = Number(n.delayHours) || 0;
    if (n.type === 'WAIT_EVENT') cfg.eventName = n.eventName.trim();
    if (n.type === 'NOTIFICATION') {
      cfg.recipients = n.recipients;
      cfg.message = n.message.trim();
    }
    if (n.type === 'INTEGRATION') {
      cfg.module = n.integrationModule.trim();
      if (n.integrationEvent.trim()) cfg.event = n.integrationEvent.trim();
    }
    if (n.type === 'AUTO_ACTION') cfg.actions = actionsToServer(n.autoActions);
    if (n.type === 'DOCUMENT' && n.template.trim()) cfg.template = n.template.trim();

    const exit = conditionToServer(n.exit, orderByKey);
    const exitConditions = exit ?? (n.legacyExit ? parse<Record<string, unknown>>(n.legacyExit) ?? undefined : undefined);
    const deps = n.deps
      .map((k) => orderByKey.get(k))
      .filter((o): o is number => o !== undefined)
      .sort((a, b) => a - b);

    return {
      type: n.type,
      title: n.title.trim(),
      order,
      description: n.description.trim() || undefined,
      responsibleRole: n.responsibleRole.trim() || undefined,
      responsibleId: n.responsibleId ? Number(n.responsibleId) : undefined,
      reviewerId: n.reviewerId ? Number(n.reviewerId) : undefined,
      slaHours: n.slaHours ? Number(n.slaHours) : undefined,
      calendarMode: n.calendarMode,
      checklist: lines(n.checklist),
      requiresUpload: n.requiresUpload,
      requiredData: csv(n.requiredData),
      dependsOnOrders: deps,
      parallel: deps.length === 0,
      formSchema: parse<Record<string, unknown>>(n.formSchema) ?? undefined,
      exitConditions,
      entryConditions: conditionToServer(n.entry, orderByKey),
      config: Object.keys(cfg).length ? cfg : undefined,
      approverIds: n.type === 'REVIEW' ? n.approverIds.map(Number).filter(Boolean) : [],
      approvalMode: n.approvalMode,
      allowDelegation: n.allowDelegation,
      onReject: n.onReject,
      maxReturns: n.maxReturns !== '' ? Number(n.maxReturns) : undefined,
      successActions: actionsToServer(n.successActions),
      failureActions: actionsToServer(n.failureActions),
      escalationAfterHours: n.escalationAfterHours ? Number(n.escalationAfterHours) : undefined,
      escalationToId: n.escalationToId ? Number(n.escalationToId) : undefined,
      escalationToRole: n.escalationToRole.trim() || undefined,
      posX: Math.round(n.x),
      posY: Math.round(n.y),
    };
  });
}

/**
 * Campos de etapa que o modal simples de modelos não edita — devolvidos
 * tal como estão no servidor para que guardar o modal não os apague.
 */
export function stepExtras(s: ProcessStep) {
  const j = (raw: string | null | undefined) => parse<unknown>(raw) ?? undefined;
  return {
    config: j(s.config),
    entryConditions: j(s.entryConditions),
    requiredData: s.requiredData ?? [],
    approverIds: s.approverIds ?? [],
    approvalMode: s.approvalMode ?? 'SEQUENTIAL',
    allowDelegation: s.allowDelegation ?? true,
    onReject: s.onReject ?? 'HOLD',
    maxReturns: s.maxReturns ?? undefined,
    successActions: j(s.successActions) ?? [],
    failureActions: j(s.failureActions) ?? [],
    escalationAfterHours: s.escalationAfterHours ?? undefined,
    escalationToId: s.escalationToId ?? undefined,
    escalationToRole: s.escalationToRole ?? undefined,
    calendarMode: s.calendarMode ?? 'CALENDAR',
    posX: s.posX ?? undefined,
    posY: s.posY ?? undefined,
  };
}
