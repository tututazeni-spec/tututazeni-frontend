// hooks/useLessonAudio.test.ts
import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useLessonAudio } from './useLessonAudio';

const reportError = vi.fn();
vi.mock('@/lib/errorReporting', () => ({
  reportError: (...a: unknown[]) => reportError(...a),
}));

// ── Fake <audio> ──────────────────────────────────────────────────────────
class FakeAudio {
  static instances: FakeAudio[] = [];
  src: string;
  currentTime = 0;
  duration = 10;
  ontimeupdate: (() => void) | null = null;
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  play = vi.fn().mockResolvedValue(undefined);
  pause = vi.fn();
  constructor(src: string) {
    this.src = src;
    FakeAudio.instances.push(this);
  }
}

const realFetch = global.fetch;

function mockAudioResponse(status = 200, message?: string) {
  return {
    ok: status >= 200 && status < 300,
    status,
    blob: () => Promise.resolve(new Blob(['audio-bytes'], { type: 'audio/mpeg' })),
    json: () => Promise.resolve(message ? { message } : {}),
  };
}

beforeEach(() => {
  reportError.mockReset();
  FakeAudio.instances = [];
  vi.stubGlobal('Audio', FakeAudio as unknown as typeof Audio);
  (URL as unknown as { createObjectURL: unknown }).createObjectURL = vi.fn(
    () => 'blob:mock-url',
  );
  (URL as unknown as { revokeObjectURL: unknown }).revokeObjectURL = vi.fn();
  try {
    sessionStorage.clear();
  } catch {
    /* noop */
  }
});

afterEach(() => {
  global.fetch = realFetch;
  vi.unstubAllGlobals();
});

describe('useLessonAudio', () => {
  test('play() busca o áudio, monta o <audio> e passa a "playing"', async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockAudioResponse(200));
    global.fetch = fetchMock as unknown as typeof fetch;

    const { result } = renderHook(() => useLessonAudio(42));
    expect(result.current.state).toBe('idle');

    await act(async () => {
      await result.current.play();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/lessons/42/audio',
      expect.objectContaining({ method: 'GET', credentials: 'include' }),
    );
    expect(FakeAudio.instances).toHaveLength(1);
    expect(FakeAudio.instances[0].play).toHaveBeenCalled();
    expect(result.current.state).toBe('playing');
  });

  test('503 → estado "error" com a mensagem do backend, sem reportError', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue(
        mockAudioResponse(503, 'Leitura por voz não configurada'),
      ) as unknown as typeof fetch;

    const { result } = renderHook(() => useLessonAudio(7));
    await act(async () => {
      await result.current.play();
    });

    expect(result.current.state).toBe('error');
    expect(result.current.error).toBe('Leitura por voz não configurada');
    expect(reportError).not.toHaveBeenCalled();
  });

  test('erro 500 → estado "error" e reportError é chamado', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue(mockAudioResponse(500, 'Falha ao gerar áudio da aula')) as unknown as typeof fetch;

    const { result } = renderHook(() => useLessonAudio(9));
    await act(async () => {
      await result.current.play();
    });

    expect(result.current.state).toBe('error');
    expect(reportError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ source: 'useLessonAudio.play' }),
    );
  });

  test('segunda reprodução da mesma aula usa a cache — só um fetch', async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockAudioResponse(200));
    global.fetch = fetchMock as unknown as typeof fetch;

    const { result, unmount } = renderHook(() => useLessonAudio(100));
    await act(async () => {
      await result.current.play();
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // o FileReader do saveCachedAudio é assíncrono — esperar que a chave apareça
    await waitFor(() => {
      expect(sessionStorage.getItem('innova_lesson_audio_100')).toBeTruthy();
    });
    unmount();

    const second = renderHook(() => useLessonAudio(100));
    await act(async () => {
      await second.result.current.play();
    });
    expect(fetchMock).toHaveBeenCalledTimes(1); // sem novo pedido
    expect(second.result.current.state).toBe('playing');
  });

  test('pause() e stop() mudam o estado e chamam o <audio>', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue(mockAudioResponse(200)) as unknown as typeof fetch;

    const { result } = renderHook(() => useLessonAudio(1));
    await act(async () => {
      await result.current.play();
    });
    const audio = FakeAudio.instances[0];

    act(() => result.current.pause());
    expect(result.current.state).toBe('paused');
    expect(audio.pause).toHaveBeenCalled();

    act(() => result.current.stop());
    expect(result.current.state).toBe('idle');
    expect(result.current.progress).toBe(0);
  });
});
