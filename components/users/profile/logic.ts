// components/users/profile/logic.ts
// Regras de apresentação dos separadores do Perfil do Colaborador
// (docs/modulo_users.md Ponto 3) sem React: linhas dos cartões de dados,
// intenção dos badges por estado, classes de realce e pequenos cálculos.
// Extraído de ProfileTabs.tsx.

import type { ReactNode } from 'react';
import { formatDate as fmtDate } from '@/lib/format';
import { genderLabel } from '@/lib/gender';
import type {
  AccessOverview,
  AttendanceResponse,
  CareerProfile,
  User,
} from '../types';

/** Linha de um cartão de informação: rótulo e valor (vazio mostra «—»). */
export type InfoRow = [string, ReactNode];

export type BadgeIntent = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

// ── Dados pessoais e profissionais ──────────────────────────────────────────

export const identificationRows = (user: User): InfoRow[] => [
  ['Nome completo', user.fullName],
  ['Nome preferencial', user.preferredName],
  ['Género', genderLabel(user.gender)],
  ['Data de nascimento', user.birthDate && fmtDate(user.birthDate)],
  ['Nacionalidade', user.nationality],
  ['País de residência', user.country],
  ['Nº de identificação', user.identificationNumber],
  ['NIF', user.nif],
  ['NIB', user.nib],
];

export const contactRows = (user: User): InfoRow[] => [
  ['Email profissional', user.email],
  ['Email pessoal', user.personalEmail],
  ['Telefone', user.phone],
  ['Telefone alternativo', user.alternatePhone],
  ['Endereço', user.address],
  ['Contacto de emergência', user.emergencyContactName],
  ['Telefone de emergência', user.emergencyContactPhone],
];

export const employmentRows = (user: User): InfoRow[] => [
  ['Nº de colaborador', user.employeeNumber],
  ['Empresa', user.companyName],
  ['Área', user.area],
  ['Função', user.jobFunction],
  ['Categoria profissional', user.professionalCategory],
  ['Localização', user.workLocation],
  ['Data de admissão', user.hireDate && fmtDate(user.hireDate)],
  ['Data de saída', user.exitDate && fmtDate(user.exitDate)],
];

/** O estado do colaborador (badge) é acrescentado pela vista, no fim. */
export const regimeRows = (user: User): InfoRow[] => [
  ['Tipo de contrato', user.contractType],
  ['Regime de trabalho', user.workMode],
  ['Horário', user.workSchedule],
  ['Centro de custo', user.costCenter],
];

// ── Organização ─────────────────────────────────────────────────────────────

export const structureRows = (user: User): InfoRow[] => [
  ['Unidade', user.unit?.name],
  ['Empresa', user.companyName],
  ['Departamento', user.department?.name],
  ['Área', user.area],
  ['Cargo', user.position?.name],
];

export const subordinatesCount = (user: User): number =>
  user._count?.subordinates ?? 0;

/** A equipa directa só se pede (e mostra) a quem tem subordinados. */
export const hasTeam = (user: User): boolean => subordinatesCount(user) > 0;

export const overdueClass = (overdue: number): string =>
  overdue > 0 ? 'text-danger' : 'text-ink-faint';

// ── Acesso ──────────────────────────────────────────────────────────────────

export const accessProfileRows = (data: AccessOverview): InfoRow[] => [
  ['Perfil', data.profile?.name],
  ['Função no sistema', data.systemFunction],
  ['Nível de acesso a conteúdos', data.contentAccessLevel],
  ['MFA', data.mfaEnabled ? 'Activado' : 'Desactivado'],
];

export const accessSessionRows = (data: AccessOverview): InfoRow[] => [
  ['Data de criação da conta', fmtDate(data.accountCreatedAt)],
  [
    'Último login',
    data.lastLoginAt ? fmtDate(data.lastLoginAt) : 'Sem registo',
  ],
  ['Sessões activas', data.activeSessions],
  ['Dispositivos', 'Não disponível — não existe registo de dispositivos'],
  ['Tentativas de login', 'Não disponível — não existe registo de tentativas'],
  [
    'Histórico de bloqueios',
    'Não disponível — não existe histórico de bloqueios',
  ],
];

// ── Intenção dos badges por estado ──────────────────────────────────────────

const intentWhen =
  (target: string, yes: BadgeIntent, no: BadgeIntent) =>
  (status: string): BadgeIntent =>
    status === target ? yes : no;

/** Matrícula, avaliação 360° e PDI: concluído = verde, o resto = informativo. */
export const completedIntent = intentWhen('COMPLETED', 'success', 'info');
export const approvedIntent = intentWhen('APPROVED', 'success', 'info');
export const priorityIntent = intentWhen('HIGH', 'danger', 'neutral');
export const sensitivityIntent = intentWhen(
  'CONFIDENTIAL',
  'warning',
  'neutral',
);

export function attendanceIntent(status: string): BadgeIntent {
  if (status === 'PRESENT') return 'success';
  if (status === 'ABSENT') return 'danger';
  return 'warning';
}

// ── Competências, desempenho, formação ──────────────────────────────────────

/** Lacuna positiva (abaixo do alvo) a vermelho; sem lacuna a verde. */
export const gapClass = (gap: number | null | undefined): string =>
  gap && gap > 0 ? 'text-danger' : 'text-success';

export const QUALITATIVE_KEYS = [
  'strengths',
  'improvements',
  'recommendations',
] as const;

export type QualitativeKey = (typeof QUALITATIVE_KEYS)[number];

export const qualitativeTitle = (key: QualitativeKey): string =>
  key === 'strengths'
    ? 'Pontos fortes'
    : key === 'improvements'
      ? 'A melhorar'
      : 'Recomendações';

/** Sem permissão para ver a nota o backend devolve `null`. */
export const finalScoreLabel = (score: number | string | null | undefined) =>
  score ?? '— (sem permissão para ver)';

// ── Carreira, presenças, actividade ─────────────────────────────────────────

export const careerPlanRows = (data: CareerProfile): InfoRow[] => [
  ['Estado', data.careerPlan?.status ?? 'Sem plano activo'],
  ['Objectivos', data.careerPlan?.goals.length ?? 0],
];

/** O separador de presenças mostra só os 30 registos mais recentes. */
export const ATTENDANCE_VISIBLE = 30;

export const recentAttendance = (
  records: AttendanceResponse['records'],
): AttendanceResponse['records'] => records.slice(0, ATTENDANCE_VISIBLE);

export const percent = (n: number): string => `${n}%`;
