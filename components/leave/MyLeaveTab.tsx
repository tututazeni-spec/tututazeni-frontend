// components/leave/MyLeaveTab.tsx
// Separador "Minhas Ausências" — grelha de saldos + tabela de pedidos.
// Puramente apresentacional (dados chegam via props do container em
// app/(platform)/leave/page.tsx). Extraído de app/(platform)/leave/page.tsx.

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
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          Saldo de Licenças
        </h2>
        {balancesLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-28 bg-gray-100 rounded-2xl" />
            ))}
          </div>
        ) : balances.length === 0 ? (
          <p className="text-sm text-gray-400 py-4">Sem saldos configurados.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {balances.map((b) => (
              <BalanceBar key={b.leaveTypeCode} balance={b} />
            ))}
          </div>
        )}
      </div>

      {/* Requests table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Meus Pedidos</h2>
          <span className="text-xs text-gray-400">
            {requestsData?.meta?.total ?? 0} total
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/60">
                {['Tipo', 'Período', 'Dias', 'Estado', ''].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {requestsLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-4 py-3">
                      <div className="h-4 bg-gray-100 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : requestsData?.data.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-gray-400 text-sm"
                  >
                    Nenhum pedido encontrado
                  </td>
                </tr>
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
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
