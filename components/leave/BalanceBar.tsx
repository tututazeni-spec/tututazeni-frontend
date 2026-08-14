// components/leave/BalanceBar.tsx
// Cartão de saldo de um tipo de licença (usado/pendente/disponível).
// Extraído de app/(platform)/leave/page.tsx. Migrado para a fundação de
// design: wrapper bespoke passa a Card, classes de paleta crua passam a
// tokens. A cor da barra/pontos vem de `leaveType.color` (hex definido no
// backend por tipo de licença) — é codificação de dados (qual tipo), não
// decoração, por isso fica como `style` dinâmico em vez de forçada para um
// dos 6 tokens semânticos (mesma lógica da nota "gráficos" do plano de
// rollout).

import { Card } from '@/components/ui/Card';
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
    <Card className="p-5">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <p className="font-body text-sm font-semibold text-ink">
            {balance.leaveType.name}
          </p>
          <p className="mt-0.5 font-body text-xs text-ink-faint">
            {balance.effectiveBalance} dias disponíveis
          </p>
        </div>
        <div className="text-right">
          <p className="font-display text-2xl font-bold text-ink">
            {balance.balance}
          </p>
          <p className="font-body text-xs text-ink-faint">de {total} dias</p>
        </div>
      </div>

      <div className="flex h-2.5 overflow-hidden rounded-pill bg-surface-sunken">
        <div
          className="h-full rounded-l-full transition-all"
          style={{
            width: `${usedPct}%`,
            backgroundColor: balance.leaveType.color ?? '#3B82F6',
          }}
        />
        {pendingPct > 0 && (
          <div
            className="h-full opacity-40 transition-all"
            style={{
              width: `${pendingPct}%`,
              backgroundColor: balance.leaveType.color ?? '#3B82F6',
            }}
          />
        )}
      </div>

      <div className="mt-2 flex items-center gap-4 font-body text-xs text-ink-muted">
        <span className="flex items-center gap-1">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: balance.leaveType.color }}
          />
          {balance.used} usados
        </span>
        {balance.pendingDays > 0 && (
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-warning" />
            {balance.pendingDays} pendentes
          </span>
        )}
      </div>
    </Card>
  );
}
