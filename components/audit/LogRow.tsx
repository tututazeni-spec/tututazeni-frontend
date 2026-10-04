// components/audit/LogRow.tsx
// Linha da tabela «Registos de Auditoria» (docs/modulo_audit.md §4). O detalhe
// completo abre no EventDetailModal; não existe acção de editar/eliminar.

'use client';

import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  SEVERITY_CFG,
  STATUS_CFG,
  actionLabel,
  entityLabel,
} from './constants';
import { fmtTs } from './utils';
import type { AuditLog } from './types';

interface LogRowProps {
  log: AuditLog;
  onOpen: (id: number) => void;
}

export function LogRow({ log, onOpen }: LogRowProps) {
  const sevCfg = SEVERITY_CFG[log.severity] ?? SEVERITY_CFG.LOW;

  return (
    <tr
      onClick={() => onOpen(log.id)}
      className="cursor-pointer border-b border-border last:border-0 hover:bg-surface-sunken"
    >
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 flex-shrink-0 rounded-full ${sevCfg.dot}`} />
          <span className="font-data text-xs text-ink-faint">{log.id}</span>
        </div>
      </td>
      <td className="whitespace-nowrap px-3 py-2.5 font-body text-xs text-ink-muted">
        {fmtTs(log.timestamp)}
      </td>
      <td className="px-3 py-2.5">
        {log.user ? (
          <div className="flex items-center gap-1.5">
            <Avatar
              name={log.user.fullName}
              url={log.user.avatarUrl ?? undefined}
              size="sm"
            />
            <span className="font-body text-xs text-ink">
              {log.user.fullName}
            </span>
          </div>
        ) : (
          <span className="font-body text-xs italic text-ink-faint">
            Sistema
          </span>
        )}
      </td>
      <td className="px-3 py-2.5 font-body text-xs text-ink-muted">
        {log.user?.role?.name ?? '—'}
      </td>
      <td className="px-3 py-2.5 font-body text-xs text-ink-muted">
        {entityLabel(log.entity)}
      </td>
      <td className="px-3 py-2.5">
        <span className="font-body text-xs font-medium text-ink">
          {actionLabel(log.action)}
        </span>
      </td>
      <td className="px-3 py-2.5 font-data text-xs text-ink-muted">
        {log.entityId ? `#${log.entityId}` : '—'}
      </td>
      <td className="px-3 py-2.5">
        <StatusBadge value={log.status} map={STATUS_CFG} />
      </td>
      <td className="px-3 py-2.5">
        <span className={`font-body text-xs font-medium ${sevCfg.cls}`}>
          {sevCfg.label}
        </span>
      </td>
      <td className="px-3 py-2.5 font-data text-xs text-ink-faint">
        {log.ip ?? '—'}
      </td>
      <td className="px-3 py-2.5">
        <Button
          intent="secondary"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onOpen(log.id);
          }}
        >
          Ver detalhes
        </Button>
      </td>
    </tr>
  );
}
