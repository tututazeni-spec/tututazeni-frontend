// components/declarations/StatusBadge.tsx
// Badge de estado — cobre tanto pedidos de documento (`type="doc"`) como
// submissões de formulário de vínculo (`type="work"`). Wrapper fino sobre o
// Badge da fundação de design (components/ui/Badge) — o ícone por-status do
// original foi descartado, a cor semântica já comunica o estado via o ponto
// do Badge (mesmo precedente do piloto work-declaration). Extraído de
// app/(platform)/declarations/page.tsx.

import { Badge } from '@/components/ui/Badge';
import { DOC_STATUS, WORK_STATUS } from './constants';
import type { DocStatus, WorkStatus } from './types';

export interface StatusBadgeProps {
  status: string;
  type?: 'doc' | 'work';
}

export function StatusBadge({ status, type = 'doc' }: StatusBadgeProps) {
  const meta =
    type === 'doc'
      ? (DOC_STATUS[status as DocStatus] ?? DOC_STATUS.DRAFT)
      : (WORK_STATUS[status as WorkStatus] ?? WORK_STATUS.DRAFT);
  return <Badge intent={meta.intent}>{meta.label}</Badge>;
}
