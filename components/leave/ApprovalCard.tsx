// components/leave/ApprovalCard.tsx
// Cartão de pedido pendente de aprovação (aprovar/rejeitar). Extraído de
// app/(platform)/leave/page.tsx.

'use client';

import { useState } from 'react';
import { Check, Loader2, X } from 'lucide-react';
import type { LeaveRequest } from './types';

export interface ApprovalCardProps {
  request: LeaveRequest;
  onDecide: (id: number, action: string) => void;
}

export function ApprovalCard({ request, onDecide }: ApprovalCardProps) {
  const [loading, setLoading] = useState(false);
  const handle = async (action: string) => {
    setLoading(true);
    try {
      await onDecide(request.id, action);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-blue-100 hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
            {(request.user?.name ?? 'U')[0]}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {request.user?.name}
            </p>
            <p className="text-xs text-gray-400">
              {request.user?.employee?.department}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div
            className="w-3 h-3 rounded-full inline-block"
            style={{ backgroundColor: request.leaveType?.color ?? '#3B82F6' }}
          />
          <p className="text-xs text-gray-500 mt-0.5">
            {request.leaveType?.name}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
        <div className="bg-gray-50 rounded-xl p-2.5">
          <p className="text-gray-400">Início</p>
          <p className="font-semibold text-gray-900 mt-0.5">
            {new Date(request.startDate).toLocaleDateString('pt-PT')}
          </p>
        </div>
        <div className="bg-gray-50 rounded-xl p-2.5">
          <p className="text-gray-400">Dias</p>
          <p className="font-semibold text-gray-900 mt-0.5">
            {request.workDays} dias úteis
          </p>
        </div>
      </div>

      {request.reason && (
        <p className="text-xs text-gray-500 bg-gray-50 rounded-xl p-2.5 mb-4 line-clamp-2">
          {request.reason}
        </p>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => handle('REJECT')}
          disabled={loading}
          className="flex-1 py-2 text-xs font-semibold text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-40 flex items-center justify-center gap-1"
        >
          {loading ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <X size={12} />
          )}{' '}
          Rejeitar
        </button>
        <button
          onClick={() => handle('APPROVE')}
          disabled={loading}
          className="flex-1 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-40 flex items-center justify-center gap-1"
        >
          {loading ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Check size={12} />
          )}{' '}
          Aprovar
        </button>
      </div>
    </div>
  );
}
