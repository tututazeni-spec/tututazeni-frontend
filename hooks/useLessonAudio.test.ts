// hooks/useLessonAudio.test.ts
// Voz nativa do browser (speechSynthesis) — sem rede nem ElevenLabs.
import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { splitIntoChunks, toPlainText, useLessonAudio } from './useLessonAudio';

class FakeUtterance {
  text: string;
  lang = '';
  voice: unknown = null;
  onend: (() => void) | null = null;
  onerror: ((e: { error: string }) => void) | null = null;
  constructor(text: string) {
    this.text = text;
  }
}

const spoken: FakeUtterance[] = [];
const synth = {
  speak: vi.fn((u: FakeUtterance) => spoken.push(u)),
  cancel: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  getVoices: vi.fn(() => [{ lang: 'pt-PT', name: 'Voz PT' }]),
};

beforeEach(() => {
  spoken.length = 0;
  Object.values(synth).forEach((f) => f.mockClear());
  vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
  Object.defineProperty(window, 'speechSynthesis', {
    value: synth,
    configurable: true,
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('toPlainText / splitIntoChunks', () => {
  test('remove etiquetas e scripts', () => {
    expect(toPlainText('<p>Olá <b>mundo</b></p><script>x()</script>')).toBe(
      'Olá mundo',
    );
  });

  test('parte em frases curtas', () => {
    const chunks = splitIntoChunks('Primeira frase. Segunda frase! Terceira?');
    expect(chunks.join(' ')).toContain('Segunda frase!');
    expect(chunks.every((c) => c.length <= 220)).toBe(true);
  });

  test('frase gigante é partida', () => {
    const chunks = splitIntoChunks('a'.repeat(500));
    expect(chunks.length).toBe(3);
  });
});

describe('useLessonAudio (voz nativa)', () => {
  test('play lê as frases em pt, em sequência, e termina em idle a 100%', async () => {
    const { result } = renderHook(() =>
      useLessonAudio(1, '<p>Olá. Adeus.</p>'),
    );
    await act(async () => {
      await result.current.play();
    });
    expect(result.current.state).toBe('playing');
    expect(spoken).toHaveLength(1);
    expect(spoken[0].lang).toBe('pt-PT');

    act(() => spoken[0].onend?.());
    expect(result.current.state).toBe('idle');
    expect(result.current.progress).toBe(100);
  });

  test('pausar e retomar usam pause/resume do browser', async () => {
    const { result } = renderHook(() => useLessonAudio(1, 'Texto simples.'));
    await act(async () => {
      await result.current.play();
    });
    act(() => result.current.pause());
    expect(synth.pause).toHaveBeenCalled();
    expect(result.current.state).toBe('paused');
    await act(async () => {
      await result.current.play();
    });
    expect(synth.resume).toHaveBeenCalled();
    expect(result.current.state).toBe('playing');
  });

  test('stop cancela e volta a idle', async () => {
    const { result } = renderHook(() => useLessonAudio(1, 'Texto simples.'));
    await act(async () => {
      await result.current.play();
    });
    act(() => result.current.stop());
    expect(synth.cancel).toHaveBeenCalled();
    expect(result.current.state).toBe('idle');
    expect(result.current.progress).toBe(0);
  });

  test('sem texto dá erro claro', async () => {
    const { result } = renderHook(() => useLessonAudio(1, ''));
    await act(async () => {
      await result.current.play();
    });
    expect(result.current.state).toBe('error');
    expect(result.current.error).toMatch(/não tem texto/i);
  });

  test('browser sem speechSynthesis dá erro claro', async () => {
    // @ts-expect-error remover para simular browser sem suporte
    delete window.speechSynthesis;
    const { result } = renderHook(() => useLessonAudio(1, 'Olá.'));
    await act(async () => {
      await result.current.play();
    });
    expect(result.current.state).toBe('error');
    expect(result.current.error).toMatch(/não suporta/i);
  });

  test('mudar de aula pára a leitura', async () => {
    const { result, rerender } = renderHook(
      ({ id }) => useLessonAudio(id, 'Texto.'),
      { initialProps: { id: 1 } },
    );
    await act(async () => {
      await result.current.play();
    });
    rerender({ id: 2 });
    expect(synth.cancel).toHaveBeenCalled();
    expect(result.current.state).toBe('idle');
  });
});
