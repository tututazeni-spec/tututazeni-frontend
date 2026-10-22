import { describe, expect, it } from 'vitest';
import { nextPollInterval } from './polling';

describe('nextPollInterval', () => {
  it('mantém o intervalo base com a app saudável e activa', () => {
    expect(nextPollInterval(60_000, 0, 1_000)).toBe(60_000);
  });

  it('recua exponencialmente em erro, com tecto de x8', () => {
    expect(nextPollInterval(10_000, 1, 0)).toBe(20_000);
    expect(nextPollInterval(10_000, 2, 0)).toBe(40_000);
    expect(nextPollInterval(10_000, 6, 0)).toBe(80_000);
  });

  it('abranda x4 depois de 5 minutos sem actividade', () => {
    expect(nextPollInterval(30_000, 0, 5 * 60 * 1000)).toBe(120_000);
    expect(nextPollInterval(30_000, 0, 5 * 60 * 1000 - 1)).toBe(30_000);
  });

  it('combina erro e inactividade', () => {
    expect(nextPollInterval(30_000, 1, 10 * 60 * 1000)).toBe(240_000);
  });
});
