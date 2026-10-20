'use client';

// hooks/useSpeech.ts
// Resposta por voz do Ísis com speechSynthesis do browser (grátis, sem
// backend). Expõe `charIndex` para o texto "acender" ao ritmo da voz.

import { useCallback, useEffect, useRef, useState } from 'react';

// Remove emojis e markdown para a voz não ler "asterisco asterisco".
export function toSpeakable(md: string): string {
  return md
    .replace(
      /[\u{1F1E6}-\u{1F1FF}\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{2190}-\u{21FF}️‍]/gu,
      '',
    )
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^\s*[-•]\s+/gm, '')
    .replace(/[*_#>~]+/g, ' ')
    .replace(/ +([.,!?;:])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

// Safari/iOS só deixa falar a partir de um toque: chamar no clique do
// microfone para a resposta (assíncrona) poder falar depois.
export function unlockSpeech(): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.speak(new SpeechSynthesisUtterance(''));
}

export function useSpeech(lang = 'pt-PT') {
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [charIndex, setCharIndex] = useState(0);
  // Nº de fronteiras de palavra recebidas: muda a cada evento, mesmo que o
  // `charIndex` repita o valor (ex.: primeira palavra, índice 0).
  const [boundaryCount, setBoundaryCount] = useState(0);
  const [spokenText, setSpokenText] = useState('');
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    setSupported(true);

    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      voiceRef.current =
        voices.find((v) => v.lang === lang) ??
        voices.find((v) => v.lang.startsWith('pt')) ??
        null;
    };
    pickVoice();
    window.speechSynthesis.addEventListener('voiceschanged', pickVoice);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', pickVoice);
      window.speechSynthesis.cancel();
    };
  }, [lang]);

  const stop = useCallback(() => {
    if (typeof window === 'undefined') return;
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  const speak = useCallback(
    (markdown: string) => {
      if (!supported) return;
      const text = toSpeakable(markdown);
      if (!text) return;

      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang;
      u.rate = 1;
      if (voiceRef.current) u.voice = voiceRef.current;

      setSpokenText(text);
      setCharIndex(0);
      setBoundaryCount(0);
      // já "a falar" para o modo conversa não reabrir o microfone no intervalo
      // até onstart.
      setSpeaking(true);

      u.onstart = () => setSpeaking(true);
      u.onboundary = (e) => {
        setCharIndex(e.charIndex);
        if (!e.name || e.name === 'word') setBoundaryCount((n) => n + 1);
      };
      u.onend = () => {
        setSpeaking(false);
        setCharIndex(text.length);
      };
      u.onerror = () => setSpeaking(false);

      window.speechSynthesis.speak(u);
    },
    [supported, lang],
  );

  return {
    supported,
    speaking,
    charIndex,
    boundaryCount,
    spokenText,
    speak,
    stop,
  };
}
