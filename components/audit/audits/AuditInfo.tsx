// components/audit/audits/AuditInfo.tsx
// Estado, tipo, resultado e ficha de uma auditoria (apresentação).

import { Badge } from '@/components/ui/Badge';
import { fmtTs } from '../utils';
import { fmtDay } from './logic';
import { resultLabel, typeLabel } from './constants';
import { StatusPill } from './shared';
import type { InternalAuditDetail } from '../types';

export function AuditInfo({ audit: a }: { audit: InternalAuditDetail }) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <StatusPill status={a.status} />
        <span className="text-ink-muted">{typeLabel(a.type)}</span>
        {a.result && (
          <Badge intent={a.result === 'CONFORME' ? 'success' : 'warning'}>
            {resultLabel(a.result)}
          </Badge>
        )}
      </div>

      <dl className="grid grid-cols-[160px_1fr] gap-y-1 text-ink">
        <dt className="text-ink-faint">Auditor responsável</dt>
        <dd>{a.leadAuditor?.fullName ?? 'Por definir'}</dd>
        <dt className="text-ink-faint">Equipa</dt>
        <dd>{a.team.map((t) => t.fullName).join(', ') || '—'}</dd>
        <dt className="text-ink-faint">Módulos</dt>
        <dd>{a.modules.join(', ') || '—'}</dd>
        <dt className="text-ink-faint">Período analisado</dt>
        <dd>
          {fmtDay(a.periodFrom)} a {fmtDay(a.periodTo)}
        </dd>
        <dt className="text-ink-faint">Início / prazo</dt>
        <dd>
          {fmtDay(a.startDate)} / {fmtDay(a.dueDate)}
        </dd>
        {a.objective && (
          <>
            <dt className="text-ink-faint">Objetivo</dt>
            <dd className="whitespace-pre-wrap">{a.objective}</dd>
          </>
        )}
        {a.scope && (
          <>
            <dt className="text-ink-faint">Âmbito</dt>
            <dd className="whitespace-pre-wrap">{a.scope}</dd>
          </>
        )}
        {a.criteria && (
          <>
            <dt className="text-ink-faint">Critérios</dt>
            <dd className="whitespace-pre-wrap">{a.criteria}</dd>
          </>
        )}
        {a.approvedBy && (
          <>
            <dt className="text-ink-faint">Relatório aprovado</dt>
            <dd>
              {a.approvedBy.fullName}
              {a.approvedAt ? ` · ${fmtTs(a.approvedAt)}` : ''}
            </dd>
          </>
        )}
        {a.cancelReason && (
          <>
            <dt className="text-ink-faint">Motivo do cancelamento</dt>
            <dd className="whitespace-pre-wrap">{a.cancelReason}</dd>
          </>
        )}
      </dl>
    </>
  );
}
