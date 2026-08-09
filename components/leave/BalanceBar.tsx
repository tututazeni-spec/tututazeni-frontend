// components/leave/BalanceBar.tsx
// Cartão de saldo de um tipo de licença (usado/pendente/disponível).
// Extraído de app/(platform)/leave/page.tsx.

import type { LeaveBalance } from './types';

export interface BalanceBarProps {
  balance: LeaveBalance;
}

export function BalanceBar({ balance }: BalanceBarProps) {
  const total =
    balance.leaveType?.annualLimit ?? balance.balance + balance.used;
  const usedPct = total > 0 ? Math.round((balance.used / total) * 100) : 0;
  const pendingPct =
    total > 0 ? Math.round((balance.pendingDays / total) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-semibold text-gray-900 text-sm">
            {balance.leaveType.name}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {balance.effectiveBalance} dias disponíveis
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">{balance.balance}</p>
          <p className="text-xs text-gray-400">de {total} dias</p>
        </div>
      </div>

      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden flex">
        <div
          className="h-full rounded-l-full transition-all"
          style={{
            width: `${usedPct}%`,
            backgroundColor: balance.leaveType.color ?? '#3B82F6',
          }}
        />
        {pendingPct > 0 && (
          <div
            className="h-full transition-all opacity-40"
            style={{
              width: `${pendingPct}%`,
              backgroundColor: balance.leaveType.color ?? '#3B82F6',
            }}
          />
        )}
      </div>

      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: balance.leaveType.color }}
          />
          {balance.used} usados
        </span>
        {balance.pendingDays > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-300" />
            {balance.pendingDays} pendentes
          </span>
        )}
      </div>
    </div>
  );
}
