// components/evaluation/PendingTab.tsx
// Separador "Pendentes" — lista de avaliações por preencher. Dados
// próprios (useApiQuery) + apresentação. Extraído de
// app/(platform)/evaluation/page.tsx.

'use client';

import { CheckCircle } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar, Skeleton } from './atoms';
import { TYPE_LABEL } from './constants';
import type { EvalRequest } from './types';

const TYPE_COLOR: Record<string, string> = {
  SELF: 'bg-emerald-100 text-emerald-700',
  MANAGER: 'bg-purple-100 text-purple-700',
  PEER: 'bg-blue-100 text-blue-700',
  SUBORDINATE: 'bg-amber-100 text-amber-700',
  CLIENT: 'bg-orange-100 text-orange-700',
};

export function PendingTab() {
  const { data: pending = [], isLoading: loading } = useApiQuery<EvalRequest[]>(
    queryKeys.evaluation.pending(),
    '/evaluations/pending',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (loading) return <Skeleton />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-700">Avaliações Pendentes</h3>
        <span
          className={`text-sm font-bold px-3 py-1 rounded-full ${pending.length > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}
        >
          {pending.length} pendentes
        </span>
      </div>

      <div className="space-y-3">
        {pending.map((r) => {
          const isOverdue = r.dueDate && new Date(r.dueDate) < new Date();
          return (
            <div
              key={r.id}
              className={`bg-white rounded-xl border p-4 hover:shadow-sm transition-shadow ${
                isOverdue ? 'border-red-200 bg-red-50' : 'border-slate-100'
              }`}
            >
              <div className="flex items-center gap-4">
                <Avatar
                  name={r.evaluated.fullName}
                  url={r.evaluated.avatarUrl}
                  size={10}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <p className="text-sm font-semibold text-slate-800">
                      {r.evaluated.fullName}
                    </p>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${TYPE_COLOR[r.type]}`}
                    >
                      {TYPE_LABEL[r.type]}
                    </span>
                    {isOverdue && (
                      <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                        ATRASADO
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    {r.evaluated.position?.name} ·{' '}
                    {r.evaluated.department?.name}
                  </p>
                  {r.cycle && (
                    <p className="text-xs text-slate-400">📋 {r.cycle.name}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  {r.dueDate && (
                    <p
                      className={`text-xs font-medium ${isOverdue ? 'text-red-600' : 'text-slate-500'}`}
                    >
                      {isOverdue ? '⚠️' : '⏰'}{' '}
                      {new Date(r.dueDate).toLocaleDateString('pt')}
                    </p>
                  )}
                  <button className="mt-2 px-4 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700">
                    Avaliar →
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {pending.length === 0 && (
          <div className="py-16 text-center bg-emerald-50 rounded-xl border border-emerald-100">
            <CheckCircle size={40} className="mx-auto mb-3 text-emerald-400" />
            <p className="font-medium text-emerald-700">Estás em dia!</p>
            <p className="text-sm text-emerald-600">Sem avaliações pendentes</p>
          </div>
        )}
      </div>
    </div>
  );
}
