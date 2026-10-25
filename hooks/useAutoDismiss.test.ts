import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAutoDismiss } from './useAutoDismiss';

describe('useAutoDismiss', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  test('chama onClose uma vez depois de ms', () => {
    const onClose = vi.fn();
    renderHook(() => useAutoDismiss(onClose, 1000));
    vi.advanceTimersByTime(999);
    expect(onClose).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('chama a versão mais recente de onClose, sem rearmar o timer', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderHook(({ cb }) => useAutoDismiss(cb, 1000), {
      initialProps: { cb: first },
    });
    vi.advanceTimersByTime(500);
    rerender({ cb: second });
    vi.advanceTimersByTime(500);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  test('não chama onClose se desmontar antes', () => {
    const onClose = vi.fn();
    const { unmount } = renderHook(() => useAutoDismiss(onClose, 1000));
    unmount();
    vi.advanceTimersByTime(2000);
    expect(onClose).not.toHaveBeenCalled();
  });
});
