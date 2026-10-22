import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useLessonPdf } from './useLessonPdf';

vi.mock('@/lib/apiClient', () => ({ refreshSession: vi.fn() }));

const lesson = { id: 5, contentUrl: null, hasFile: true };

describe('useLessonPdf', () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:abc');
    URL.revokeObjectURL = vi.fn();
  });
  afterEach(() => vi.unstubAllGlobals());

  test('sem ficheiro não pede nada', () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const { result } = renderHook(() =>
      useLessonPdf({ id: 1, contentUrl: null, hasFile: false }),
    );
    expect(result.current.status).toBe('none');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test('URL externa passa directa, sem pedido', () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const { result } = renderHook(() =>
      useLessonPdf({
        id: 1,
        contentUrl: 'https://x.test/a.pdf',
        hasFile: true,
      }),
    );
    expect(result.current).toEqual({
      status: 'ready',
      src: 'https://x.test/a.pdf',
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test('PDF da plataforma vem de /lessons/:id/file com a sessão e vira object URL', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      blob: async () => new Blob(['%PDF-1'], { type: 'application/pdf' }),
    });
    vi.stubGlobal('fetch', fetchSpy);
    const { result } = renderHook(() => useLessonPdf(lesson));
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/lessons/5/file',
      expect.objectContaining({ credentials: 'include' }),
    );
    expect(result.current).toEqual({ status: 'ready', src: 'blob:abc' });
  });

  test('acesso negado mostra a mensagem do servidor e nunca um src', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ message: 'Não está matriculado neste curso' }),
      }),
    );
    const { result } = renderHook(() => useLessonPdf(lesson));
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current).toEqual({
      status: 'error',
      message: 'Não está matriculado neste curso',
    });
  });

  test('revoga o object URL ao desmontar', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        blob: async () => new Blob(['%PDF-1']),
      }),
    );
    const { result, unmount } = renderHook(() => useLessonPdf(lesson));
    await waitFor(() => expect(result.current.status).toBe('ready'));
    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:abc');
  });
});
