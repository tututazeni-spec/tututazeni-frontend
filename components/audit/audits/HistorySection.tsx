// components/audit/audits/HistorySection.tsx
// Histórico de eventos de uma auditoria (apresentação).

import { fmtTs } from '../utils';
import { historyActionLabel } from './logic';
import { Section } from './shared';
import type { InternalAuditDetail } from '../types';

export function HistorySection({ audit: a }: { audit: InternalAuditDetail }) {
  return (
    <Section title="Histórico">
      {a.history.map((h) => (
        <div key={h.id} className="py-1 text-ink-muted">
          {fmtTs(h.timestamp)} · {h.user?.fullName ?? 'Sistema'} ·{' '}
          {historyActionLabel(h.action)}
        </div>
      ))}
    </Section>
  );
}
