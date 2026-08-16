// components/attendance/LeaveBalanceCard.tsx
// Barras de saldo de licenças. Extraído de
// app/(platform)/attendance/page.tsx.

'use client';

import { LEAVE_LABELS } from './constants';
import type { LeaveBalance, LeaveType } from './types';

interface LeaveBalanceCardProps {
  balances: LeaveBalance[];
}

export function LeaveBalanceCard({ balances }: LeaveBalanceCardProps) {
  return (
    <div className="bg-surface rounded-panel border border-border shadow-sm p-5">
      <h3 className="font-semibold text-ink text-sm mb-4">
        Saldo de Licenças
      </h3>
      <div className="space-y-3">
        {balances.map((b) => {
          const pct =
            b.entitled > 0 ? Math.round((b.used / b.entitled) * 100) : 0;
          const type = b.type as LeaveType;
          return (
            <div key={b.type}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-ink-muted">
                  {LEAVE_LABELS[type] ?? b.type}
                </span>
                <span className="text-xs font-semibold text-ink">
                  {b.remaining} / {b.entitled} dias
                </span>
              </div>
              <div className="h-2 bg-surface-sunken rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${pct > 80 ? 'bg-danger' : pct > 50 ? 'bg-warning' : 'bg-success'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
