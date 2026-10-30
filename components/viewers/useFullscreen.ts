// components/viewers/useFullscreen.ts
// Ecrã inteiro real (Fullscreen API) para o palco de uma lição: aplicado ao
// elemento de `ref`, com o estado sincronizado por `fullscreenchange` (inclui
// sair com Esc), atalho F e controlos que se escondem sem rato.
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// Tempo sem mexer o rato até os controlos sobrepostos se esconderem.
export const CONTROLS_HIDE_MS = 3000;

/** true enquanto há actividade; com `active` a false devolve sempre true. */
export function useIdleHide(active: boolean, ms = CONTROLS_HIDE_MS): boolean {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!active) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const wake = () => {
      setVisible(true);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setVisible(false), ms);
    };
    wake();
    document.addEventListener('mousemove', wake);
    document.addEventListener('mousedown', wake);
    document.addEventListener('keydown', wake);
    return () => {
      if (timer) clearTimeout(timer);
      document.removeEventListener('mousemove', wake);
      document.removeEventListener('mousedown', wake);
      document.removeEventListener('keydown', wake);
    };
  }, [active, ms]);

  return !active || visible;
}

export function useFullscreen<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const [isFs, setIsFs] = useState(false);

  const toggle = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen?.().catch(() => undefined);
    } else {
      void el.requestFullscreen?.().catch(() => undefined);
    }
  }, []);

  // Em sincronia com o browser, que sai sozinho com Esc.
  useEffect(() => {
    const onChange = () => setIsFs(document.fullscreenElement === ref.current);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // F alterna. Fora do ecrã inteiro só vale com o foco dentro do palco, para
  // não roubar a tecla a campos de texto nem ao resto da página.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'f' && e.key !== 'F') return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.isContentEditable ||
          ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
      )
        return;
      if (!isFs && !ref.current?.contains(target)) return;
      e.preventDefault();
      toggle();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isFs, toggle]);

  // Ao desmontar com o ecrã inteiro activo (ex.: mudar de lição), sai dele.
  useEffect(
    () => () => {
      if (document.fullscreenElement === ref.current) {
        void document.exitFullscreen?.().catch(() => undefined);
      }
    },
    [],
  );

  const controlsVisible = useIdleHide(isFs);
  return { ref, isFs, toggle, controlsVisible };
}
