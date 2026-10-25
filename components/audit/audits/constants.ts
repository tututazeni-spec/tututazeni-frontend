// components/audit/audits/constants.ts
// Rótulos e opções do separador «Auditorias e Inspeções».

import { SEVERITY_CFG } from '../constants';
import type {
  InternalAuditStatus,
  InternalAuditType,
  Severity,
} from '../types';

export type BadgeIntent = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export const STATUS: Record<
  InternalAuditStatus,
  { label: string; intent: BadgeIntent }
> = {
  PLANNED: { label: 'Planeada', intent: 'neutral' },
  PREPARING: { label: 'Em preparação', intent: 'info' },
  IN_PROGRESS: { label: 'Em execução', intent: 'warning' },
  IN_REVIEW: { label: 'Em revisão', intent: 'info' },
  AWAITING_CORRECTIVE_ACTIONS: {
    label: 'A aguardar ações corretivas',
    intent: 'warning',
  },
  COMPLETED: { label: 'Concluída', intent: 'success' },
  CANCELLED: { label: 'Cancelada', intent: 'danger' },
};

export const TYPES: Array<{ value: InternalAuditType; label: string }> = [
  { value: 'INTERNAL', label: 'Interna' },
  { value: 'OPERATIONAL', label: 'Operacional' },
  { value: 'COMPLIANCE', label: 'Conformidade' },
  { value: 'SECURITY', label: 'Segurança' },
];
export const typeLabel = (t: string) =>
  TYPES.find((x) => x.value === t)?.label ?? t;

export const RESULTS = [
  { value: 'CONFORME', label: 'Conforme' },
  { value: 'CONFORME_COM_RESERVAS', label: 'Conforme com reservas' },
  { value: 'NAO_CONFORME', label: 'Não conforme' },
];
export const resultLabel = (r: string | null) =>
  RESULTS.find((x) => x.value === r)?.label ?? '—';

export const CHECK_STATUS = [
  { value: 'PENDING', label: 'Por verificar' },
  { value: 'PASSED', label: 'Conforme' },
  { value: 'FAILED', label: 'Não conforme' },
  { value: 'NOT_APPLICABLE', label: 'Não aplicável' },
];
export const ACTION_STATUS = [
  { value: 'OPEN', label: 'Aberta' },
  { value: 'IN_PROGRESS', label: 'Em curso' },
  { value: 'DONE', label: 'Concluída' },
];
export const RISK_ITEMS = (
  ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as Severity[]
).map((s) => ({ value: s, label: SEVERITY_CFG[s].label }));

const labelOf = (items: Array<{ value: string; label: string }>, v: string) =>
  items.find((s) => s.value === v)?.label;

export const checkStatusLabel = (status: string) =>
  labelOf(CHECK_STATUS, status);
export const actionStatusLabel = (status: string) =>
  labelOf(ACTION_STATUS, status);
