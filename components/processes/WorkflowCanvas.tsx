// components/processes/WorkflowCanvas.tsx
// Canvas do construtor de fluxos (docs/Modulo_Processes.md §8): blocos
// arrastáveis ligados por setas. Arrastar o círculo da direita de um bloco
// para outro bloco cria uma ligação (dependência); clicar numa seta
// selecciona-a para a remover. Sem bibliotecas externas.

'use client';

import { useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { BLOCK_BY_TYPE, NODE_H, NODE_W, type FlowNode } from './workflow-model';

export interface WorkflowCanvasProps {
  nodes: FlowNode[];
  selectedKey: string | null;
  selectedEdge: { from: string; to: string } | null;
  readOnly: boolean;
  /** Blocos com problemas (mostra um aviso). */
  flagged: Set<string>;
  onSelect: (key: string | null) => void;
  onSelectEdge: (edge: { from: string; to: string } | null) => void;
  onMove: (key: string, x: number, y: number) => void;
  onConnect: (from: string, to: string) => void;
}

const TONE: Record<string, string> = {
  success: 'border-success bg-success-subtle',
  neutral: 'border-border bg-surface',
  info: 'border-info bg-info-subtle',
  primary: 'border-primary bg-primary-subtle',
  warning: 'border-warning bg-warning-subtle',
  accent: 'border-accent bg-accent-subtle',
};

interface DragState {
  key: string;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  moved: boolean;
}

export function WorkflowCanvas({
  nodes,
  selectedKey,
  selectedEdge,
  readOnly,
  flagged,
  onSelect,
  onSelectEdge,
  onMove,
  onConnect,
}: WorkflowCanvasProps) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<DragState | null>(null);
  const [link, setLink] = useState<{ from: string; x: number; y: number } | null>(null);

  const byKey = new Map(nodes.map((n) => [n.key, n]));
  const width = Math.max(900, ...nodes.map((n) => n.x + NODE_W + 80));
  const height = Math.max(520, ...nodes.map((n) => n.y + NODE_H + 80));

  const point = (e: React.PointerEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    const el = ref.current;
    return {
      x: e.clientX - (rect?.left ?? 0) + (el?.scrollLeft ?? 0),
      y: e.clientY - (rect?.top ?? 0) + (el?.scrollTop ?? 0),
    };
  };

  const edges = nodes.flatMap((n) =>
    n.deps.filter((d) => byKey.has(d)).map((d) => ({ from: d, to: n.key })),
  );

  const path = (sx: number, sy: number, tx: number, ty: number) => {
    const dx = Math.max(50, Math.abs(tx - sx) / 2);
    return `M ${sx} ${sy} C ${sx + dx} ${sy}, ${tx - dx} ${ty}, ${tx} ${ty}`;
  };

  const onNodeDown = (e: React.PointerEvent, n: FlowNode) => {
    if (e.button !== 0) return;
    onSelect(n.key);
    onSelectEdge(null);
    if (readOnly) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { key: n.key, startX: e.clientX, startY: e.clientY, originX: n.x, originY: n.y, moved: false };
  };
  const onNodeMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.moved && Math.abs(dx) + Math.abs(dy) < 3) return;
    d.moved = true;
    onMove(d.key, Math.max(0, d.originX + dx), Math.max(0, d.originY + dy));
  };
  const onNodeUp = () => {
    drag.current = null;
  };

  const onHandleDown = (e: React.PointerEvent, n: FlowNode) => {
    if (readOnly) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = point(e);
    setLink({ from: n.key, x: p.x, y: p.y });
  };
  const onHandleMove = (e: React.PointerEvent) => {
    if (!link) return;
    const p = point(e);
    setLink({ ...link, x: p.x, y: p.y });
  };
  const onHandleUp = (e: React.PointerEvent) => {
    if (!link) return;
    const under = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-node-key]');
    const target = under?.getAttribute('data-node-key');
    if (target && target !== link.from) onConnect(link.from, target);
    setLink(null);
  };

  return (
    <div
      ref={ref}
      className="relative h-[560px] overflow-auto rounded-card border border-border bg-surface-sunken"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget || (e.target as HTMLElement).dataset.canvas) {
          onSelect(null);
          onSelectEdge(null);
        }
      }}
    >
      <div
        data-canvas="1"
        className="relative"
        style={{
          width,
          height,
          backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.08) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      >
        <svg className="pointer-events-none absolute inset-0" width={width} height={height}>
          <defs>
            <marker id="wf-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" className="fill-ink-faint" />
            </marker>
            <marker id="wf-arrow-sel" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" className="fill-primary" />
            </marker>
          </defs>
          {edges.map((ed) => {
            const a = byKey.get(ed.from) as FlowNode;
            const b = byKey.get(ed.to) as FlowNode;
            const d = path(a.x + NODE_W, a.y + NODE_H / 2, b.x, b.y + NODE_H / 2);
            const sel = selectedEdge?.from === ed.from && selectedEdge?.to === ed.to;
            return (
              <g key={`${ed.from}-${ed.to}`}>
                <path d={d} fill="none" strokeWidth={sel ? 2.5 : 1.75} className={sel ? 'stroke-primary' : 'stroke-ink-faint'} markerEnd={sel ? 'url(#wf-arrow-sel)' : 'url(#wf-arrow)'} />
                <path
                  d={d}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={14}
                  style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectEdge(ed);
                    onSelect(null);
                  }}
                />
              </g>
            );
          })}
          {link && byKey.get(link.from) && (
            <path
              d={path(
                (byKey.get(link.from) as FlowNode).x + NODE_W,
                (byKey.get(link.from) as FlowNode).y + NODE_H / 2,
                link.x,
                link.y,
              )}
              fill="none"
              strokeWidth={2}
              strokeDasharray="5 4"
              className="stroke-primary"
            />
          )}
        </svg>

        {/* Etiqueta nas ligações para blocos condicionados */}
        {edges.map((ed) => {
          const a = byKey.get(ed.from) as FlowNode;
          const b = byKey.get(ed.to) as FlowNode;
          if (!b.entry) return null;
          return (
            <div
              key={`l-${ed.from}-${ed.to}`}
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-warning bg-warning-subtle px-1.5 py-0.5 font-body text-[10px] text-warning-ink"
              style={{
                left: (a.x + NODE_W + b.x) / 2,
                top: (a.y + b.y) / 2 + NODE_H / 2,
              }}
            >
              se…
            </div>
          );
        })}

        {nodes.map((n) => {
          const meta = BLOCK_BY_TYPE[n.type];
          const selected = selectedKey === n.key;
          return (
            <div
              key={n.key}
              data-node-key={n.key}
              onPointerDown={(e) => onNodeDown(e, n)}
              onPointerMove={onNodeMove}
              onPointerUp={onNodeUp}
              className={`absolute select-none rounded-card border-2 px-3 py-2 shadow-resting ${TONE[meta.tone]} ${
                selected ? 'ring-2 ring-primary ring-offset-1' : ''
              } ${readOnly ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'}`}
              style={{ left: n.x, top: n.y, width: NODE_W, height: NODE_H }}
            >
              <div className="font-body text-[10px] uppercase tracking-wide text-ink-faint">{meta.label}</div>
              <div className="truncate font-body text-sm font-medium text-ink">{n.title || 'Sem nome'}</div>
              <div className="truncate font-body text-[11px] text-ink-muted">
                {n.type === 'REVIEW'
                  ? `${n.approverIds.length || 1} aprovador(es)`
                  : n.responsibleRole || (n.responsibleId ? 'Responsável definido' : meta.hint)}
              </div>
              {flagged.has(n.key) && (
                <AlertTriangle size={14} className="absolute right-1.5 top-1.5 text-warning-ink" />
              )}
              {/* entrada */}
              <span className="absolute -left-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-ink-faint bg-surface" />
              {/* saída: arrastar para ligar */}
              {!readOnly && (
                <span
                  onPointerDown={(e) => onHandleDown(e, n)}
                  onPointerMove={onHandleMove}
                  onPointerUp={onHandleUp}
                  title="Arraste até outro bloco para ligar"
                  className="absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 cursor-crosshair rounded-full border-2 border-primary bg-surface hover:bg-primary-subtle"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
