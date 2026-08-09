// components/declarations/StatusBadge.tsx
// Badge de estado — cobre tanto pedidos de documento (`type="doc"`) como
// submissões de formulário de vínculo (`type="work"`). Extraído de
// app/(platform)/declarations/page.tsx.

import { Clock } from 'lucide-react';
import { DOC_STATUS, WORK_STATUS } from './constants';
import type { DocStatus, WorkStatus } from './types';

export interface StatusBadgeProps {
  status: string;
  type?: 'doc' | 'work';
}

export function StatusBadge({ status, type = 'doc' }: StatusBadgeProps) {
  const cfg =
    type === 'doc'
      ? (DOC_STATUS[status as DocStatus] ?? DOC_STATUS.DRAFT)
      : {
          ...(WORK_STATUS[status as WorkStatus] ?? WORK_STATUS.DRAFT),
          icon: Clock,
        };
  const Icon = cfg.icon ?? Clock;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}
    >
      <Icon size={11} />
      {cfg.label}
    </span>
  );
}
