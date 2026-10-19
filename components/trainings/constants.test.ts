import { describe, expect, test } from 'vitest';
import { NAV, TITLES } from './constants';

describe('navegação de Gestão de Formações', () => {
  test('tem o separador Certificados com título definido', () => {
    expect(NAV.some((n) => n.id === 'certificates')).toBe(true);
    expect(TITLES.certificates).toBe('Certificados');
  });
});
