import { describe, expect, it } from 'vitest';
import {
  EMPTY_PASSWORD_FORM,
  STRENGTH_STYLE,
  isTotpCodeComplete,
  loginActionIntent,
  loginHistoryParams,
  loginHistoryScope,
  passwordStrength,
  passwordTips,
  validateNewPassword,
} from './logic';

describe('passwordStrength', () => {
  it.each([
    ['', 0],
    ['abc', 0],
    ['abcdefgh', 1],
    ['Abcdefgh', 2],
    ['Abcdefg1', 3],
    ['Abcdef1!', 4],
    ['A1!', 3],
  ])('%j → %i', (pw, expected) => {
    expect(passwordStrength(pw)).toBe(expected);
  });

  it('cada nível tem estilo (o 0 não mostra nada)', () => {
    expect(STRENGTH_STYLE).toHaveLength(5);
    expect(STRENGTH_STYLE[0].label).toBe('');
    expect(STRENGTH_STYLE[4]).toMatchObject({
      label: 'Forte',
      bar: 'bg-success',
    });
  });
});

describe('passwordTips', () => {
  it('marca cada requisito cumprido', () => {
    expect(passwordTips('Abcdefg1').map((t) => t.ok)).toEqual([
      true,
      true,
      true,
      false,
    ]);
    expect(passwordTips('').every((t) => !t.ok)).toBe(true);
  });
});

describe('validateNewPassword', () => {
  const f = { ...EMPTY_PASSWORD_FORM, currentPassword: 'x' };

  it('senhas diferentes têm prioridade sobre o comprimento', () => {
    expect(
      validateNewPassword({ ...f, newPassword: 'ab', confirmPassword: 'abc' }),
    ).toBe('As senhas não coincidem.');
  });

  it('exige pelo menos 6 caracteres', () => {
    expect(
      validateNewPassword({
        ...f,
        newPassword: 'abcde',
        confirmPassword: 'abcde',
      }),
    ).toBe('A nova senha deve ter pelo menos 6 caracteres.');
  });

  it('aceita senhas iguais com 6+ caracteres', () => {
    expect(
      validateNewPassword({
        ...f,
        newPassword: 'abcdef',
        confirmPassword: 'abcdef',
      }),
    ).toBeNull();
  });
});

describe('2FA e histórico', () => {
  it('código TOTP completo tem 6 caracteres', () => {
    expect(isTotpCodeComplete('12345')).toBe(false);
    expect(isTotpCodeComplete('123456')).toBe(true);
  });

  it('âmbito vem do caminho', () => {
    expect(loginHistoryScope('/settings/security/me/login-history')).toBe('me');
    expect(loginHistoryScope('/settings/security/login-history')).toBe('all');
  });

  it('só envia outcome quando há filtro', () => {
    expect(loginHistoryParams(2, 'ALL')).toEqual({ page: 2 });
    expect(loginHistoryParams(1, 'FAILED')).toEqual({
      page: 1,
      outcome: 'FAILED',
    });
  });

  it('intent do badge por ação', () => {
    expect(loginActionIntent('LOGIN')).toBe('success');
    expect(loginActionIntent('LOGOUT')).toBe('neutral');
    expect(loginActionIntent('LOGIN_FAILED')).toBe('danger');
  });
});
