// components/audit/LogRow.tsx
// Linha expansível da tabela de logs de auditoria. Extraído de
// app/(platform)/audit/page.tsx.

'use client';

import { useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ACTION_ICONS, SEVERITY_CFG, STATUS_CFG } from './constants';
import { fmtTs } from './utils';
import { DiffViewer } from './DiffViewer';
import type { AuditLog } from './types';

interface LogRowProps {
  log: AuditLog;
}

export function LogRow({ log }: LogRowProps) {
  const [expanded, setExpanded] = useState(false);
  const sevCfg = SEVERITY_CFG[log.severity] ?? SEVERITY_CFG.LOW;
  const actionIcon = ACTION_ICONS[log.action] ?? '📋';
  const changes = log.changes ? JSON.parse(log.changes) : null;

  return (
    <>
      <tr
        onClick={() => setExpanded((e) => !e)}
        className={`cursor-pointer border-b border-border last:border-0 hover:bg-surface-sunken ${expanded ? 'bg-primary-subtle' : ''}`}
      >
        <td className="px-3 py-2.5">
          <div className="flex items-center gap-2">
            <div
              className={`h-2 w-2 flex-shrink-0 rounded-full ${sevCfg.dot}`}
            />
            <span className="font-data text-xs text-ink-faint">{log.id}</span>
          </div>
        </td>
        <td className="whitespace-nowrap px-3 py-2.5 font-body text-xs text-ink-muted">
          {fmtTs(log.timestamp)}
        </td>
        <td className="px-3 py-2.5">
          {log.user ? (
            <div className="flex items-center gap-1.5">
              <Avatar name={log.user.fullName} url={log.user.avatarUrl ?? undefined} size="sm" />
              <span className="font-body text-xs text-ink">{log.user.fullName}</span>
            </div>
          ) : (
            <span className="font-body text-xs italic text-ink-faint">Sistema</span>
          )}
        </td>
        <td className="px-3 py-2.5">
          <span className="font-body text-xs font-medium text-ink">
            {actionIcon} {log.action}
          </span>
        </td>
        <td className="px-3 py-2.5 font-body text-xs text-ink-muted">
          {log.entity} {log.entityId ? `#${log.entityId}` : ''}
        </td>
        <td className="px-3 py-2.5">
          <StatusBadge value={log.status} map={STATUS_CFG} />
        </td>
        <td className="px-3 py-2.5 font-data text-xs text-ink-faint">
          {log.ip ?? '—'}
        </td>
        <td className="px-3 py-2.5">
          <span className={`font-body text-xs font-medium ${sevCfg.cls}`}>
            {log.severity}
          </span>
        </td>
      </tr>

      {expanded && (
        <tr className="bg-primary-subtle">
          <td colSpan={8} className="px-4 py-3">
            <div className="grid grid-cols-2 gap-4 font-body text-xs">
              <div>
                {log.reason && (
                  <div className="mb-2">
                    <span className="font-medium text-ink-muted">Motivo:</span>{' '}
                    {log.reason}
                  </div>
                )}
                {log.ip && (
                  <div className="mb-1">
                    <span className="font-medium text-ink-muted">IP:</span>{' '}
                    {log.ip}
                  </div>
                )}
                {log.userAgent && (
                  <div className="mb-1 truncate text-ink-faint">
                    <span className="font-medium text-ink-muted">UA:</span>{' '}
                    {log.userAgent}
                  </div>
                )}
                {log.hash && (
                  <div className="mt-2 truncate font-data text-xs text-ink-faint">
                    Hash: {log.hash.slice(0, 32)}…
                  </div>
                )}
              </div>
              <div>
                {changes && <DiffViewer changes={changes} />}
                {!changes && log.after && (
                  <pre className="max-h-32 overflow-auto rounded bg-surface p-2 font-data text-xs">
                    {JSON.stringify(JSON.parse(log.after), null, 2)}
                  </pre>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
