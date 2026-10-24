import { describe, expect, test, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const me = vi.fn();
vi.mock('./useCurrentUser', () => ({ useCurrentUser: () => me() }));

import { useCurrentRole, useHasRole } from './useCurrentRole';

beforeEach(() => me.mockReset());

describe('useHasRole', () => {
  test('true quando o papel está na lista', () => {
    me.mockReturnValue({ data: { role: { name: 'RH' } } });
    expect(renderHook(() => useHasRole(['ADMIN', 'RH'])).result.current).toBe(
      true,
    );
  });

  test('false quando o papel não está na lista', () => {
    me.mockReturnValue({ data: { role: { name: 'COLABORADOR' } } });
    expect(renderHook(() => useHasRole(['ADMIN', 'RH'])).result.current).toBe(
      false,
    );
  });

  test('false enquanto o utilizador não carregou (esconde a acção)', () => {
    me.mockReturnValue({ data: undefined });
    expect(renderHook(() => useCurrentRole()).result.current).toBeUndefined();
    expect(renderHook(() => useHasRole(['ADMIN'])).result.current).toBe(false);
  });
});
