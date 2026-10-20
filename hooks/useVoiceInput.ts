'use client';

// hooks/useVoiceInput.ts
// Entrada por voz no Ísis: Web Speech API (Chrome, Edge, Safari). O texto
// final é entregue a `onFinal`, que o chat envia como uma pergunta normal.

import { useCallback, useEffect, useRef, useState } from 'react';

interface RecognitionResult {
  isFinal: boolean;
  0: { transcript: string };
}
interface RecognitionEvent {
  resultIndex: number;
  results: ArrayLike<RecognitionResult>;
}
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: RecognitionEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}
type RecognitionCtor = new () => Recognition;

export function useVoiceInput(onFinal: (text: string) => void, lang = 'pt-PT') {
  const recRef = useRef<Recognition | null>(null);
  const onFinalRef = useRef(onFinal);
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Referência estável: o reconhecimento não é recriado a cada render.
  useEffect(() => {
    onFinalRef.current = onFinal;
  }, [onFinal]);

  useEffect(() => {
    const w = window as unknown as {
      SpeechRecognition?: RecognitionCtor;
      webkitSpeechRecognition?: RecognitionCtor;
    };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return;

    const rec = new Ctor();
    rec.lang = lang;
    rec.continuous = false;
    rec.interimResults = true;

    rec.onresult = (e) => {
      let live = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) onFinalRef.current(r[0].transcript.trim());
        else live += r[0].transcript;
      }
      setInterim(live);
    };
    rec.onerror = (e) => {
      if (e.error !== 'no-speech' && e.error !== 'aborted') {
        setError(
          e.error === 'not-allowed'
            ? 'Permite o acesso ao microfone.'
            : 'Não foi possível ouvir. Tenta de novo.',
        );
      }
      setListening(false);
    };
    rec.onend = () => {
      setListening(false);
      setInterim('');
    };

    recRef.current = rec;
    setSupported(true);
    return () => {
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      try {
        rec.stop();
      } catch {
        // já parado
      }
    };
  }, [lang]);

  const toggle = useCallback(() => {
    const rec = recRef.current;
    if (!rec) return;
    setError(null);
    if (listening) {
      rec.stop();
    } else {
      try {
        rec.start();
        setListening(true);
      } catch {
        // start() duplicado enquanto ainda está a terminar
      }
    }
  }, [listening]);

  return { supported, listening, interim, error, toggle };
}
