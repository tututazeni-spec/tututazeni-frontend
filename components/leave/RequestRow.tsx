// components/leave/RequestRow.tsx
// Linha da tabela "Meus Pedidos". Extraído de
// app/(platform)/leave/page.tsx.

import { Eye, X } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
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
    <tr
      className="hover:bg-gray-50/50 group cursor-pointer"
      onClick={() => onView(request)}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: request.leaveType?.color ?? '#3B82F6' }}
          />
          <span className="text-sm font-medium text-gray-900">
            {request.leaveType?.name ?? request.leaveTypeCode}
          </span>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {start} → {end}
      </td>
      <td className="px-4 py-3 text-sm text-gray-700 font-medium">
        {request.workDays}d
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={request.status} />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView(request);
            }}
            className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600"
          >
            <Eye size={13} />
          </button>
          {['PENDING', 'DRAFT'].includes(request.status) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCancel(request.id);
              }}
              className="p-1.5 rounded-lg hover:bg-red-100 text-red-600"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
