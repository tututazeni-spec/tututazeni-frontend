// components/avatar-training/useRoomVoice.ts
// Voz da Sala de Formação Virtual (docs/Avatar_Training.md §5): leitura em voz
// alta (servidor com chave só no backend; voz do navegador como alternativa),
// legendas sincronizadas e ditado por microfone (opcional). Tudo é acessório —
// a sessão funciona sempre por texto.

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { API_URL } from '@/lib/api';
import { apiClient } from '@/lib/apiClient';
import type { CaptionCue, CaptionsResponse } from './types';

export interface SpeakSource {
  stepKey?: string;
  aiMessageId?: number;
}

export interface RoomVoice {
  speaking: boolean;
  /** Legenda actual (sincronizada com o tempo estimado da leitura). */
  activeCue: string | null;
  engine: 'SERVER' | 'BROWSER' | null;
  speak: (text: string, source: SpeakSource) => Promise<void>;
  stop: () => void;
}

export const browserVoiceSupported = () =>
  typeof window !== 'undefined' && 'speechSynthesis' in window;

export function useRoomVoice({
  attemptId,
  enabled,
  captions,
  language,
}: {
  attemptId: number;
  enabled: boolean;
  captions: boolean;
  language: string;
}): RoomVoice {
  const [speaking, setSpeaking] = useState(false);
  const [activeCue, setActiveCue] = useState<string | null>(null);
  const [engine, setEngine] = useState<'SERVER' | 'BROWSER' | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const runRef = useRef(0);

  const clear = useCallback(() => {
    runRef.current += 1; // invalida leituras pendentes
    audioRef.current?.pause();
    audioRef.current = null;
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = '';
    }
    if (browserVoiceSupported()) window.speechSynthesis.cancel();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setSpeaking(false);
    setActiveCue(null);
    setEngine(null);
  }, []);

  useEffect(() => clear, [clear]);

  const speak = useCallback(
    async (text: string, source: SpeakSource) => {
      if (!enabled || !text.trim()) return;
      clear();
    const startCues = (cues: CaptionCue[], elapsedMs: () => number) => {
      if (!captions || cues.length === 0) return;
      timerRef.current = setInterval(() => {
        const t = elapsedMs();
        const cue = cues.find((c) => t >= c.startMs && t < c.endMs);
        setActiveCue(cue?.text ?? null);
      }, 150);
    };

      const run = runRef.current;
      setSpeaking(true);

      let cues: CaptionCue[] = [];
      if (captions && (source.stepKey || source.aiMessageId)) {
        try {
          const params: Record<string, string | number> = {};
          if (source.stepKey) params.stepKey = source.stepKey;
          if (source.aiMessageId) params.aiMessageId = source.aiMessageId;
          const res = await apiClient.get<CaptionsResponse>(
            `/avatar-training/attempts/${attemptId}/captions`,
            { params },
          );
          cues = res.cues;
        } catch {
          // Sem legendas sincronizadas: a transcrição continua visível na sala.
        }
      }
      if (run !== runRef.current) return;

      // 1) Voz do servidor (proxy) — com limites e fallback.
      try {
        const res = await fetch(`${API_URL}/avatar-training/attempts/${attemptId}/speech`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(source),
        });
        if (res.ok) {
          const blob = await res.blob();
          if (run !== runRef.current) return;
          const url = URL.createObjectURL(blob);
          urlRef.current = url;
          const audio = new Audio(url);
          audioRef.current = audio;
          audio.onended = clear;
          audio.onerror = clear;
          setEngine('SERVER');
          startCues(cues, () => audio.currentTime * 1000);
          await audio.play();
          return;
        }
      } catch {
        // cai para a voz do navegador
      }
      if (run !== runRef.current) return;

      // 2) Voz do navegador.
      if (browserVoiceSupported()) {
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = language;
        utter.onend = clear;
        utter.onerror = clear;
        const started = Date.now();
        setEngine('BROWSER');
        startCues(cues, () => Date.now() - started);
        window.speechSynthesis.speak(utter);
        return;
      }
      clear(); // sem voz disponível: modo texto
    },
    [attemptId, enabled, captions, language, clear],
  );

  return { speaking, activeCue, engine, speak, stop: clear };
}

// ── Microfone (ditado) ─────────────────────────────────────────────────────

interface RecognitionResultEvent {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}
interface Recognition {
  lang: string;
  interimResults: boolean;
  onresult: ((e: RecognitionResultEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
}
type RecognitionCtor = new () => Recognition;

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useDictation(language: string, onText: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const recRef = useRef<Recognition | null>(null);
  const supported = recognitionCtor() !== null;

  const stop = useCallback(() => {
    recRef.current?.stop();
    recRef.current = null;
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const Ctor = recognitionCtor();
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = language;
    rec.interimResults = false;
    rec.onresult = (e) => {
      const text = Array.from(e.results)
        .map((r) => r[0]?.transcript ?? '')
        .join(' ')
        .trim();
      if (text) onText(text);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  }, [language, onText]);

  useEffect(() => () => recRef.current?.stop(), []);

  return { supported, listening, toggle: () => (listening ? stop() : start()) };
}
