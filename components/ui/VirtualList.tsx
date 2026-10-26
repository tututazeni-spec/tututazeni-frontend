// components/ui/VirtualList.tsx
//
// Lista com scroll que só põe no DOM as linhas visíveis (@tanstack/react-virtual).
// Pensada para seletores que podem listar centenas/milhares de itens (ex.: uma
// empresa de ~6000 colaboradores). Abaixo de `threshold` itens renderiza tudo
// normalmente, com o mesmo DOM de uma lista simples — por isso listas pequenas
// não pagam nada, e os testes/leitores de ecrã vêem as linhas todas.
//
// O contentor de scroll é o próprio componente: passar a altura máxima em
// `className` (ex.: `max-h-64`). `header` fica dentro do scroll, antes das linhas.

'use client';

import { Fragment, useRef, type ReactNode } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '@/lib/cn';

export interface VirtualListProps<T> {
  items: T[];
  getKey: (item: T) => string | number;
  renderItem: (item: T, index: number) => ReactNode;
  /** Altura estimada de uma linha (px); as linhas são medidas depois de montadas. */
  estimateSize?: number;
  /** A partir de quantos itens passa a virtualizar. */
  threshold?: number;
  /** Linhas extra fora do ecrã, para o scroll rápido não mostrar vazio. */
  overscan?: number;
  /** Conteúdo fixo antes das linhas (ex.: «Usar texto», mensagem de vazio). */
  header?: ReactNode;
  /** Classes do contentor de scroll — deve limitar a altura (`max-h-*`). */
  className?: string;
}

export function VirtualList<T>({
  items,
  getKey,
  renderItem,
  estimateSize = 40,
  threshold = 100,
  overscan = 8,
  header,
  className,
}: VirtualListProps<T>) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const virtual = items.length > threshold;

  const virtualizer = useVirtualizer({
    count: virtual ? items.length : 0,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => estimateSize,
    overscan,
    getItemKey: (index) => getKey(items[index]),
    // Antes da primeira medição (1.ª pintura/SSR) assume uma janela de 256px em vez de 0.
    initialRect: { width: 0, height: 256 },
  });

  if (!virtual) {
    return (
      <div ref={scrollRef} className={cn('overflow-y-auto', className)}>
        {header}
        {items.map((item, i) => (
          <Fragment key={getKey(item)}>{renderItem(item, i)}</Fragment>
        ))}
      </div>
    );
  }

  return (
    <div ref={scrollRef} className={cn('overflow-y-auto', className)}>
      {header}
      <div
        style={{ height: virtualizer.getTotalSize() }}
        className="relative w-full"
      >
        {virtualizer.getVirtualItems().map((row) => (
          <div
            key={row.key}
            data-index={row.index}
            ref={virtualizer.measureElement}
            className="absolute left-0 top-0 w-full"
            style={{ transform: `translateY(${row.start}px)` }}
          >
            {renderItem(items[row.index], row.index)}
          </div>
        ))}
      </div>
    </div>
  );
}
