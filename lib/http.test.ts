import { describe, expect, it } from 'vitest';
import { readCsrfToken } from './http';

describe('readCsrfToken', () => {
  it('lê o csrf_token entre outros cookies', () => {
    expect(readCsrfToken('a=1; csrf_token=abc123; b=2')).toBe('abc123');
  });

  it('devolve null quando o cookie não existe', () => {
    expect(readCsrfToken('a=1; b=2')).toBeNull();
    expect(readCsrfToken('')).toBeNull();
  });

  it('não confunde cookies com nome parecido', () => {
    expect(readCsrfToken('x_csrf_token=nope')).toBeNull();
  });
});
