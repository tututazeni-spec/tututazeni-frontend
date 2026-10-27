// lib/format.test.ts
// Cobre a formatação de data/moeda/iniciais que estava duplicada em ~30
// páginas, com 3 implementações inconsistentes de Kwanza (AOA) entre si.
// Ver memory project_innova_component_separation_audit.

import { describe, expect, test } from 'vitest';
import {
  formatBytes,
  daysAgo,
  formatDate,
  formatDateNumeric,
  formatDateTimeNumeric,
  formatDateTimeShort,
  formatIsoDay,
  formatMoney,
  formatDateTime,
  formatKz,
  formatTime,
  getInitials,
  timeAgo,
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

  test('usa a primeira e a última palavra', () => {
    expect(getInitials('Ana Maria Silva Santos')).toBe('AS');
  });

  test('funciona com um nome de uma só palavra', () => {
    expect(getInitials('Madonna')).toBe('M');
  });
});

describe('formatKz', () => {
  // Nota: o separador de milhar do CLDR pt-AO é um espaço (não-quebrável),
  // não um ponto — verificado directamente com Intl, não assumido.
  test('formata com separador de milhar e sufixo AOA, sem casas decimais', () => {
    expect(formatKz(150000)).toBe('150 000 AOA');
  });

  test('trata 0 como valor válido, não como ausência de valor', () => {
    expect(formatKz(0)).toBe('0 AOA');
  });

  test('devolve — para null', () => {
    expect(formatKz(null)).toBe('—');
  });

  test('devolve — para undefined', () => {
    expect(formatKz(undefined)).toBe('—');
  });
});

describe('formatDateNumeric', () => {
  test('formata dd/mm/aaaa', () => {
    expect(formatDateNumeric('2024-03-05T12:00:00Z')).toBe('05/03/2024');
  });

  test('devolve — para vazio', () => {
    expect(formatDateNumeric(null)).toBe('—');
  });
});

describe('timeAgo', () => {
  const ago = (ms: number) => new Date(Date.now() - ms).toISOString();

  test.each([
    [10_000, 'agora mesmo'],
    [5 * 60_000, 'há 5min'],
    [3 * 3_600_000, 'há 3h'],
    [2 * 86_400_000, 'há 2 dias'],
  ])('%d ms atrás → %s', (ms, expected) => {
    expect(timeAgo(ago(ms))).toBe(expected);
  });

  test('devolve — para vazio', () => {
    expect(timeAgo(null)).toBe('—');
  });
});

describe('daysAgo', () => {
  const ago = (days: number) => new Date(Date.now() - days * 86_400_000 - 1000).toISOString();

  test('hoje / ontem / há N dias', () => {
    expect(daysAgo(new Date().toISOString())).toBe('hoje');
    expect(daysAgo(ago(1))).toBe('ontem');
    expect(daysAgo(ago(3))).toBe('há 3 dias');
  });

  test('com maxDays mostra a data a partir do limite', () => {
    expect(daysAgo(ago(10), { maxDays: 7 })).toBe(formatDate(ago(10)));
    expect(daysAgo(ago(3), { maxDays: 7 })).toBe('há 3 dias');
  });
});

describe('formatBytes', () => {
  test.each([
    [512, '512 B'],
    [1536, '1.5 KB'],
    [2 * 1024 ** 2, '2.0 MB'],
    [1.25 * 1024 ** 3, '1.25 GB'],
  ])('%d → %s', (n, expected) => {
    expect(formatBytes(n)).toBe(expected);
  });

  test('devolve — para null', () => {
    expect(formatBytes(null)).toBe('—');
  });
});

describe('getInitials (fallback)', () => {
  test('nome vazio devolve o fallback', () => {
    expect(getInitials('   ')).toBe('');
    expect(getInitials('', '?')).toBe('?');
  });
});

describe('formatDateTime com dateStyle/timeStyle', () => {
  test('não mistura com os campos por omissão', () => {
    expect(() =>
      formatDateTime('2024-03-05T12:00:00Z', { dateStyle: 'short', timeStyle: 'short' }),
    ).not.toThrow();
  });
});

describe('formatDateTimeNumeric', () => {
  test('formata dd/mm/aaaa, hh:mm', () => {
    expect(formatDateTimeNumeric('2024-03-05T12:00:00Z')).toMatch(/^05\/03\/2024,? \d{2}:\d{2}$/);
  });
  test('devolve — para vazio', () => {
    expect(formatDateTimeNumeric(null)).toBe('—');
  });
});

describe('formatIsoDay', () => {
  test('lê o dia da string, sem desvio de fuso', () => {
    expect(formatIsoDay('2026-03-05')).toBe('05/03/2026');
    expect(formatIsoDay('2026-03-05T23:59:59Z')).toBe('05/03/2026');
  });
  test('devolve — para vazio', () => {
    expect(formatIsoDay(null)).toBe('—');
  });
});

describe('formatMoney', () => {
  test('junta o número agrupado e a moeda', () => {
    expect(formatMoney(1500, 'USD')).toMatch(/^1.500 USD$/);
    expect(formatMoney(0)).toBe('0 AOA');
  });
  test('devolve — para null', () => {
    expect(formatMoney(null)).toBe('—');
  });
});

describe('formatDateTimeShort', () => {
  test('inclui data e hora', () => {
    expect(formatDateTimeShort('2024-03-05T12:00:00Z')).toMatch(/05.03.24/);
  });
  test('devolve — para vazio', () => {
    expect(formatDateTimeShort(null)).toBe('—');
  });
});
