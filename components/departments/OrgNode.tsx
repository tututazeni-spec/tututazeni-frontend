// components/departments/OrgNode.tsx
// Nó recursivo do organograma. Extraído de
// app/(platform)/departments/page.tsx.

'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import type { DepartmentNode } from './types';

interface OrgNodeProps {
  node: DepartmentNode;
  onSelect: (id: number) => void;
  level?: number;
}

export function OrgNode({ node, onSelect, level = 0 }: OrgNodeProps) {
  const [expanded, setExpanded] = useState(level < 2);
  const hasChildren = node.children.length > 0;

  return (
    <div className="relative">
      <div
        className={`mb-1 flex cursor-pointer items-center gap-3 rounded-card border p-3 transition-colors ${
          !node.active
            ? 'border-border bg-surface-sunken opacity-50'
            : 'border-border bg-surface hover:border-primary hover:bg-primary-subtle'
        }`}
        style={{ marginLeft: level * 24 }}
        onClick={() => onSelect(node.id)}
      >
        {/* Expand toggle */}
        {hasChildren && (
          <button
            className="flex h-5 w-5 flex-shrink-0 items-center justify-center text-ink-faint hover:text-ink"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((v) => !v);
            }}
          >
            {expanded ? (
              <ChevronDown size={14} strokeWidth={1.75} />
            ) : (
              <ChevronRight size={14} strokeWidth={1.75} />
            )}
          </button>
        )}
        {!hasChildren && <div className="w-5 flex-shrink-0" />}

        {/* Color dot */}
        <div
          className="h-3 w-3 flex-shrink-0 rounded-full"
          style={{ background: node.color ?? 'var(--color-ink-faint)' }}
        />

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium text-ink">
              {node.name}
            </span>
            <span className="font-mono text-xs text-ink-faint">
              {node.code}
            </span>
            {!node.active && (
              <span className="text-xs text-ink-faint">(inactivo)</span>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-3 text-xs text-ink-faint">
            {node.head && (
              <span className="flex items-center gap-1">
                <Avatar name={node.head.fullName} size="sm" />
                {node.head.fullName}
              </span>
            )}
            <span>{node._count.users} membros</span>
            {hasChildren && <span>{node.children.length} subdeptos</span>}
          </div>
        </div>
      </div>

      {/* Children */}
      {expanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <OrgNode
              key={child.id}
              node={child}
              onSelect={onSelect}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
