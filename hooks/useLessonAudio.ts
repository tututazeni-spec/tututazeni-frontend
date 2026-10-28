'use client';

// hooks/useLessonAudio.ts
// "Ouvir a aula" — lê o texto da lição em voz alta com a voz nativa do
// browser (Web Speech API / speechSynthesis). Não usa serviços externos nem o
// backend. O texto é dividido em frases para contornar o corte de falas
// longas que o Chrome faz ao fim de ~15 s.

import { useState, useEffect, useRef, useCallback } from 'react';

export type LessonAudioState =
  'idle' | 'loading' | 'playing' | 'paused' | 'error';

const MAX_CHUNK = 220;

/** HTML ou texto simples → texto simples (sem etiquetas, espaços normalizados). */
export function toPlainText(input: string | null | undefined): string {
  if (!input) return '';
  let text = input;
  if (/<[a-z][\s\S]*>/i.test(input) && typeof DOMParser !== 'undefined') {
    const doc = new DOMParser().parseFromString(input, 'text/html');
    doc.querySelectorAll('script,style').forEach((n) => n.remove());
    doc
      .querySelectorAll('p,div,li,h1,h2,h3,h4,br,tr')
      .forEach((n) => n.append('\n'));
    text = doc.body.textContent ?? '';
  }
  return text
    .replace(/[ \t]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim();
}

/** Parte o texto em pedaços de frase com no máximo MAX_CHUNK caracteres. */
export function splitIntoChunks(text: string): string[] {
  const chunks: string[] = [];
  const sentences = text.match(/[^.!?\n]+[.!?]*\s*|\n/g) ?? [text];
  let current = '';
  const flush = () => {
    if (current.trim()) chunks.push(current.trim());
    current = '';
  };
  for (const s of sentences) {
    if (s === '\n') {
      flush();
      continue;
    }
    if (s.length > MAX_CHUNK) {
      flush();
      for (let i = 0; i < s.length; i += MAX_CHUNK) {
        chunks.push(s.slice(i, i + MAX_CHUNK).trim());
      }
      continue;
    }
    if ((current + s).length > MAX_CHUNK) flush();
    current += s;
  }
  flush();
  return chunks.filter(Boolean);
}

function pickPortugueseVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang.toLowerCase() === 'pt-pt') ??
    voices.find((v) => v.lang.toLowerCase().startsWith('pt')) ??
    null
  );
}

export interface UseLessonAudio {
  state: LessonAudioState;
  /** 0–100 */
  progress: number;
  error: string;
  play: () => Promise<void>;
  pause: () => void;
  stop: () => void;
}

export function useLessonAudio(
  lessonId: number,
  text: string | null | undefined,
): UseLessonAudio {
  const [state, setState] = useState<LessonAudioState>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  // Incrementa a cada início/paragem: callbacks de falas antigas ignoram-se.
  const runRef = useRef(0);

  const cancel = useCallback(() => {
    runRef.current += 1;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  // Parar ao desmontar e recomeçar do zero se a aula (ou o texto) mudar.
  useEffect(() => {
    setState('idle');
    setProgress(0);
    setError('');
    return cancel;
  }, [lessonId, text, cancel]);

  const play = useCallback(async () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setState('error');
      setError('Este browser não suporta leitura em voz alta.');
      return;
    }
    const synth = window.speechSynthesis;

    if (state === 'paused') {
      synth.resume();
      setState('playing');
      return;
    }

    const chunks = splitIntoChunks(toPlainText(text));
    if (chunks.length === 0) {
      setState('error');
      setError('Esta aula não tem texto para ler.');
      return;
    }

    cancel();
    const run = runRef.current;
    const total = chunks.reduce((n, c) => n + c.length, 0);
    const voice = pickPortugueseVoice();
    let done = 0;

    const speak = (i: number) => {
      if (run !== runRef.current) return;
      if (i >= chunks.length) {
        setState('idle');
        setProgress(100);
        return;
      }
      const u = new SpeechSynthesisUtterance(chunks[i]);
      u.lang = voice?.lang ?? 'pt-PT';
      if (voice) u.voice = voice;
      u.onend = () => {
        if (run !== runRef.current) return;
        done += chunks[i].length;
        setProgress(Math.round((done / total) * 100));
        speak(i + 1);
      };
      u.onerror = (e) => {
        if (run !== runRef.current) return;
        // "canceled"/"interrupted" vêm de pararmos nós.
        if (e.error === 'canceled' || e.error === 'interrupted') return;
        setState('error');
        setError('Não foi possível ler a aula em voz alta.');
      };
      synth.speak(u);
    };

    setProgress(0);
    setError('');
    setState('playing');
    speak(0);
  }, [state, text, cancel]);

  const pause = useCallback(() => {
    window.speechSynthesis?.pause();
    setState('paused');
  }, []);

  const stop = useCallback(() => {
    cancel();
    setState('idle');
    setProgress(0);
  }, [cancel]);

  return { state, progress, error, play, pause, stop };
}
