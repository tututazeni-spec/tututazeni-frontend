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
  pickViseme,
  textToVisemes,
  visemeSrc,
  type Expression,
  type Viseme,
} from './visemes';

const TICK_MS = 30;
// Cada pose fica visível pelo menos isto; abaixo disso a boca "vibra".
const HOLD_MS = 120;
// Velocidade da voz em caracteres/ms: começa neste valor e ajusta-se com o
// intervalo real entre fronteiras de palavra.
const DEFAULT_RATE = 0.013;
const MIN_RATE = 0.006;
const MAX_RATE = 0.03;
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
  const visemes = useMemo(() => textToVisemes(text), [text]);
  const visemesRef = useRef(visemes);
  visemesRef.current = visemes;
  const textRef = useRef(text);
  textRef.current = text;
  // Estado do cursor de fala (fora do render para não re-renderizar a cada tick).
  const sync = useRef({
    cursor: 0,
    rate: DEFAULT_RATE,
    boundaryAt: 0, // instante da última fronteira de palavra
    boundaryIdx: 0,
    limit: Infinity, // até onde o cursor pode ir antes da próxima fronteira
    hasBoundaries: false,
  });

  // Cada fronteira de palavra realinha o cursor com a voz real, mede a
  // velocidade e impede o cursor de passar do fim da palavra actual: a boca
  // fecha no fim de cada palavra à espera da seguinte.
  useEffect(() => {
    if (!speaking) return;
    const s = sync.current;
    const now = performance.now();
    if (charIndex > 0 && s.boundaryAt > 0 && charIndex > s.boundaryIdx) {
      const measured = (charIndex - s.boundaryIdx) / (now - s.boundaryAt);
      const clamped = Math.min(MAX_RATE, Math.max(MIN_RATE, measured));
      s.rate = s.rate * 0.5 + clamped * 0.5;
      s.hasBoundaries = true;
    }
    s.boundaryAt = now;
    s.boundaryIdx = charIndex;
    s.cursor = charIndex;
    if (s.hasBoundaries) {
      const gap = textRef.current.slice(charIndex).search(/\s/);
      s.limit = gap < 0 ? Infinity : charIndex + gap;
    }
  }, [charIndex, speaking]);

  useEffect(() => {
    if (!speaking) {
      setViseme('rest');
      return;
    }
    const s = sync.current;
    s.cursor = 0;
    s.rate = DEFAULT_RATE;
    s.boundaryAt = 0;
    s.boundaryIdx = 0;
    s.limit = Infinity;
    s.hasBoundaries = false;

    let last = performance.now();
    let committed = last;
    let samples: Viseme[] = [];
    const t = setInterval(() => {
      const now = performance.now();
      const list = visemesRef.current;
      s.cursor = Math.min(
        s.cursor + s.rate * (now - last),
        s.limit,
        list.length - 1,
      );
      last = now;
      samples.push(list[Math.floor(s.cursor)] ?? 'rest');
      if (now - committed >= HOLD_MS) {
        setViseme(pickViseme(samples));
        samples = [];
        committed = now;
      }
    }, TICK_MS);
    return () => clearInterval(t);
  }, [speaking, text]);

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
      sizes="320px"
      onError={() => markMissing(src)}
      className={`object-cover ${withFade ? 'transition-opacity duration-100' : ''}`}
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
      {!missing.has(BLINK_SRC) &&
        layer(BLINK_SRC, blinking && !speaking ? 1 : 0, false)}
    </div>
  );
}
