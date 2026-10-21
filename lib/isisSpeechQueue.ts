// lib/isisSpeechQueue.ts
// Fala e texto em simultâneo. Recebe o texto da Ísis em pedaços (streaming),
// corta-o em frases, pede a voz de cada frase assim que ela está completa e
// envia o áudio ao avatar por ordem. O texto de cada frase só aparece no chat
// quando o áudio dela começa a tocar, palavra a palavra ao ritmo da fala.
import { pcmDurationMs, splitPcm } from '@/lib/isisAvatarSpeech';

const MAX_PARALLEL_TTS = 3;
// Segmentos mais curtos juntam-se ao seguinte ("1.", "Sr.").
const MIN_SENTENCE_CHARS = 12;

/** Corta frases completas do buffer; o resto (frase por acabar) fica em `rest`. */
export function extractSentences(
  buffer: string,
  flush = false,
): { sentences: string[]; rest: string } {
  const sentences: string[] = [];
  const boundary = /[.!?…]+["')\]]*\s+|\n+/g;
  let start = 0;
  let match: RegExpExecArray | null;
  while ((match = boundary.exec(buffer))) {
    const end = match.index + match[0].length;
    const candidate = buffer.slice(start, end);
    if (candidate.trim().length < MIN_SENTENCE_CHARS && sentences.length > 0) {
      continue;
    }
    sentences.push(candidate);
    start = end;
  }
  let rest = buffer.slice(start);
  if (flush && rest.trim()) {
    sentences.push(rest);
    rest = '';
  }
  return { sentences, rest };
}

export interface SpeechQueueOptions {
  fetchSpeech: (spokenText: string) => Promise<Uint8Array>;
  sendAudio: (chunk: Uint8Array) => boolean;
  /** Markdown -> texto falável (sem asteriscos, emojis…). */
  toSpeakable: (markdown: string) => string;
  /** Texto visível até agora (sempre um prefixo da resposta). */
  onReveal: (visibleText: string) => void;
  /** Tudo dito e áudio terminado. */
  onIdle: () => void;
  /** A voz falhou: o texto que faltava é mostrado de uma vez. */
  onError: (err: unknown, remainingText: string) => void;
}

export interface SpeechQueue {
  push: (delta: string) => void;
  finish: () => void;
  cancel: () => void;
}

export function createSpeechQueue(opts: SpeechQueueOptions): SpeechQueue {
  let buffer = '';
  let full = '';
  let revealed = '';
  let cancelled = false;
  let failed = false;
  let playUntil = 0;
  let tail: Promise<void> = Promise.resolve();
  const timers = new Set<ReturnType<typeof setTimeout>>();

  let active = 0;
  const waiting: Array<() => void> = [];
  const acquire = () =>
    new Promise<void>((resolve) => {
      const take = () => {
        active++;
        resolve();
      };
      if (active < MAX_PARALLEL_TTS) take();
      else waiting.push(take);
    });
  const release = () => {
    active--;
    waiting.shift()?.();
  };

  const later = (fn: () => void, ms: number) => {
    const t = setTimeout(
      () => {
        timers.delete(t);
        if (!cancelled) fn();
      },
      Math.max(0, ms),
    );
    timers.add(t);
  };

  const fail = (err: unknown) => {
    if (failed || cancelled) return;
    failed = true;
    const remaining = full.slice(revealed.length);
    revealed = full;
    opts.onError(err, remaining);
  };

  const enqueue = (sentence: string) => {
    const spoken = opts.toSpeakable(sentence);
    if (!spoken) {
      // Sem nada para dizer (ex.: só markdown): mostra já.
      tail = tail.then(() => {
        revealed += sentence;
        const snapshot = revealed;
        later(() => opts.onReveal(snapshot), playUntil - Date.now());
      });
      return;
    }
    const audio = acquire().then(() =>
      opts.fetchSpeech(spoken).finally(release),
    );
    audio.catch(() => undefined); // o erro é tratado na cadeia abaixo
    tail = tail.then(async () => {
      if (cancelled || failed) return;
      let pcm: Uint8Array;
      try {
        pcm = await audio;
      } catch (e) {
        fail(e);
        return;
      }
      if (cancelled) return;
      for (const chunk of splitPcm(pcm)) opts.sendAudio(chunk);
      const duration = pcmDurationMs(pcm);
      const startAt = Math.max(Date.now(), playUntil);
      playUntil = startAt + duration;

      const base = revealed;
      const words = sentence.match(/\S+\s*/g) ?? [sentence];
      let shown = '';
      words.forEach((word, i) => {
        shown += word;
        const snapshot = base + shown;
        later(
          () => {
            if (!failed) opts.onReveal(snapshot);
          },
          startAt - Date.now() + (i * duration) / words.length,
        );
      });
      revealed = base + sentence;
    });
  };

  return {
    push(delta) {
      if (cancelled) return;
      buffer += delta;
      full += delta;
      const { sentences, rest } = extractSentences(buffer);
      buffer = rest;
      sentences.forEach(enqueue);
    },
    finish() {
      if (cancelled) return;
      const { sentences } = extractSentences(buffer, true);
      buffer = '';
      sentences.forEach(enqueue);
      void tail.then(() => {
        if (cancelled || failed) return;
        later(opts.onIdle, playUntil - Date.now() + 800);
      });
    },
    cancel() {
      cancelled = true;
      timers.forEach(clearTimeout);
      timers.clear();
    },
  };
}
