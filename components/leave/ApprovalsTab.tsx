// components/leave/ApprovalsTab.tsx
// Separador "Aprovações" — fila de pedidos pendentes + aprovação em massa.
// Puramente apresentacional. Extraído de app/(platform)/leave/page.tsx.

import { Check, CheckCircle2 } from 'lucide-react';
import { ApprovalCard } from './ApprovalCard';
import type { LeaveRequest } from './types';

export interface ApprovalsTabProps {
  pending: LeaveRequest[];
  loading: boolean;
  onDecide: (id: number, action: string) => void;
  onBulkApprove: (ids: number[]) => void;
  bulkApproving: boolean;
}

export function ApprovalsTab({
  pending,
  loading,
  onDecide,
  onBulkApprove,
  bulkApproving,
}: ApprovalsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">
          Pedidos Pendentes de Aprovação
        </h2>
        {pending.length > 1 && (
          <button
            onClick={() => onBulkApprove(pending.map((r) => r.id))}
            disabled={bulkApproving}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors disabled:opacity-50"
          >
            <Check size={13} /> Aprovar todos ({pending.length})
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-48 bg-gray-100 rounded-2xl" />
          ))}
        </div>
      ) : pending.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <CheckCircle2 size={48} className="mb-4 opacity-30" />
          <p className="text-sm font-medium">Sem pedidos pendentes</p>
          <p className="text-xs mt-1">Todos os pedidos foram processados</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pending.map((r) => (
            <ApprovalCard key={r.id} request={r} onDecide={onDecide} />
          ))}
        </div>
      )}
    </div>
  );
}
