// components/viewers/PptxViewer.tsx
// Leitor de apresentações PowerPoint (.pptx) embutido — não há suporte
// nativo do browser para este formato (ao contrário do PDF), por isso
// recorre à biblioteca `pptx-preview`, que faz o parsing/render 100% no
// cliente (não precisa de nenhum serviço de conversão no servidor).
// `src` aceita qualquer URL que o browser consiga fazer fetch: http(s) ou um
// object URL (blob:) — ver useFileSrc em ContentPlayer.tsx.
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  FileWarning,
  Loader2,
  Maximize,
  Minimize,
} from 'lucide-react';
import type { init as PptxPreviewInit } from 'pptx-preview';
import { useHideStageToggle, useStageMaximized } from './StageMaximizedContext';

interface PptxViewerProps {
  src: string;
  title: string;
}

type Status = 'loading' | 'ready' | 'error';
type Previewer = ReturnType<typeof PptxPreviewInit>;

const SLIDE_WIDTH = 960;
const SLIDE_HEIGHT = 540;
// Espaço vertical reservado a cabeçalho/rodapé/margens quando se calcula a
// altura máxima do slide a partir da janela.
const CHROME_HEIGHT = 240;
// Tempo sem mexer o rato até os controlos do ecrã inteiro se esconderem.
const CONTROLS_HIDE_MS = 3000;

export function PptxViewer({ src, title }: PptxViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previewerRef = useRef<Previewer | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const stageMaximized = useStageMaximized();
  const hideStageToggle = useHideStageToggle();

  // O ecrã inteiro próprio substitui o botão Maximizar do palco.
  useEffect(() => {
    hideStageToggle?.(true);
    return () => hideStageToggle?.(false);
  }, [hideStageToggle]);
  const stageRef = useRef<HTMLDivElement>(null);
  const fitRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  // Altura real do slide a SLIDE_WIDTH de largura (a proporção vem do ficheiro).
  const [slideH, setSlideH] = useState(SLIDE_HEIGHT);
  // Ecrã inteiro real (Fullscreen API), aplicado ao contentor do slide.
  const [isFs, setIsFs] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [position, setPosition] = useState({ index: 0, count: 0 });
  // Em ecrã inteiro o palco ocupa o ecrã todo, tal como no palco maximizado.
  const maximized = stageMaximized || isFs;

  const syncPosition = useCallback(() => {
    const p = previewerRef.current;
    if (p) setPosition({ index: p.currentIndex, count: p.slideCount });
  }, []);

  const goNext = useCallback(() => {
    previewerRef.current?.renderNextSlide();
    syncPosition();
  }, [syncPosition]);

  const goPrev = useCallback(() => {
    previewerRef.current?.renderPreSlide();
    syncPosition();
  }, [syncPosition]);

  const toggleFullscreen = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen?.().catch(() => undefined);
    } else {
      void stage.requestFullscreen?.().catch(() => undefined);
    }
  }, []);

  // Mantém o estado (e o ícone do botão) em sincronia, inclusive quando o
  // utilizador sai com Esc — o browser sai sozinho e só avisa por este evento.
  useEffect(() => {
    const onChange = () => {
      const active = document.fullscreenElement === stageRef.current;
      setIsFs(active);
      setControlsVisible(true);
    };
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // Controlos sobrepostos: escondem-se após ~3 s sem rato e voltam ao mexê-lo.
  const wakeControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(
      () => setControlsVisible(false),
      CONTROLS_HIDE_MS,
    );
  }, []);

  useEffect(() => {
    if (!isFs) return;
    wakeControls();
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [isFs, wakeControls]);

  // Atalhos: F alterna o ecrã inteiro; ← → mudam de slide (Esc é do browser).
  // Fora do ecrã inteiro só valem com o foco dentro do leitor, para não
  // roubar as setas/“f” a campos de texto ou ao resto da página.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      const inField =
        !!target &&
        (target.isContentEditable ||
          ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
      if (inField) return;
      if (!isFs && !stageRef.current?.contains(target)) return;
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
        wakeControls();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
        wakeControls();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isFs, toggleFullscreen, goNext, goPrev, wakeControls]);

  // Ao desmontar com o ecrã inteiro activo (ex.: mudar de lição), sai dele.
  useEffect(
    () => () => {
      if (document.fullscreenElement === stageRef.current) {
        void document.exitFullscreen?.().catch(() => undefined);
      }
    },
    [],
  );

  // O slide é desenhado em 960x540; aqui é só escalado para caber por inteiro
  // (largura da coluna e altura da janela), sem cortes nem scroll.
  useEffect(() => {
    const el = fitRef.current;
    if (!el) return;
    const fit = () => {
      const byWidth = el.clientWidth / SLIDE_WIDTH;
      // Maximizado: usa a altura real do palco; senão, a da janela menos margens.
      const availH =
        maximized && el.clientHeight > 0
          ? el.clientHeight
          : Math.max(window.innerHeight - CHROME_HEIGHT, 200);
      const byHeight = availH / slideH;
      const next = Math.min(byWidth, byHeight);
      if (next > 0) setScale(next);
    };
    fit();
    const ro =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(fit) : null;
    ro?.observe(el);
    window.addEventListener('resize', fit);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', fit);
    };
  }, [maximized, slideH]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setStatus('loading');
      const container = containerRef.current;
      if (!container) return;
      container.innerHTML = '';

      try {
        const [{ init }, res] = await Promise.all([
          import('pptx-preview'),
          fetch(src),
        ]);
        if (cancelled) return;
        if (!res.ok) throw new Error('Falha ao obter o ficheiro');
        const buffer = await res.arrayBuffer();
        if (cancelled || !containerRef.current) return;

        const previewer = init(containerRef.current, {
          width: SLIDE_WIDTH,
          height: SLIDE_HEIGHT,
          mode: 'slide',
        });
        previewerRef.current = previewer;
        await previewer.preview(buffer);
        if (cancelled) return;

        // O pptx-preview mantém a proporção do slide e centra-o na caixa dada;
        // se não for 16:9 sobram faixas pretas. Mede o slide e volta a
        // desenhar numa caixa com a altura exacta, para preencher sem faixas.
        const slide = container.querySelector<HTMLElement>(
          '.pptx-preview-slide-wrapper',
        );
        const realH = Math.round(slide?.offsetHeight ?? 0);
        if (realH > 0 && Math.abs(realH - SLIDE_HEIGHT) > 1) {
          previewer.destroy();
          container.innerHTML = '';
          const exact = init(container, {
            width: SLIDE_WIDTH,
            height: realH,
            mode: 'slide',
          });
          previewerRef.current = exact;
          await exact.preview(buffer);
          if (cancelled) return;
          setSlideH(realH);
        }
        const active = previewerRef.current;
        if (active) {
          setPosition({ index: active.currentIndex, count: active.slideCount });
        }
        setStatus('ready');
      } catch {
        if (!cancelled) setStatus('error');
      }
    }

    void load();

    return () => {
      cancelled = true;
      previewerRef.current?.destroy();
      previewerRef.current = null;
    };
  }, [src]);

  if (status === 'error') {
    return (
      <div className="text-ink text-center px-8">
        <FileWarning size={56} strokeWidth={1.5} className="mx-auto mb-4" />
        <div className="font-body text-base font-medium">{title}</div>
        <p className="font-body text-sm text-ink-muted mt-2">
          Não foi possível abrir esta apresentação.
        </p>
      </div>
    );
  }

  const showOverlay = isFs && status === 'ready';

  return (
    <div
      ref={stageRef}
      tabIndex={-1}
      onMouseMove={isFs ? wakeControls : undefined}
      className={`relative w-full h-full flex flex-col items-center justify-center outline-none ${
        maximized ? '' : 'gap-3 py-6'
      } ${
        isFs
          ? // Ecrã inteiro real: preto, sem margens, a setas da biblioteca
            // substituídas pelos controlos sobrepostos abaixo.
            'w-screen h-screen bg-black [&_.pptx-preview-wrapper-next]:!hidden [&_.pptx-preview-wrapper-pagination]:!hidden'
          : ''
      } ${isFs && !controlsVisible ? 'cursor-none' : ''}`}
    >
      {!isFs && status === 'ready' && (
        <button
          type="button"
          onClick={toggleFullscreen}
          aria-label="Ecrã inteiro"
          title="Ecrã inteiro (F)"
          className="absolute left-3 top-2 z-10 flex items-center gap-1 rounded-card border border-border bg-surface px-2 py-1 font-body text-xs font-semibold text-ink shadow-sm hover:bg-surface-sunken"
        >
          <Maximize size={14} strokeWidth={1.75} />
          Ecrã inteiro
        </button>
      )}
      {status === 'loading' && (
        <div className="text-ink flex flex-col items-center gap-2">
          <Loader2 size={32} strokeWidth={1.75} className="animate-spin" />
          <span className="font-body text-sm text-ink-muted">
            A abrir apresentação…
          </span>
        </div>
      )}
      <div
        ref={fitRef}
        onDoubleClick={(e) => {
          // Cliques rápidos nas setas da biblioteca não devem alternar.
          if ((e.target as HTMLElement).closest('.pptx-preview-wrapper-next'))
            return;
          toggleFullscreen();
        }}
        className={`w-full flex justify-center items-center ${
          maximized ? 'flex-1 min-h-0' : 'px-4'
        }`}
      >
        <div
          className={status === 'ready' ? (isFs ? '' : 'shadow-lg') : 'hidden'}
          style={{ width: SLIDE_WIDTH * scale, height: slideH * scale }}
        >
          <div
            ref={containerRef}
            style={{
              width: SLIDE_WIDTH,
              height: slideH,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
          />
        </div>
      </div>
      {showOverlay && (
        <div
          className={`absolute inset-x-0 bottom-0 z-20 flex items-center justify-center gap-3 bg-gradient-to-t from-black/70 to-transparent px-4 pb-4 pt-10 text-white transition-opacity duration-300 ${
            controlsVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        >
          <button
            type="button"
            onClick={goPrev}
            aria-label="Slide anterior"
            className="rounded-full p-2 hover:bg-white/20"
          >
            <ChevronLeft size={22} strokeWidth={1.75} />
          </button>
          <span
            aria-live="polite"
            className="min-w-12 text-center font-body text-sm tabular-nums"
          >
            {position.index + 1}/{position.count}
          </span>
          <button
            type="button"
            onClick={goNext}
            aria-label="Slide seguinte"
            className="rounded-full p-2 hover:bg-white/20"
          >
            <ChevronRight size={22} strokeWidth={1.75} />
          </button>
        </div>
      )}
      {showOverlay && (
        <button
          type="button"
          onClick={toggleFullscreen}
          aria-label="Sair do ecrã inteiro"
          title="Sair do ecrã inteiro (F ou Esc)"
          className={`absolute right-4 top-4 z-20 rounded-full bg-black/60 p-2 text-white transition-opacity duration-300 hover:bg-black/80 ${
            controlsVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        >
          <Minimize size={20} strokeWidth={1.75} />
        </button>
      )}
    </div>
  );
}
