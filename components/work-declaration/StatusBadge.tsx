// components/work-declaration/StatusBadge.tsx
// Badge de status de declaração. Extraído de
// app/(platform)/work-declaration/page.tsx.

'use client';

import { STATUS_META } from './constants';
import type { DeclarationStatus } from './types';

interface StatusBadgeProps {
  status: DeclarationStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${meta.bg} ${meta.color}`}
    >
      {meta.icon}
      {meta.label}
    </span>
  );
}
