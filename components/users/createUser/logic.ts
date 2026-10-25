// components/users/createUser/logic.ts
// Regras do formulário «Novo Utilizador» (docs/modulo_users.md Ponto 2) sem
// React: valores iniciais, corpo do pedido, validação da fotografia e as
// regras do verificador de email do tenant. Extraído de CreateUserView.tsx.

import type { DirectoryUser } from '../types';

/** Limite da fotografia carregada por ficheiro (3 MB). */
export const MAX_PHOTO_BYTES = 3 * 1024 * 1024;

/**
 * Valores iniciais do formulário. O tipo `UserFormValues` deriva daqui (em vez
 * de uma interface) para ser aceite por useFormValidation, que exige
 * `Record<string, unknown>`.
 */
export const INITIAL_USER_FORM = {
  fullName: '',
  preferredName: '',
  avatarUrl: '',
  gender: '',
  birthDate: '',
  nationality: '',
  country: '',
  identificationNumber: '',
  nif: '',
  employeeNumber: '',
  companyName: '',
  unitId: '',
  departmentId: '',
  area: '',
  positionId: '',
  jobFunction: '',
  professionalCategory: '',
  workLocation: '',
  hireDate: '',
  contractType: '',
  workMode: '',
  hrStatus: 'ACTIVE',
  email: '',
  personalEmail: '',
  phone: '',
  alternatePhone: '',
  address: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  password: '',
  username: '',
  roleId: '',
  systemFunction: '',
  accountStatus: 'PENDING',
  mfaEnabled: false,
  language: 'pt',
  timezone: 'Africa/Luanda',
  learningProfile: '',
  isInstructor: false,
  contentAccessLevel: '',
  courseIds: [] as number[],
  learningPathIds: [] as number[],
  competencyIds: [] as number[],
  additionalPermissionIds: [] as number[],
  costCenter: '',
  exitDate: '',
  workSchedule: '',
};

export type UserFormValues = typeof INITIAL_USER_FORM;

/** Chaves de UserFormValues cujo valor é string — as únicas que um <input> de
 *  texto pode escrever com segurança. */
export type StringKeys = {
  [K in keyof UserFormValues]: UserFormValues[K] extends string ? K : never;
}[keyof UserFormValues];

export function numOrUndefined(v: string): number | undefined {
  return v ? parseInt(v, 10) : undefined;
}

const orUndefined = <T>(list: T[]): T[] | undefined =>
  list.length ? list : undefined;

/**
 * Corpo de POST /users. Campos opcionais em branco vão como undefined, nunca
 * "": um "" em employeeNumber/username (String? @unique no backend) colide no
 * 2.º utilizador criado sem esse campo.
 */
export function buildCreateUserPayload(
  form: UserFormValues,
  managerId: number | undefined,
) {
  return {
    fullName: form.fullName,
    email: form.email,
    password: form.password || undefined,
    preferredName: form.preferredName || undefined,
    avatarUrl: form.avatarUrl || undefined,
    gender: form.gender || undefined,
    birthDate: form.birthDate || undefined,
    nationality: form.nationality || undefined,
    country: form.country || undefined,
    identificationNumber: form.identificationNumber || undefined,
    nif: form.nif || undefined,
    employeeNumber: form.employeeNumber || undefined,
    companyName: form.companyName || undefined,
    unitId: numOrUndefined(form.unitId),
    departmentId: numOrUndefined(form.departmentId),
    area: form.area || undefined,
    positionId: numOrUndefined(form.positionId),
    jobFunction: form.jobFunction || undefined,
    professionalCategory: form.professionalCategory || undefined,
    workLocation: form.workLocation || undefined,
    hireDate: form.hireDate || undefined,
    contractType: form.contractType || undefined,
    workMode: form.workMode || undefined,
    hrStatus: form.hrStatus || undefined,
    managerId,
    phone: form.phone || undefined,
    personalEmail: form.personalEmail || undefined,
    alternatePhone: form.alternatePhone || undefined,
    address: form.address || undefined,
    emergencyContactName: form.emergencyContactName || undefined,
    emergencyContactPhone: form.emergencyContactPhone || undefined,
    username: form.username || undefined,
    roleId: numOrUndefined(form.roleId),
    systemFunction: form.systemFunction || undefined,
    accountStatus: form.accountStatus || undefined,
    mfaEnabled: form.mfaEnabled,
    language: form.language || undefined,
    timezone: form.timezone || undefined,
    learningProfile: form.learningProfile || undefined,
    isInstructor: form.isInstructor,
    contentAccessLevel: form.contentAccessLevel || undefined,
    courseIds: orUndefined(form.courseIds),
    learningPathIds: orUndefined(form.learningPathIds),
    competencyIds: orUndefined(form.competencyIds),
    additionalPermissionIds: orUndefined(form.additionalPermissionIds),
    costCenter: form.costCenter || undefined,
    exitDate: form.exitDate || undefined,
    workSchedule: form.workSchedule || undefined,
  };
}

// ── Fotografia ──────────────────────────────────────────────────────────────

export const isPhotoTooLarge = (sizeBytes: number): boolean =>
  sizeBytes > MAX_PHOTO_BYTES;

/** Fotografia carregada por ficheiro (data URL) em vez de ligação. */
export const isUploadedPhoto = (avatarUrl: string): boolean =>
  avatarUrl.startsWith('data:');

// ── Verificador de email do tenant ──────────────────────────────────────────

/** Resposta de GET /users/email-check (formato de email do tenant). */
export interface EmailCheck {
  enforced: boolean;
  domain: string | null;
  mode: 'SUGGEST' | 'ENFORCE' | null;
  suggestion: string | null;
  violations: string[];
  taken: boolean;
  alternatives: string[];
}

/** O verificador só corre com um nome minimamente completo. */
export const canCheckEmail = (debouncedName: string): boolean =>
  debouncedName.length >= 2;

/**
 * A sugestão preenche o email enquanto o Admin não o editar à mão e só se
 * ainda não for o valor actual (evita reescrever em ciclo).
 */
export function shouldApplyEmailSuggestion(
  suggestion: string | null | undefined,
  emailEdited: boolean,
  currentEmail: string,
): suggestion is string {
  return !!suggestion && !emailEdited && currentEmail !== suggestion;
}

export const emailHint = (check: EmailCheck | undefined): string | undefined =>
  check?.enforced && check.domain
    ? `Formato da organização: nome.apelido@${check.domain}`
    : undefined;

/**
 * Só mostra a violação do email que já foi verificado: enquanto o utilizador
 * escreve (email actual ≠ email verificado) o erro anterior fica escondido.
 */
export const emailViolation = (
  check: EmailCheck | undefined,
  currentEmail: string,
  checkedEmail: string,
): string | undefined =>
  check?.enforced && currentEmail.trim() === checkedEmail
    ? check.violations[0]
    : undefined;

export const isEmailTaken = (check: EmailCheck | undefined): boolean =>
  !!check?.enforced && check.taken;

export const takenEmailMessage = (alternatives: string[]): string =>
  alternatives.length > 0
    ? 'Escolha uma das alternativas livres ou edite o email.'
    : 'Edite o email para um que ainda não exista.';

// ── Gestor directo ──────────────────────────────────────────────────────────

/** A pesquisa só corre depois de escrever, e não depois de escolher alguém. */
export const shouldSearchManagers = (
  selected: DirectoryUser | null,
  search: string,
): boolean => !selected && search.trim().length > 0;

export const managerSubtitle = (u: DirectoryUser): string =>
  u.department?.name ?? u.email ?? '—';
