// components/ai-tutor/LipSyncPortrait.tsx
// Retrato da Ísis com a boca a mexer ao ritmo da voz. O speechSynthesis só
// dá eventos por palavra (`charIndex`), por isso entre eventos avança-se um
// cursor estimado pelo texto e cada carácter é convertido num dos visemas
// (ver visemes.ts). As poses sobrepõem-se e fazem cross-fade; um visema sem
// imagem usa o "pai" ou o retrato de boca fechada/aberta que já existe.
// Por cima, a Ísis pisca (PNG transparente) e, fora da fala, muda de expressão.

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import {
  BLINK_SRC,
  EXPRESSIONS,
  FALLBACK_CLOSED,
  FALLBACK_OPEN,
  PARENT_VISEME,
  VISEMES,
  expressionSrc,
  fallbackFor,
  textToVisemes,
  visemeSrc,
  type Expression,
  type Viseme,
} from './visemes';

const TICK_MS = 60;
// Caracteres falados por segundo (voz a rate 1); o cursor realinha a cada palavra.
const CHARS_PER_SEC = 14;
const BLINK_MS = 130;
const SMILE_AFTER_SPEECH_MS = 2500;

interface LipSyncPortraitProps {
  speaking: boolean;
  text: string;
  charIndex: number;
  /** A Ísis está a pensar na resposta. */
  thinking?: boolean;
  className?: string;
}

export function LipSyncPortrait({
  speaking,
  text,
  charIndex,
  thinking = false,
  className = '',
}: LipSyncPortraitProps) {
  const [viseme, setViseme] = useState<Viseme>('rest');
  const [blinking, setBlinking] = useState(false);
  const [smiling, setSmiling] = useState(false);
  // Imagens que não existem (404) — sobem-se na cadeia de fallback.
  const [missing, setMissing] = useState<ReadonlySet<string>>(new Set());
  const cursor = useRef(0);
  const visemes = useMemo(() => textToVisemes(text), [text]);
  const visemesRef = useRef(visemes);
  visemesRef.current = visemes;

  // Cada fronteira de palavra realinha o cursor com a voz real.
  useEffect(() => {
    cursor.current = charIndex;
  }, [charIndex]);

  useEffect(() => {
    if (!speaking) {
      setViseme('rest');
      return;
    }
    const step = (CHARS_PER_SEC * TICK_MS) / 1000;
    const t = setInterval(() => {
      const list = visemesRef.current;
      setViseme(list[Math.floor(cursor.current)] ?? 'rest');
      cursor.current = Math.min(cursor.current + step, list.length - 1);
    }, TICK_MS);
    return () => clearInterval(t);
  }, [speaking]);

  // Piscar a cada 3–6 s, a qualquer momento (também a falar).
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(
        () => {
          setBlinking(true);
          timer = setTimeout(() => {
            setBlinking(false);
            schedule();
          }, BLINK_MS);
        },
        3000 + Math.random() * 3000,
      );
    };
    schedule();
    return () => clearTimeout(timer);
  }, []);

  // Sorriso breve quando acaba de falar.
  const wasSpeaking = useRef(false);
  useEffect(() => {
    if (speaking) {
      wasSpeaking.current = true;
      setSmiling(false);
      return;
    }
    if (!wasSpeaking.current) return;
    wasSpeaking.current = false;
    setSmiling(true);
    const t = setTimeout(() => setSmiling(false), SMILE_AFTER_SPEECH_MS);
    return () => clearTimeout(t);
  }, [speaking]);

  const markMissing = (src: string) =>
    setMissing((prev) => new Set(prev).add(src));

  // Imagem da boca: própria → visema pai → retrato aberto/fechado.
  const mouthSrc = (): string => {
    let v: Viseme | undefined = viseme;
    while (v && v !== 'rest') {
      if (!missing.has(visemeSrc(v))) return visemeSrc(v);
      v = PARENT_VISEME[v];
    }
    return fallbackFor(viseme);
  };

  const expression: Expression | null = speaking
    ? null
    : thinking
      ? 'thinking'
      : smiling
        ? 'smile'
        : null;
  const exprSrc =
    expression && !missing.has(expressionSrc(expression))
      ? expressionSrc(expression)
      : null;

  const active = exprSrc ?? mouthSrc();

  const layer = (src: string, opacity: number, withFade = true) => (
    <Image
      key={src}
      src={src}
      alt=""
      aria-hidden
      fill
      unoptimized
      priority
      sizes="320px"
      onError={() => markMissing(src)}
      className={`object-cover ${withFade ? 'transition-opacity duration-75' : ''}`}
      style={{ opacity }}
    />
  );

  return (
    <div
      role="img"
      aria-label="Ísis - Tutor IA"
      className={`relative ${className}`}
    >
      {layer(FALLBACK_CLOSED, FALLBACK_CLOSED === active ? 1 : 0)}
      {layer(FALLBACK_OPEN, FALLBACK_OPEN === active ? 1 : 0)}
      {VISEMES.filter((v) => v !== 'rest' && !missing.has(visemeSrc(v))).map(
        (v) => layer(visemeSrc(v), visemeSrc(v) === active ? 1 : 0),
      )}
      {EXPRESSIONS.filter((e) => !missing.has(expressionSrc(e))).map((e) =>
        layer(expressionSrc(e), expressionSrc(e) === active ? 1 : 0),
      )}
      {!missing.has(BLINK_SRC) && layer(BLINK_SRC, blinking ? 1 : 0, false)}
    </div>
  );
}
