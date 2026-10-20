// components/ai-tutor/LipSyncPortrait.tsx
// Retrato da Ísis com a boca a mexer ao ritmo da voz. O speechSynthesis só
// dá eventos por palavra (`charIndex`), por isso entre eventos avança-se um
// cursor estimado pelo texto e cada carácter é convertido num dos 12 visemas
// (ver visemes.ts). As poses sobrepõem-se e fazem cross-fade; um visema sem
// imagem usa o retrato de boca fechada/aberta que já existe.

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import {
  FALLBACK_CLOSED,
  FALLBACK_OPEN,
  VISEMES,
  fallbackFor,
  textToVisemes,
  visemeSrc,
  type Viseme,
} from './visemes';

const TICK_MS = 60;
// Caracteres falados por segundo (voz a rate 1); o cursor realinha a cada palavra.
const CHARS_PER_SEC = 14;

interface LipSyncPortraitProps {
  speaking: boolean;
  text: string;
  charIndex: number;
  className?: string;
}

export function LipSyncPortrait({
  speaking,
  text,
  charIndex,
  className = '',
}: LipSyncPortraitProps) {
  const [viseme, setViseme] = useState<Viseme>('rest');
  const [missing, setMissing] = useState<ReadonlySet<Viseme>>(new Set());
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

  const markMissing = (v: Viseme) => setMissing((prev) => new Set(prev).add(v));

  // Sem imagem própria, 'rest' é o retrato base e os restantes caem no aberto/fechado.
  const active =
    viseme === 'rest' || missing.has(viseme)
      ? fallbackFor(viseme)
      : visemeSrc(viseme);

  const layer = (src: string, onError?: () => void) => (
    <Image
      key={src}
      src={src}
      alt=""
      aria-hidden
      fill
      unoptimized
      priority
      sizes="320px"
      onError={onError}
      className="object-cover transition-opacity duration-75"
      style={{ opacity: src === active ? 1 : 0 }}
    />
  );

  return (
    <div
      role="img"
      aria-label="Ísis - Tutor IA"
      className={`relative ${className}`}
    >
      {layer(FALLBACK_CLOSED)}
      {layer(FALLBACK_OPEN)}
      {VISEMES.filter((v) => v !== 'rest' && !missing.has(v)).map((v) =>
        layer(visemeSrc(v), () => markMissing(v)),
      )}
    </div>
  );
}
