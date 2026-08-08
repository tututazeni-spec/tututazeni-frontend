// lib/format.test.ts
// Cobre a formatação de data/moeda/iniciais que estava duplicada em ~30
// páginas, com 3 implementações inconsistentes de Kwanza (AOA) entre si.
// Ver memory project_innova_component_separation_audit.

import { describe, expect, test } from 'vitest';
import {
  formatDate,
  formatDateTime,
  formatKz,
  formatTime,
  getInitials,
} from './format';

describe('formatDate', () => {
  // Nota: o CLDR do pt-AO devolve dd/MM/aaaa para { month: 'short' } (sem
  // abreviatura textual do mês) — verificado directamente com Intl, não
  // assumido. Coincide com a convenção dd/MM/yyyy documentada para Angola.
  test('formata no padrão por omissão (dd/MM/aaaa)', () => {
    expect(formatDate('2024-03-05T00:00:00Z')).toBe('05/03/2024');
  });

  test('devolve — para valor nulo', () => {
    expect(formatDate(null)).toBe('—');
  });

  test('devolve — para valor undefined', () => {
    expect(formatDate(undefined)).toBe('—');
  });

  test('devolve — para string vazia', () => {
    expect(formatDate('')).toBe('—');
  });

  test('aceita um objecto Date directamente', () => {
    expect(formatDate(new Date('2024-03-05T00:00:00Z'))).toBe('05/03/2024');
  });

  test('permite sobrepor opções (ex: incluir o dia da semana)', () => {
    expect(formatDate('2024-03-05T00:00:00Z', { weekday: 'short' })).toContain(
      '05/03/2024',
    );
  });
});

describe('formatDateTime', () => {
  test('inclui hora e minuto', () => {
    expect(formatDateTime('2024-03-05T14:30:00Z')).toMatch(/\d{2}:\d{2}/);
  });

  test('devolve — para valor nulo', () => {
    expect(formatDateTime(null)).toBe('—');
  });
});

describe('formatTime', () => {
  test('formata só hora e minuto', () => {
    expect(formatTime('2024-03-05T14:30:00Z')).toMatch(/^\d{2}:\d{2}$/);
  });

  test('devolve — para valor nulo', () => {
    expect(formatTime(null)).toBe('—');
  });
});

describe('getInitials', () => {
  test('devolve as iniciais das duas primeiras palavras em maiúsculas', () => {
    expect(getInitials('Ana Silva')).toBe('AS');
  });

  test('ignora palavras a partir da terceira', () => {
    expect(getInitials('Ana Maria Silva Santos')).toBe('AM');
  });

  test('funciona com um nome de uma só palavra', () => {
    expect(getInitials('Madonna')).toBe('M');
  });
});

describe('formatKz', () => {
  // Nota: o separador de milhar do CLDR pt-AO é um espaço (não-quebrável),
  // não um ponto — verificado directamente com Intl, não assumido.
  test('formata com separador de milhar e sufixo Kz, sem casas decimais', () => {
    expect(formatKz(150000)).toBe('150 000 Kz');
  });

  test('trata 0 como valor válido, não como ausência de valor', () => {
    expect(formatKz(0)).toBe('0 Kz');
  });

  test('devolve — para null', () => {
    expect(formatKz(null)).toBe('—');
  });

  test('devolve — para undefined', () => {
    expect(formatKz(undefined)).toBe('—');
  });
});
