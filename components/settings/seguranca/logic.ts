// components/settings/seguranca/logic.ts
// Regras do separador «Segurança» (docs/modulo_settings.md §4) sem React:
// força e validação da senha, rótulos, e mapeamentos de apresentação do
// histórico de logins. Extraído de TabSeguranca.tsx.

import type { TwoFactorMode } from '../types';

export type ToastFn = (msg: string, type: 'success' | 'error') => void;

export const TWO_FACTOR_LABELS: Record<TwoFactorMode, string> = {
  OPTIONAL: 'Opcional',
  REQUIRED_PRIVILEGED: 'Obrigatório para perfis privilegiados',
  REQUIRED_ALL: 'Obrigatório para todos',
};

export const fmtDate = (iso: string): string =>
  new Date(iso).toLocaleString('pt-PT');

// ── Senha ───────────────────────────────────────────────────────────────────

export interface PasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const EMPTY_PASSWORD_FORM: PasswordFormValues = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

export const MIN_PASSWORD_LENGTH = 6;

/** 0 (vazia) a 4: comprimento ≥ 8, maiúscula, dígito e símbolo. */
export function passwordStrength(p: string): number {
  if (!p) return 0;
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return s;
}

/** Índice = passwordStrength(); o 0 não mostra nada. */
export const STRENGTH_STYLE = [
  { label: '', text: '', bar: '' },
  { label: 'Fraca', text: 'text-danger', bar: 'bg-danger' },
  { label: 'Razoável', text: 'text-warning', bar: 'bg-warning' },
  { label: 'Boa', text: 'text-primary', bar: 'bg-primary' },
  { label: 'Forte', text: 'text-success', bar: 'bg-success' },
] as const;

export function passwordTips(pw: string) {
  return [
    { text: 'Usa pelo menos 8 caracteres', ok: pw.length >= 8 },
    { text: 'Inclui letras maiúsculas', ok: /[A-Z]/.test(pw) },
    { text: 'Inclui números', ok: /[0-9]/.test(pw) },
    { text: 'Inclui caracteres especiais', ok: /[^A-Za-z0-9]/.test(pw) },
  ];
}

export const passwordsMismatch = (f: PasswordFormValues): boolean =>
  f.newPassword !== f.confirmPassword;

/** Mensagem de erro, ou null se a alteração pode ser enviada. */
export function validateNewPassword(f: PasswordFormValues): string | null {
  if (passwordsMismatch(f)) return 'As senhas não coincidem.';
  if (f.newPassword.length < MIN_PASSWORD_LENGTH) {
    return `A nova senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  }
  return null;
}

// ── 2FA ─────────────────────────────────────────────────────────────────────

/** Os códigos TOTP têm sempre 6 dígitos. */
export const isTotpCodeComplete = (code: string): boolean => code.length === 6;

// ── Histórico de logins ─────────────────────────────────────────────────────

export type LoginOutcome = 'ALL' | 'SUCCESS' | 'FAILED';

/** Os endpoints pessoais têm `/me/` no caminho; os da organização não. */
export const loginHistoryScope = (basePath: string): 'me' | 'all' =>
  basePath.includes('/me/') ? 'me' : 'all';

export const loginHistoryParams = (page: number, outcome: LoginOutcome) => ({
  page,
  ...(outcome !== 'ALL' && { outcome }),
});

export function loginActionIntent(
  action: string,
): 'success' | 'neutral' | 'danger' {
  if (action === 'LOGIN') return 'success';
  if (action === 'LOGOUT') return 'neutral';
  return 'danger';
}
