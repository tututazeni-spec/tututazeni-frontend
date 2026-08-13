// components/work-declaration/StatusBadge.tsx
// Badge de status de declaração. Extraído de
// app/(platform)/work-declaration/page.tsx. Wrapper fino sobre o Badge
// da fundação de design (components/ui/Badge) — o ícone por-status do
// original foi descartado, a cor semântica já comunica o estado via o
// ponto do Badge (mesmo precedente do piloto engagement).

'use client';

import { Badge } from '@/components/ui/Badge';
import { STATUS_META } from './constants';
import type { DeclarationStatus } from './types';

interface StatusBadgeProps {
  status: DeclarationStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const meta = STATUS_META[status];
  return <Badge intent={meta.intent}>{meta.label}</Badge>;
}
