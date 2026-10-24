import { describe, expect, test } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useServerDraft } from './useServerDraft';

describe('useServerDraft', () => {
  test('começa a null e inicializa logo no primeiro render com dados', () => {
    const { result, rerender } = renderHook(
      ({ src }: { src?: { a: number } }) => useServerDraft(src),
      { initialProps: {} as { src?: { a: number } } },
    );
    expect(result.current[0]).toBeNull();
    rerender({ src: { a: 1 } });
    expect(result.current[0]).toEqual({ a: 1 });
  });

  test('edições locais sobrevivem a re-render com a mesma referência', () => {
    const src = { a: 1 };
    const { result, rerender } = renderHook(() => useServerDraft(src));
    act(() => result.current[1]({ a: 99 }));
    rerender();
    expect(result.current[0]).toEqual({ a: 99 });
  });

  test('repõe o rascunho quando a fatia muda de referência', () => {
    const { result, rerender } = renderHook(({ src }) => useServerDraft(src), {
      initialProps: { src: { a: 1 } },
    });
    act(() => result.current[1]({ a: 99 }));
    rerender({ src: { a: 2 } });
    expect(result.current[0]).toEqual({ a: 2 });
  });

  test('aplica toDraft', () => {
    const src = ['x', 'y']; // referência estável: ver aviso no hook
    const { result } = renderHook(() =>
      useServerDraft<string, string[]>(src, (s) => s.join(', ')),
    );
    expect(result.current[0]).toBe('x, y');
  });
});
