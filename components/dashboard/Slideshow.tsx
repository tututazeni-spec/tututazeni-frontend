// components/dashboard/Slideshow.tsx
// Carrossel de banners no topo do Dashboard (acima das tabs, visível em
// qualquer separador). Fazia parte do dashboard.page.tsx original mas a
// chamada <Slideshow /> foi perdida numa reescrita em massa do ficheiro
// (commit "ultima versao final") sem essa ser a intenção — o componente
// ficou órfão até ser removido como código morto confirmado (PR #114).
// Restaurado aqui como componente próprio, na mesma posição de sempre.
//
// Nota: os ficheiros em public/images/ tinham extensão .JPG (maiúscula);
// os caminhos abaixo sempre esperaram .jpg minúsculo. No Windows (FS
// case-insensitive) isto nunca dava erro localmente, mas falharia com 404
// num deploy Linux (case-sensitive) — os ficheiros foram renomeados para
// baixo ao restaurar este componente.

'use client';

import { useState, useEffect, useRef } from 'react';

interface Slide {
  url: string;
  caption: string;
}

// Substitui os URLs pelos teus — recomendado: 1400×400 px (banner horizontal)
const SLIDES: Slide[] = [
  { url: '/images/banner1.jpg', caption: 'Aprende. Cresce. Inova.' },
  { url: '/images/banner2.jpg', caption: 'Formação de excelência.' },
  { url: '/images/banner3.jpg', caption: 'Desenvolve competências.' },
  { url: '/images/banner4.jpg', caption: 'Conhecimento partilhado.' },
];

export function Slideshow() {
  const [current, setCurrent] = useState(0);
  const [fading, setFading] = useState(false);
  // Guarda o setTimeout da transição de fade para poder cancelá-lo — sem isto,
  // desmontar a meio dos 400ms de fade disparava setCurrent/setFading num
  // componente já desmontado.
  const fadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setFading(true);
      fadeTimeoutRef.current = setTimeout(() => {
        setCurrent((c) => (c + 1) % SLIDES.length);
        setFading(false);
      }, 400);
    }, 10000);
    return () => {
      clearInterval(interval);
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
    };
  }, []);

  function goTo(i: number) {
    if (i === current) return;
    setFading(true);
    if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
    fadeTimeoutRef.current = setTimeout(() => {
      setCurrent(i);
      setFading(false);
    }, 400);
  }

  const slide = SLIDES[current];

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 32,
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      }}
    >
      {/* Image */}
      <div
        style={{
          width: '100%',
          height: 340,
          backgroundImage: `url(${slide.url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transition: 'opacity 0.4s ease',
          opacity: fading ? 0 : 1,
        }}
      >
        {/* Gradient overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(90deg, rgba(10,20,60,0.72) 0%, rgba(10,20,60,0.35) 60%, rgba(10,20,60,0.10) 100%)',
          }}
        />
        {/* Caption */}
        <div
          style={{
            position: 'absolute',
            bottom: 48,
            left: 40,
            right: '40%',
            opacity: fading ? 0 : 1,
            transition: 'opacity 0.4s ease',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 800,
              color: '#fff',
              lineHeight: 1.3,
              textShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}
          >
            {slide.caption}
          </p>
        </div>
      </div>

      {/* Dot indicators */}
      <div
        style={{
          position: 'absolute',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 8,
        }}
      >
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Ir para o slide ${i + 1}`}
            aria-current={i === current}
            style={{
              width: i === current ? 24 : 8,
              height: 8,
              borderRadius: 4,
              background: i === current ? '#fff' : 'rgba(255,255,255,0.45)',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              transition: 'all 0.3s ease',
            }}
          />
        ))}
      </div>

      {/* Prev / Next arrows */}
      {[
        { dir: -1, pos: 'left' as const },
        { dir: 1, pos: 'right' as const },
      ].map(({ dir, pos }) => (
        <button
          key={pos}
          onClick={() => goTo((current + dir + SLIDES.length) % SLIDES.length)}
          aria-label={dir === -1 ? 'Slide anterior' : 'Próximo slide'}
          style={{
            position: 'absolute',
            top: '50%',
            [pos]: 16,
            transform: 'translateY(-50%)',
            width: 36,
            height: 36,
            borderRadius: '50%',
            border: 'none',
            cursor: 'pointer',
            background: 'rgba(255,255,255,0.18)',
            color: '#fff',
            fontSize: 18,
            fontWeight: 700,
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = 'rgba(255,255,255,0.35)')
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = 'rgba(255,255,255,0.18)')
          }
        >
          {dir === -1 ? '‹' : '›'}
        </button>
      ))}

      {/* Slide counter */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          padding: '4px 10px',
          borderRadius: 20,
          background: 'rgba(0,0,0,0.35)',
          color: '#fff',
          fontSize: 11,
          fontWeight: 700,
          backdropFilter: 'blur(4px)',
        }}
      >
        {current + 1} / {SLIDES.length}
      </div>
    </div>
  );
}
