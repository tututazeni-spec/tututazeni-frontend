// components/leave/settingsMeta.ts
// Rótulos e validações das Configurações do módulo Leave
// (docs/Modulo_Leave.md §10). As validações espelham leave-settings.service.ts:
// o backend é a autoridade, isto só evita o round-trip para erros óbvios.

import type { LeaveSettings } from './types';

export const SETTING_LABELS: Record<keyof LeaveSettings, string> = {
  referenceYear: 'Ano de referência',
  vacationWindowStart: 'Início do período de férias',
  vacationWindowEnd: 'Fim do período de férias',
  workWeekDays: 'Semana de trabalho',
  workdayStart: 'Início do horário',
  workdayEnd: 'Fim do horário',
  hoursPerDay: 'Horas por dia',
  dayCountRule: 'Regra de contagem de dias',
  justifiedOccurrenceTypes: 'Ocorrências justificadas',
  unjustifiedOccurrenceTypes: 'Ocorrências injustificadas',
  carryOverEnabled: 'Transição de dias activa',
  carryOverMaxDays: 'Limite global de transição',
  minNoticeDays: 'Antecedência mínima',
  maxAdvanceDays: 'Antecedência máxima',
  documentRequiredCategories: 'Categorias com documento obrigatório',
  substituteRequiredOverDays: 'Substituto obrigatório acima de (dias)',
  decisionSlaDays: 'Prazo de decisão',
  escalationAfterDays: 'Escalonamento após atraso',
  employeeCanCancelApproved: 'Colaborador cancela aprovados',
  cancelApprovedMinDaysBefore: 'Antecedência para cancelar aprovados',
  defaultMaxAbsencePercent: 'Cobertura: máx. ausentes por omissão',
  managerCanRegisterAbsences: 'Gestor regista ausências',
  managerCanValidateAbsences: 'Gestor valida ausências',
  syncAttendance: 'Sincronizar assiduidade',
  payrollFeedEnabled: 'Disponibilizar ao processamento salarial',
  notifyHrOnApproval: 'Notificar o RH nas aprovações',
};

export const DAY_COUNT_RULE_LABELS = {
  PER_TYPE: 'Conforme cada tipo de ausência',
  WORK_DAYS: 'Sempre dias úteis',
  CALENDAR_DAYS: 'Sempre dias de calendário',
} as const;

/** 0 = domingo … 6 = sábado (igual ao backend). */
export const WEEKDAYS: Array<{ value: number; short: string; label: string }> = [
  { value: 1, short: 'Seg', label: 'Segunda-feira' },
  { value: 2, short: 'Ter', label: 'Terça-feira' },
  { value: 3, short: 'Qua', label: 'Quarta-feira' },
  { value: 4, short: 'Qui', label: 'Quinta-feira' },
  { value: 5, short: 'Sex', label: 'Sexta-feira' },
  { value: 6, short: 'Sáb', label: 'Sábado' },
  { value: 0, short: 'Dom', label: 'Domingo' },
];

const sortedIfArray = (v: unknown) =>
  Array.isArray(v) ? [...v].sort() : v;

/** Só os campos que mudaram — é isto que se envia no PATCH. */
export function changedSettings(
  server: LeaveSettings,
  draft: LeaveSettings,
): Partial<LeaveSettings> {
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(draft) as Array<keyof LeaveSettings>) {
    if (
      JSON.stringify(sortedIfArray(server[k])) !==
      JSON.stringify(sortedIfArray(draft[k]))
    ) {
      out[k] = draft[k];
    }
  }
  return out as Partial<LeaveSettings>;
}

/** Mensagem do primeiro problema encontrado, ou null se o rascunho é válido. */
export function validateDraft(d: LeaveSettings): string | null {
  if (d.workWeekDays.length === 0) {
    return 'A semana de trabalho tem de ter pelo menos um dia útil.';
  }
  if (!!d.vacationWindowStart !== !!d.vacationWindowEnd) {
    return 'Indique o início e o fim do período de férias, ou nenhum.';
  }
  if (d.workdayEnd <= d.workdayStart) {
    return 'O fim do horário tem de ser posterior ao início.';
  }
  const clash = d.justifiedOccurrenceTypes.filter((t) =>
    d.unjustifiedOccurrenceTypes.includes(t),
  );
  if (clash.length > 0) {
    return 'Uma ocorrência não pode ser justificada e injustificada ao mesmo tempo.';
  }
  return null;
}

/** '' → null; número inteiro ≥ 0 → número (campos opcionais em dias). */
export function parseOptionalInt(raw: string): number | null {
  const t = raw.trim();
  if (t === '') return null;
  const n = Number(t);
  return Number.isInteger(n) && n >= 0 ? n : null;
}
