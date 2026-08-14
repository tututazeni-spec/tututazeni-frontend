// components/leave/RequestRow.tsx
// Linha da tabela "Meus Pedidos". Extraído de
// app/(platform)/leave/page.tsx. Migrado para a fundação de design:
// StatusBadge local (duplicado do padrão da fundação) passa a
// components/ui/StatusBadge + STATUS_CFG (lib/statusBadge); botões de
// acção passam a IconButton. O ponto de cor do tipo de licença fica
// dinâmico (`leaveType.color`, hex do backend) — é codificação de dados.

import { Eye, X } from 'lucide-react';
import { IconButton } from '@/components/ui/Button';
import { TableCell, TableRow } from '@/components/ui/Table';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { STATUS_CFG } from './constants';
import type { LeaveRequest } from './types';

export interface RequestRowProps {
  request: LeaveRequest;
  onCancel: (id: number) => void;
  onView: (r: LeaveRequest) => void;
}

export function RequestRow({ request, onCancel, onView }: RequestRowProps) {
  const start = new Date(request.startDate).toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: 'short',
  });
  const end = new Date(request.endDate).toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <TableRow className="group cursor-pointer" onClick={() => onView(request)}>
      <TableCell>
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: request.leaveType?.color ?? '#3B82F6' }}
          />
          <span className="text-sm font-medium text-ink">
            {request.leaveType?.name ?? request.leaveTypeCode}
          </span>
        </div>
      </TableCell>
      <TableCell className="text-sm text-ink-muted">
        {start} → {end}
      </TableCell>
      <TableCell className="text-sm text-ink font-medium">
        {request.workDays}d
      </TableCell>
      <TableCell>
        <StatusBadge value={request.status} map={STATUS_CFG} variant="dot" />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <IconButton
            icon={Eye}
            label="Ver pedido"
            intent="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onView(request);
            }}
          />
          {['PENDING', 'DRAFT'].includes(request.status) && (
            <IconButton
              icon={X}
              label="Cancelar pedido"
              intent="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onCancel(request.id);
              }}
            />
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
