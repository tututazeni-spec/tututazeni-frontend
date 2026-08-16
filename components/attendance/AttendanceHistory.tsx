// components/attendance/AttendanceHistory.tsx
// Tabela de histórico de presenças. Extraído de
// app/(platform)/attendance/page.tsx.

'use client';

import { StatusBadge } from '@/components/ui/StatusBadge';
import { STATUS_CONFIG } from './constants';
import { MinutesToTime } from './utils';
import type { AttendanceRecord, AttendanceStatus } from './types';
import type { StatusBadgeMap } from '@/lib/statusBadge';

// Construir mapa para StatusBadge usando STATUS_CONFIG
const STATUS_BADGE_MAP: StatusBadgeMap<AttendanceStatus> = Object.fromEntries(
  Object.entries(STATUS_CONFIG).map(([key, cfg]) => [
    key,
    { label: cfg.label, cls: cfg.color },
  ]),
) as StatusBadgeMap<AttendanceStatus>;

interface AttendanceHistoryProps {
  records: AttendanceRecord[];
}

export function AttendanceHistory({ records }: AttendanceHistoryProps) {
  return (
    <div className="bg-surface rounded-panel border border-border shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="font-semibold text-ink text-sm">
          Histórico de Presenças
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-surface-sunken">
              {[
                'Data',
                'Entrada',
                'Saída',
                'Horas',
                'Horas Extra',
                'Status',
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wide whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {records.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-ink-muted text-sm"
                >
                  Nenhum registo encontrado
                </td>
              </tr>
            )}
            {records.map((r) => (
              <tr key={r.id} className="hover:bg-primary-subtle transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-ink">
                  {new Date(r.date).toLocaleDateString('pt-PT', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </td>
                <td className="px-4 py-3 text-sm text-ink-muted font-data">
                  {r.clockIn ?? '—'}
                </td>
                <td className="px-4 py-3 text-sm text-ink-muted font-data">
                  {r.clockOut ?? '—'}
                </td>
                <td className="px-4 py-3 text-sm text-ink">
                  {r.workMinutes ? MinutesToTime(r.workMinutes) : '—'}
                </td>
                <td className="px-4 py-3 text-sm">
                  {(r.overtimeMinutes ?? 0) > 0 ? (
                    <span className="text-warning font-medium">
                      +{MinutesToTime(r.overtimeMinutes!)}
                    </span>
                  ) : (
                    <span className="text-ink-muted">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge
                    value={r.status as AttendanceStatus}
                    map={STATUS_BADGE_MAP}
                    variant="dot"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
