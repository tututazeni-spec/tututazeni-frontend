// components/attendance/AttendanceHistory.tsx
// Tabela de histórico de presenças. Extraído de
// app/(platform)/attendance/page.tsx.

'use client';

import { StatusBadge } from './atoms';
import { MinutesToTime } from './utils';
import type { AttendanceRecord } from './types';

interface AttendanceHistoryProps {
  records: AttendanceRecord[];
}

export function AttendanceHistory({ records }: AttendanceHistoryProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-50">
        <h3 className="font-semibold text-gray-900 text-sm">
          Histórico de Presenças
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/60">
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
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {records.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-gray-400 text-sm"
                >
                  Nenhum registo encontrado
                </td>
              </tr>
            )}
            {records.map((r) => (
              <tr key={r.id} className="hover:bg-blue-50/20 transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {new Date(r.date).toLocaleDateString('pt-PT', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                  {r.clockIn ?? '—'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                  {r.clockOut ?? '—'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {r.workMinutes ? MinutesToTime(r.workMinutes) : '—'}
                </td>
                <td className="px-4 py-3 text-sm">
                  {(r.overtimeMinutes ?? 0) > 0 ? (
                    <span className="text-amber-600 font-medium">
                      +{MinutesToTime(r.overtimeMinutes!)}
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={r.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
