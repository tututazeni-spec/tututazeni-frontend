// components/leave/ApprovalCard.tsx
// Cartão de pedido pendente de aprovação (aprovar/rejeitar). Extraído de
// app/(platform)/leave/page.tsx. Migrado para a fundação de design:
// wrapper bespoke passa a Card, avatar-gradiente-por-iniciais local passa a
// Avatar (components/ui), botões passam a Button com os intents
// success/warning/danger (PR #208) directamente aplicáveis aqui. A cor do
// ponto de tipo de licença fica dinâmica (`leaveType.color`, hex do
// backend) — é codificação de dados, não decoração.

'use client';

import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
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
    <Card className="p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <Avatar name={request.user?.name ?? 'U'} size="md" />
          <div>
            <p className="text-sm font-semibold text-ink">
              {request.user?.name}
            </p>
            <p className="text-xs text-ink-faint">
              {request.user?.employee?.department}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div
            className="w-3 h-3 rounded-full inline-block"
            style={{ backgroundColor: request.leaveType?.color ?? '#3B82F6' }}
          />
          <p className="text-xs text-ink-muted mt-0.5">
            {request.leaveType?.name}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
        <div className="bg-surface-sunken rounded-control p-2.5">
          <p className="text-ink-faint">Início</p>
          <p className="font-semibold text-ink mt-0.5">
            {new Date(request.startDate).toLocaleDateString('pt-PT')}
          </p>
        </div>
        <div className="bg-surface-sunken rounded-control p-2.5">
          <p className="text-ink-faint">Dias</p>
          <p className="font-semibold text-ink mt-0.5">
            {request.workDays} dias úteis
          </p>
        </div>
      </div>

      {request.reason && (
        <p className="text-xs text-ink-muted bg-surface-sunken rounded-control p-2.5 mb-4 line-clamp-2">
          {request.reason}
        </p>
      )}

      <div className="flex gap-2">
        <Button
          intent="danger"
          size="sm"
          loading={loading}
          onClick={() => handle('REJECT')}
          className="flex-1"
        >
          {!loading && <X size={12} strokeWidth={1.75} />}
          Rejeitar
        </Button>
        <Button
          intent="success"
          size="sm"
          loading={loading}
          onClick={() => handle('APPROVE')}
          className="flex-1"
        >
          {!loading && <Check size={12} strokeWidth={1.75} />}
          Aprovar
        </Button>
      </div>
    </Card>
  );
}
