// components/audit/LogRow.tsx
// Linha expansível da tabela de logs de auditoria. Extraído de
// app/(platform)/audit/page.tsx.

'use client';

import { useState } from 'react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Avatar } from './atoms';
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
        className={`cursor-pointer hover:bg-gray-50 border-b border-gray-100 ${expanded ? 'bg-blue-50' : ''}`}
      >
        <td className="px-3 py-2.5">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full flex-shrink-0 ${sevCfg.dot}`}
            />
            <span className="text-xs font-mono text-gray-400">{log.id}</span>
          </div>
        </td>
        <td className="px-3 py-2.5 text-xs text-gray-500 whitespace-nowrap">
          {fmtTs(log.timestamp)}
        </td>
        <td className="px-3 py-2.5">
          {log.user ? (
            <div className="flex items-center gap-1.5">
              <Avatar name={log.user.fullName} avatarUrl={log.user.avatarUrl} />
              <span className="text-xs text-gray-700">{log.user.fullName}</span>
            </div>
          ) : (
            <span className="text-xs text-gray-300 italic">Sistema</span>
          )}
        </td>
        <td className="px-3 py-2.5">
          <span className="text-xs font-medium">
            {actionIcon} {log.action}
          </span>
        </td>
        <td className="px-3 py-2.5 text-xs text-gray-600">
          {log.entity} {log.entityId ? `#${log.entityId}` : ''}
        </td>
        <td className="px-3 py-2.5">
          <StatusBadge value={log.status} map={STATUS_CFG} />
        </td>
        <td className="px-3 py-2.5 text-xs text-gray-400 font-mono">
          {log.ip ?? '—'}
        </td>
        <td className="px-3 py-2.5">
          <span className={`text-xs font-medium ${sevCfg.cls}`}>
            {log.severity}
          </span>
        </td>
      </tr>

      {expanded && (
        <tr className="bg-blue-50">
          <td colSpan={8} className="px-4 py-3">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                {log.reason && (
                  <div className="mb-2">
                    <span className="font-medium text-gray-600">Motivo:</span>{' '}
                    {log.reason}
                  </div>
                )}
                {log.ip && (
                  <div className="mb-1">
                    <span className="font-medium text-gray-600">IP:</span>{' '}
                    {log.ip}
                  </div>
                )}
                {log.userAgent && (
                  <div className="mb-1 truncate text-gray-400">
                    <span className="font-medium text-gray-600">UA:</span>{' '}
                    {log.userAgent}
                  </div>
                )}
                {log.hash && (
                  <div className="mt-2 text-gray-300 font-mono text-xs truncate">
                    Hash: {log.hash.slice(0, 32)}…
                  </div>
                )}
              </div>
              <div>
                {changes && <DiffViewer changes={changes} />}
                {!changes && log.after && (
                  <pre className="text-xs bg-white rounded p-2 max-h-32 overflow-auto">
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
