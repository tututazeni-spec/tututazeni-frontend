// components/leave/MyLeaveTab.tsx
// Separador "Minhas Ausências" — grelha de saldos + tabela de pedidos.
// Puramente apresentacional (dados chegam via props do container em
// app/(platform)/leave/page.tsx). Extraído de app/(platform)/leave/page.tsx.
// Migrado para a fundação de design: wrapper de tabela bespoke passa a
// Table/TableHead/TableBody/TableHeaderCell, skeleton bespoke passa a
// Skeleton.

import {
  Table,
  TableBody,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableCell,
} from '@/components/ui/Table';
import { Skeleton } from '@/components/ui/Skeleton';
import { BalanceBar } from './BalanceBar';
import { RequestRow } from './RequestRow';
import type { LeaveBalance, LeaveRequest } from './types';

export interface MyLeaveTabProps {
  balances: LeaveBalance[];
  balancesLoading: boolean;
  requestsData: { data: LeaveRequest[]; meta: { total: number } } | null;
  requestsLoading: boolean;
  onCancel: (id: number) => void;
}

export function MyLeaveTab({
  balances,
  balancesLoading,
  requestsData,
  requestsLoading,
  onCancel,
}: MyLeaveTabProps) {
  return (
    <div className="space-y-5">
      {/* Balance grid */}
      <div>
        <h2 className="text-sm font-semibold text-ink-muted mb-3">
          Saldo de Licenças
        </h2>
        {balancesLoading ? (
          <Skeleton
            rows={3}
            wrapperClassName="grid grid-cols-2 md:grid-cols-3 gap-4 animate-pulse"
            itemClassName="h-28 bg-surface-sunken rounded-card"
          />
        ) : balances.length === 0 ? (
          <p className="text-sm text-ink-faint py-4">
            Sem saldos configurados.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {balances.map((b) => (
              <BalanceBar key={b.leaveTypeCode} balance={b} />
            ))}
          </div>
        )}
      </div>

      {/* Requests table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-ink">Meus Pedidos</h2>
          <span className="text-xs text-ink-faint">
            {requestsData?.meta?.total ?? 0} total
          </span>
        </div>
        <Table>
          <TableHead>
            <TableRow>
              {['Tipo', 'Período', 'Dias', 'Estado', ''].map((h) => (
                <TableHeaderCell key={h}>{h}</TableHeaderCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {requestsLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5}>
                    <div className="h-4 bg-surface-sunken rounded animate-pulse" />
                  </TableCell>
                </TableRow>
              ))
            ) : requestsData?.data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-10 text-center text-ink-faint text-sm"
                >
                  Nenhum pedido encontrado
                </TableCell>
              </TableRow>
            ) : (
              requestsData?.data.map((r) => (
                <RequestRow
                  key={r.id}
                  request={r}
                  onCancel={onCancel}
                  onView={() => {}}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
