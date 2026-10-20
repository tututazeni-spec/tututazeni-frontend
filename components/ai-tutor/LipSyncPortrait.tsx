// components/ai-tutor/LipSyncPortrait.tsx
// Retrato da Ísis com a boca a mexer ao ritmo da voz. O speechSynthesis só
// dá eventos por palavra, por isso a fala é uma linha de tempo por sílaba
// (ver buildTimeline em visemes.ts) cujo relógio é re-ancorado a cada palavra
// e cuja velocidade é medida na própria voz. As poses sobrepõem-se e fazem cross-fade; um visema sem
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
  buildTimeline,
  visemeAtUnit,
  visemeSrc,
  type Expression,
  type Viseme,
} from './visemes';

const TICK_MS = 25;
// Nenhuma pose fica menos que isto (evita a boca "vibrar" em sílabas curtas).
const MIN_HOLD_MS = 90;
const FADE_MS = 90;
// Velocidade da voz em unidades/ms (ver buildTimeline): começa neste valor e
// ajusta-se com o intervalo real entre fronteiras de palavra.
const DEFAULT_RATE = 0.019;
const MIN_RATE = 0.008;
const MAX_RATE = 0.04;
const BLINK_MS = 130;
const SMILE_AFTER_SPEECH_MS = 2500;

interface LipSyncPortraitProps {
  speaking: boolean;
  text: string;
  charIndex: number;
  /** Nº de fronteiras de palavra recebidas (muda a cada evento). */
  boundaryCount?: number;
  /** A Ísis está a pensar na resposta. */
  thinking?: boolean;
  className?: string;
}

export function LipSyncPortrait({
  speaking,
  text,
  charIndex,
  boundaryCount = 0,
  thinking = false,
  className = '',
}: LipSyncPortraitProps) {
  const [viseme, setViseme] = useState<Viseme>('rest');
  const [blinking, setBlinking] = useState(false);
  const [smiling, setSmiling] = useState(false);
  // Imagens que não existem (404) — sobem-se na cadeia de fallback.
  const [missing, setMissing] = useState<ReadonlySet<string>>(new Set());
  const timeline = useMemo(() => buildTimeline(text), [text]);
  const timelineRef = useRef(timeline);
  timelineRef.current = timeline;
  const textRef = useRef(text);
  textRef.current = text;
  // Relógio da fala (fora do render para não re-renderizar a cada tick):
  // posição em unidades = (agora - t0) * rate.
  const sync = useRef({
    t0: 0,
    rate: DEFAULT_RATE,
    prevAt: 0, // instante e posição da última fronteira de palavra
    prevUnit: 0,
    hasBoundaries: false,
    limit: Infinity, // não passar do fim da palavra actual antes da próxima
  });

  // Cada fronteira de palavra volta a ancorar a boca à voz real, mede a
  // velocidade e impede a boca de adiantar-se à voz.
  useEffect(() => {
    if (!speaking || boundaryCount === 0) return;
    const s = sync.current;
    const tl = timelineRef.current;
    const now = performance.now();
    const unit = tl.unitAtChar[Math.min(charIndex, tl.unitAtChar.length - 1)];
    if (s.prevAt > 0 && unit > s.prevUnit && now > s.prevAt) {
      const measured = (unit - s.prevUnit) / (now - s.prevAt);
      const clamped = Math.min(MAX_RATE, Math.max(MIN_RATE, measured));
      s.rate = s.rate * 0.6 + clamped * 0.4;
      s.hasBoundaries = true;
    }
    s.prevAt = now;
    s.prevUnit = unit;
    s.t0 = now - unit / s.rate;
    if (s.hasBoundaries) {
      const gap = textRef.current.slice(charIndex).search(/\s/);
      s.limit =
        gap < 0 ? Infinity : (tl.unitAtChar[charIndex + gap + 1] ?? Infinity);
    }
  }, [boundaryCount, charIndex, speaking]);

  useEffect(() => {
    if (!speaking) {
      setViseme('rest');
      return;
    }
    const s = sync.current;
    s.t0 = performance.now();
    s.rate = DEFAULT_RATE;
    s.prevAt = 0;
    s.prevUnit = 0;
    s.hasBoundaries = false;
    s.limit = Infinity;

    let shown: Viseme = 'rest';
    let changedAt = 0;
    const t = setInterval(() => {
      const now = performance.now();
      const tl = timelineRef.current;
      const u = Math.min((now - s.t0) * s.rate, s.limit, tl.total);
      const target = visemeAtUnit(tl.frames, u);
      if (target !== shown && now - changedAt >= MIN_HOLD_MS) {
        shown = target;
        changedAt = now;
        setViseme(target);
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

  // Imagem anterior: fica opaca por baixo enquanto a nova aparece por cima.
  // Fazer fade-out e fade-in ao mesmo tempo deixa o fundo à mostra a meio
  // (cada imagem a ~50 %) e a imagem "pisca".
  const [previous, setPrevious] = useState(active);
  useEffect(() => {
    const t = setTimeout(() => setPrevious(active), FADE_MS + 60);
    return () => clearTimeout(t);
  }, [active]);

  const layer = (src: string, shown = src === active, topmost = false) => {
    const onTop = shown || src === previous;
    return (
      <Image
        key={src}
        src={src}
        alt=""
        aria-hidden
        fill
        sizes="320px"
        onError={() => markMissing(src)}
        className="object-cover"
        style={{
          opacity: onTop ? 1 : 0,
          zIndex: topmost ? 3 : shown ? 2 : onTop ? 1 : 0,
          // só a imagem que entra tem fade; a que sai é tapada, não desvanece
          transition:
            shown && !topmost ? `opacity ${FADE_MS}ms linear` : 'none',
        }}
      />
    );
  };

  return (
    <div
      role="img"
      aria-label="Ísis - Tutor IA"
      className={`relative ${className}`}
    >
      {layer(FALLBACK_CLOSED)}
      {layer(FALLBACK_OPEN)}
      {VISEMES.filter((v) => v !== 'rest' && !missing.has(visemeSrc(v))).map(
        (v) => layer(visemeSrc(v)),
      )}
      {EXPRESSIONS.filter((e) => !missing.has(expressionSrc(e))).map((e) =>
        layer(expressionSrc(e)),
      )}
      {!missing.has(BLINK_SRC) && layer(BLINK_SRC, blinking && !speaking, true)}
    </div>
  );
}
