// components/departments/OrgChartNode.tsx
// Visualização "Organograma" da aba Estrutura Organizacional
// (docs/modulo_departments.md Ponto 3) — organograma clássico em caixas
// ligadas por linhas, distinto da árvore indentada (OrgNode/TreeView).
// Sem medição de larguras em JS: uma única barra horizontal a toda a
// largura da linha de filhos (border-top), com um pequeno traço vertical
// por caixa para os ligar — mais simples e robusto que o truque clássico
// de before/after por filho, ao custo de a barra não estar centrada
// pixel-a-pixel entre o primeiro e o último filho.

'use client';

import { Building2 } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import type { DepartmentNode } from './types';

interface OrgChartNodeProps {
  node: DepartmentNode;
  onSelect: (id: number) => void;
}

function ChartBox({ node, onSelect }: OrgChartNodeProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(node.id)}
      className={`flex w-48 flex-col items-center gap-1 rounded-card border bg-surface p-3 text-center shadow-sm transition-colors ${
        node.active
          ? 'border-border hover:border-primary hover:bg-primary-subtle'
          : 'border-border bg-surface-sunken opacity-50'
      }`}
    >
      <div
        className="flex h-8 w-8 items-center justify-center rounded-full"
        style={{ background: node.color ? `${node.color}20` : 'var(--color-surface-sunken)' }}
      >
        <Building2 size={14} strokeWidth={1.75} />
      </div>
      <div className="w-full truncate text-xs font-medium text-ink">{node.name}</div>
      <div className="font-mono text-[10px] text-ink-faint">{node.code}</div>
      {node.head && (
        <div className="mt-1 flex max-w-full items-center gap-1">
          <Avatar name={node.head.fullName} size="sm" />
          <span className="truncate text-[11px] text-ink-faint">{node.head.fullName}</span>
        </div>
      )}
      <div className="mt-1 flex items-center gap-2 text-[10px] text-ink-faint">
        <span>{node._count.users} colab.</span>
        <span>{node.positionsCount} cargos</span>
      </div>
    </button>
  );
}

export function OrgChartNode({ node, onSelect }: OrgChartNodeProps) {
  const children = node.children;

  return (
    <div className="flex flex-col items-center">
      <ChartBox node={node} onSelect={onSelect} />
      {children.length > 0 && (
        <>
          <div className="h-4 w-px bg-border-strong" />
          <div className={`flex ${children.length > 1 ? 'border-t border-border-strong' : ''}`}>
            {children.map((child) => (
              <div key={child.id} className="flex flex-col items-center px-4">
                {children.length > 1 && <div className="h-4 w-px bg-border-strong" />}
                <OrgChartNode node={child} onSelect={onSelect} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
