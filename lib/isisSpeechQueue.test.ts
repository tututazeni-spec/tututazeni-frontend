import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSpeechQueue, extractSentences } from './isisSpeechQueue';
import { parseSseBuffer } from './aiMessageStream';

describe('extractSentences', () => {
  it('só devolve frases completas e guarda o resto', () => {
    const r = extractSentences('Olá, tudo bem? Estou aqui para aju');
    expect(r.sentences).toEqual(['Olá, tudo bem? ']);
    expect(r.rest).toBe('Estou aqui para aju');
  });

  it('flush devolve também a frase por acabar', () => {
    const r = extractSentences('Sem ponto final', true);
    expect(r.sentences).toEqual(['Sem ponto final']);
    expect(r.rest).toBe('');
  });

  it('não perde texto ao cortar ("1. ")', () => {
    const text = 'Passos: 1. Abre o curso e começa a lição. Fim.';
    const r = extractSentences(text, true);
    expect(r.sentences.join('')).toBe(text);
  });
});

describe('parseSseBuffer', () => {
  it('separa eventos completos e devolve o resto', () => {
    const r = parseSseBuffer(
      'event: token\ndata: {"t":"a"}\n\nevent: done\ndata: {"x":1}\n\nevent: tok',
    );
    expect(r.events).toEqual([
      { event: 'token', data: '{"t":"a"}' },
      { event: 'done', data: '{"x":1}' },
    ]);
    expect(r.rest).toBe('event: tok');
  });
});

describe('createSpeechQueue', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const pcm1s = () => new Uint8Array(32000);

  it('mostra o texto aos poucos, ao ritmo do áudio, e acaba em onIdle', async () => {
    const reveals: string[] = [];
    const sent: number[] = [];
    const onIdle = vi.fn();
    const q = createSpeechQueue({
      fetchSpeech: async () => pcm1s(),
      sendAudio: (c) => {
        sent.push(c.length);
        return true;
      },
      toSpeakable: (s) => s.trim(),
      onReveal: (t) => reveals.push(t),
      onIdle,
      onError: vi.fn(),
    });
    q.push('Olá a todos. Como estás hoje? ');
    q.finish();
    await vi.advanceTimersByTimeAsync(0);
    expect(sent.length).toBeGreaterThan(0);
    await vi.advanceTimersByTimeAsync(5000);
    expect(reveals.at(-1)).toBe('Olá a todos. Como estás hoje? ');
    expect(reveals[0]).not.toBe(reveals.at(-1));
    expect(onIdle).toHaveBeenCalledTimes(1);
  });

  it('se a voz falhar mostra o texto que faltava e não chama onIdle', async () => {
    const onError = vi.fn();
    const onIdle = vi.fn();
    const q = createSpeechQueue({
      fetchSpeech: async () => {
        throw new Error('503');
      },
      sendAudio: () => true,
      toSpeakable: (s) => s,
      onReveal: vi.fn(),
      onIdle,
      onError,
    });
    q.push('Uma frase completa aqui. ');
    q.finish();
    await vi.advanceTimersByTimeAsync(2000);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][1]).toBe('Uma frase completa aqui. ');
    expect(onIdle).not.toHaveBeenCalled();
  });
});
