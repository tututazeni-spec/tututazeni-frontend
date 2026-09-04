// components/organization/OrgChartNode.tsx
// Nó recursivo do organograma. Extraído de
// app/(platform)/organization/page.tsx.

'use client';

import { Users } from 'lucide-react';
import { useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import type { OrgNode } from './types';

interface OrgChartNodeProps {
  node: OrgNode;
  depth?: number;
}

export function OrgChartNode({ node, depth = 0 }: OrgChartNodeProps) {
  const [expanded, setExpanded] = useState(depth < 1);

  const hasChildren = node.children && node.children.length > 0;
  const subCount = node._count.subordinates;

  return (
    <div className="flex flex-col items-center">
      {/* Card */}
      <div
        className={`relative w-44 cursor-pointer rounded-card border bg-surface p-3 transition-shadow hover:shadow-hover ${
          subCount > 0 ? 'border-info' : 'border-border'
        }`}
        onClick={() => hasChildren && setExpanded((e) => !e)}
      >
        <div className="flex flex-col items-center gap-1.5 text-center">
          <Avatar
            name={node.fullName}
            url={node.avatarUrl ?? undefined}
            size="md"
          />
          <div>
            <div className="font-body text-xs font-semibold leading-tight text-ink">
              {node.fullName}
            </div>
            <div className="mt-0.5 font-body text-xs leading-tight text-ink-muted">
              {node.position?.name ?? '—'}
            </div>
          </div>
          {node.department && (
            <div className="flex items-center gap-1">
              {node.department.color && (
                <div
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: node.department.color }}
                />
              )}
              <span className="font-body text-xs text-ink-faint">
                {node.department.name}
              </span>
            </div>
          )}
          {subCount > 0 && (
            <div className="flex items-center gap-1 font-body text-xs text-info">
              <span className="inline-flex items-center gap-1">
                <Users size={12} strokeWidth={1.75} /> {subCount}
              </span>
              <span>{expanded ? '▲' : '▼'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Children */}
      {expanded && hasChildren && (
        <div className="mt-2 flex flex-col items-center">
          {/* Connector down */}
          <div className="h-6 w-0.5 bg-border-strong" />
          <div className="flex items-start gap-4">
            {node.children.map((child, idx) => (
              <div key={child.id} className="flex flex-col items-center">
                {/* Horizontal connector */}
                {idx > 0 && (
                  <div className="absolute -ml-4 mt-6 h-0.5 w-4 bg-border-strong" />
                )}
                <div className="mb-1 h-4 w-0.5 bg-border-strong" />
                <OrgChartNode node={child} depth={depth + 1} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
