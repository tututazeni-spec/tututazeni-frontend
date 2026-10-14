import { describe, expect, it } from 'vitest';
import {
  IDLE_LIMIT_MS,
  REFRESH_EVERY_MS,
  decideTick,
} from './sessionActivity';

describe('decideTick', () => {
  const now = 10_000_000;

  it('termina a sessão após 30 min sem actividade', () => {
    expect(decideTick(now, now - IDLE_LIMIT_MS, now - 1000)).toBe('logout');
  });

  it('mantém a sessão se houve actividade há menos de 30 min', () => {
    expect(decideTick(now, now - IDLE_LIMIT_MS + 1000, now - 1000)).not.toBe(
      'logout',
    );
  });

  it('renova proactivamente quando há actividade e o último refresh é antigo', () => {
    expect(decideTick(now, now - 1000, now - REFRESH_EVERY_MS)).toBe('refresh');
  });

  it('não renova se não houve actividade desde o último refresh', () => {
    expect(
      decideTick(now, now - REFRESH_EVERY_MS - 5000, now - REFRESH_EVERY_MS),
    ).toBe('none');
  });

  it('não renova se o refresh é recente', () => {
    expect(decideTick(now, now - 500, now - 1000)).toBe('none');
  });
});
