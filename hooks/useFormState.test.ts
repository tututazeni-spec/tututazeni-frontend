import { describe, expect, test } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useFormState } from './useFormState';

const INITIAL = { title: '', capacity: 50, tags: [] as string[] };

describe('useFormState', () => {
  test('começa nos valores iniciais', () => {
    const { result } = renderHook(() => useFormState(INITIAL));
    expect(result.current.values).toEqual(INITIAL);
  });

  test('set altera só o campo indicado', () => {
    const { result } = renderHook(() => useFormState(INITIAL));
    act(() => result.current.set('title', 'Workshop'));
    expect(result.current.values).toEqual({ ...INITIAL, title: 'Workshop' });
  });

  test('set mantém a mesma referência entre renders', () => {
    const { result, rerender } = renderHook(() => useFormState(INITIAL));
    const first = result.current.set;
    rerender();
    expect(result.current.set).toBe(first);
  });

  test('reset volta aos valores iniciais', () => {
    const { result } = renderHook(() => useFormState(INITIAL));
    act(() => result.current.set('capacity', 10));
    act(() => result.current.reset());
    expect(result.current.values).toEqual(INITIAL);
  });
});

describe('useFormState — updater', () => {
  test('set aceita (actual) => novo, como o setState', () => {
    const { result } = renderHook(() => useFormState(INITIAL));
    act(() => result.current.set('tags', (t) => [...t, 'a']));
    act(() => result.current.set('tags', (t) => [...t, 'b']));
    expect(result.current.values.tags).toEqual(['a', 'b']);
  });
});
