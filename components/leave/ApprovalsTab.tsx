// components/leave/ApprovalsTab.tsx
// Separador "Aprovações" — fila de pedidos pendentes + aprovação em massa.
// Puramente apresentacional. Extraído de app/(platform)/leave/page.tsx.
// Migrado para a fundação de design: skeleton bespoke passa a Skeleton,
// estado vazio passa a EmptyState, botão de aprovação em massa passa a
// Button (intent="success").

import { Check, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
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
        <h2 className="text-sm font-semibold text-ink-muted">
          Pedidos Pendentes de Aprovação
        </h2>
        {pending.length > 1 && (
          <Button
            intent="success"
            size="sm"
            loading={bulkApproving}
            onClick={() => onBulkApprove(pending.map((r) => r.id))}
          >
            {!bulkApproving && <Check size={13} strokeWidth={1.75} />}
            Aprovar todos ({pending.length})
          </Button>
        )}
      </div>

      {loading ? (
        <Skeleton
          rows={4}
          wrapperClassName="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse"
          itemClassName="h-48 bg-surface-sunken rounded-card"
        />
      ) : pending.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="Sem pedidos pendentes"
          description="Todos os pedidos foram processados."
        />
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
