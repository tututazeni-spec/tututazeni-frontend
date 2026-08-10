// components/departments/OrgNode.tsx
// Nó recursivo do organograma. Extraído de
// app/(platform)/departments/page.tsx.

'use client';

import { useState } from 'react';
import { Avatar } from './atoms';
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
        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors mb-1 ${
          !node.active
            ? 'opacity-50 bg-gray-50 border-gray-100'
            : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50'
        }`}
        style={{ marginLeft: level * 24 }}
        onClick={() => onSelect(node.id)}
      >
        {/* Expand toggle */}
        {hasChildren && (
          <button
            className="w-5 h-5 text-xs text-gray-400 hover:text-gray-700 flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((v) => !v);
            }}
          >
            {expanded ? '▼' : '▶'}
          </button>
        )}
        {!hasChildren && <div className="w-5 flex-shrink-0" />}

        {/* Color dot */}
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ background: node.color ?? '#94a3b8' }}
        />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900 truncate">
              {node.name}
            </span>
            <span className="text-xs font-mono text-gray-400">{node.code}</span>
            {!node.active && (
              <span className="text-xs text-gray-400">(inactivo)</span>
            )}
          </div>
          <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-3">
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
