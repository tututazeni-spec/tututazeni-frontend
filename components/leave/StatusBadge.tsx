// components/leave/StatusBadge.tsx
// Badge de estado do pedido de ausência. Extraído de
// app/(platform)/leave/page.tsx.

import { STATUS_CONFIG } from './constants';
import type { LeaveStatus } from './types';

export interface StatusBadgeProps {
  status: LeaveStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}
    >
      <Icon size={11} />
      {cfg.label}
    </span>
  );
}
