// components/automation/flowForm.ts
// Formulário do Construtor de Fluxos como dado puro: tipo, valores iniciais e
// o mapeamento regra-do-servidor → formulário. Antes este mapeamento vivia num
// useEffect com 21 setters dentro de FlowBuilder.tsx, sem forma de o testar.

import { normaliseFlow, type FlowStep } from './flow';
import type { AutomationRuleDetail } from './types';

/** Sentinela do Select "Categoria": sem categoria. */
export const NONE = '__none__';

export interface ConditionRow {
  field: string;
  operator: string;
  value: string;
}

export interface FlowForm {
  // A. Informações gerais
  name: string;
  description: string;
  category: string;
  moduleName: string;
  ownerId: string;
  priority: string;
  tags: string;
  // B-C. Gatilho e condições
  trigger: string;
  conditions: ConditionRow[];
  conditionsLogic: string;
  // D. Fluxo
  steps: FlowStep[];
  // E. Regras de execução
  retryPolicy: string;
  maxRetries: string;
  retryDelay: string;
  errorHandling: string;
  notifyOnError: boolean;
  activeFrom: string;
  activeUntil: string;
  notes: string;
  // Estado da regra carregada (decide o texto/acção de publicar)
  wasDraft: boolean;
  wasActive: boolean;
}

export const EMPTY_FLOW_FORM: FlowForm = {
  name: '',
  description: '',
  category: NONE,
  moduleName: '',
  ownerId: '',
  priority: '2',
  tags: '',
  trigger: '',
  conditions: [],
  conditionsLogic: 'AND',
  steps: [],
  retryPolicy: 'NONE',
  maxRetries: '3',
  retryDelay: '5',
  errorHandling: 'NOTIFY_OWNER',
  notifyOnError: true,
  activeFrom: '',
  activeUntil: '',
  notes: '',
  wasDraft: true,
  wasActive: false,
};

export function flowFormFromDetail(detail: AutomationRuleDetail): FlowForm {
  return {
    name: detail.name,
    description: detail.description ?? '',
    category: detail.category ?? NONE,
    moduleName: detail.module ?? '',
    ownerId: detail.ownerId ?? '',
    priority: String(Math.min(detail.priority ?? 2, 3)),
    tags: (detail.tags ?? []).join(', '),
    trigger: detail.trigger,
    conditions: (detail.conditions ?? []).map((c) => ({
      field: c.field,
      operator: c.operator,
      value: c.value ?? '',
    })),
    conditionsLogic: detail.conditionsLogic ?? 'AND',
    steps: detail.flow
      ? normaliseFlow(detail.flow)
      : [
          {
            id: 'legacy',
            type: 'action',
            action: detail.action,
            params: detail.actionParams ?? {},
          },
        ],
    retryPolicy: detail.retryPolicy ?? 'NONE',
    maxRetries: String(detail.maxRetries ?? 3),
    retryDelay: String(detail.retryDelayMinutes ?? 5),
    errorHandling: detail.errorHandling ?? 'NOTIFY_OWNER',
    notifyOnError: detail.notifyOnError ?? true,
    activeFrom: detail.activeFrom ? detail.activeFrom.slice(0, 10) : '',
    activeUntil: detail.activeUntil ? detail.activeUntil.slice(0, 10) : '',
    notes: detail.notes ?? '',
    wasDraft: !!detail.draft,
    wasActive: detail.active,
  };
}
