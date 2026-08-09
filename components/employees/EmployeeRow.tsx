// components/employees/EmployeeRow.tsx
// Linha de colaborador (list view). Extraído de
// app/(platform)/employees/page.tsx.

import { Edit2, Eye } from 'lucide-react';
import type { Employee } from '@/hooks/useEmployees';
import { Avatar } from './Avatar';
import { StatusBadge } from './StatusBadge';
import { SENIORITY_LABELS } from './constants';

export interface EmployeeRowProps {
  employee: Employee;
  onView: (e: Employee) => void;
  onEdit: (e: Employee) => void;
}

export function EmployeeRow({ employee, onView, onEdit }: EmployeeRowProps) {
  return (
    <tr
      className="hover:bg-blue-50/30 transition-colors group cursor-pointer"
      onClick={() => onView(employee)}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar src={employee.avatarUrl} name={employee.name} size="sm" />
          <div>
            <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {employee.name}
            </p>
            <p className="text-xs text-gray-400">{employee.email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <p className="text-sm text-gray-700">
          {employee.jobTitle ?? employee.role}
        </p>
        <p className="text-xs text-gray-400">{employee.department ?? '—'}</p>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {employee.location ?? '—'}
      </td>
      <td className="px-4 py-3">
        {employee.seniority ? (
          <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
            {SENIORITY_LABELS[employee.seniority]}
          </span>
        ) : (
          '—'
        )}
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={employee.status} />
      </td>
      <td className="px-4 py-3">
        <p className="text-xs text-gray-500">
          {new Date(employee.joinedAt).toLocaleDateString('pt-BR')}
        </p>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView(employee);
            }}
            className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600 transition-colors"
          >
            <Eye size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(employee);
            }}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
          >
            <Edit2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
}
