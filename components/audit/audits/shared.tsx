// components/audit/audits/shared.tsx
// Peças visuais partilhadas pelas vistas de Auditorias.

import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/Badge';
import { STATUS } from './constants';
import type { InternalAuditStatus } from '../types';

export function StatusPill({ status }: { status: InternalAuditStatus }) {
  const c = STATUS[status];
  return <Badge intent={c.intent}>{c.label}</Badge>;
}

interface SectionProps {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}

export function Section({ title, action, children }: SectionProps) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between border-b border-border pb-1">
        <span className="font-semibold uppercase tracking-wide text-ink-muted">
          {title}
        </span>
        {action}
      </div>
      {children}
    </div>
  );
}
