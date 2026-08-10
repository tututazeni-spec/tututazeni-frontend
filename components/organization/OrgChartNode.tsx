// components/organization/OrgChartNode.tsx
// Nó recursivo do organograma. Extraído de
// app/(platform)/organization/page.tsx.

'use client';

import { useState } from 'react';
import { Avatar } from './atoms';
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
        className={`relative bg-white border rounded-xl p-3 w-44 cursor-pointer hover:shadow-md transition-all ${
          subCount > 0 ? 'border-blue-200' : 'border-gray-200'
        }`}
        onClick={() => hasChildren && setExpanded((e) => !e)}
      >
        <div className="flex flex-col items-center text-center gap-1.5">
          <Avatar name={node.fullName} avatarUrl={node.avatarUrl} size="md" />
          <div>
            <div className="text-xs font-semibold text-gray-900 leading-tight">
              {node.fullName}
            </div>
            <div className="text-xs text-gray-500 leading-tight mt-0.5">
              {node.position?.name ?? '—'}
            </div>
          </div>
          {node.department && (
            <div className="flex items-center gap-1">
              {node.department.color && (
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: node.department.color }}
                />
              )}
              <span className="text-xs text-gray-400">
                {node.department.name}
              </span>
            </div>
          )}
          {subCount > 0 && (
            <div className="flex items-center gap-1 text-xs text-blue-600">
              <span>👥 {subCount}</span>
              <span>{expanded ? '▲' : '▼'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Children */}
      {expanded && hasChildren && (
        <div className="flex flex-col items-center mt-2">
          {/* Connector down */}
          <div className="w-0.5 h-6 bg-gray-200" />
          <div className="flex items-start gap-4">
            {node.children.map((child, idx) => (
              <div key={child.id} className="flex flex-col items-center">
                {/* Horizontal connector */}
                {idx > 0 && (
                  <div className="absolute w-4 h-0.5 bg-gray-200 -ml-4 mt-6" />
                )}
                <div className="w-0.5 h-4 bg-gray-200 mb-1" />
                <OrgChartNode node={child} depth={depth + 1} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
