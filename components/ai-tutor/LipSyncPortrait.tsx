// components/ai-tutor/LipSyncPortrait.tsx
// Retrato da Ísis com a boca a mexer ao ritmo da voz. O speechSynthesis só
// dá eventos por palavra (`charIndex`), por isso entre eventos avança-se um
// cursor estimado pelo texto: vogal = boca aberta, consoante/pausa = fechada.

'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

const TICK_MS = 70;
// Caracteres falados por segundo (voz a rate 1); o cursor realinha a cada palavra.
const CHARS_PER_SEC = 14;
const OPEN_CHARS = /[aeiouáàâãéêíóôõúü]/i;
const PAUSE_CHARS = /[\s.,;:!?]/;

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
  const [open, setOpen] = useState(false);
  const cursor = useRef(0);
  const textRef = useRef(text);
  textRef.current = text;

  // Cada fronteira de palavra realinha o cursor com a voz real.
  useEffect(() => {
    cursor.current = charIndex;
  }, [charIndex]);

  useEffect(() => {
    if (!speaking) {
      setOpen(false);
      return;
    }
    const step = (CHARS_PER_SEC * TICK_MS) / 1000;
    const t = setInterval(() => {
      const ch = textRef.current.charAt(Math.floor(cursor.current));
      cursor.current = Math.min(
        cursor.current + step,
        textRef.current.length - 1,
      );
      setOpen(OPEN_CHARS.test(ch) && !PAUSE_CHARS.test(ch));
    }, TICK_MS);
    return () => clearInterval(t);
  }, [speaking]);

  return (
    <div className={`relative ${className}`}>
      <Image
        src="/images/isis-avatar.png"
        alt="Ísis - Tutor IA"
        fill
        priority
        sizes="320px"
        className="object-cover"
      />
      <Image
        src="/images/isis-avatar-mouth-open.png"
        alt=""
        aria-hidden
        fill
        sizes="320px"
        className="object-cover transition-opacity duration-75"
        style={{ opacity: open ? 1 : 0 }}
      />
    </div>
  );
}
