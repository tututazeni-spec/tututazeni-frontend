// components/employees/EmployeeCard.tsx
// Cartão de colaborador (grid view). Extraído de
// app/(platform)/employees/page.tsx.

'use client';

import { useMemo, useState } from 'react';
import {
  Building2,
  Calendar,
  Edit2,
  Eye,
  MapPin,
  MoreHorizontal,
} from 'lucide-react';
import type { Employee } from '@/hooks/useEmployees';
import { Avatar } from './Avatar';
import { StatusBadge } from './StatusBadge';
import { SENIORITY_LABELS, WORKMODE_LABELS } from './constants';

export interface EmployeeCardProps {
  employee: Employee;
  onView: (e: Employee) => void;
  onEdit: (e: Employee) => void;
}

export function EmployeeCard({ employee, onView, onEdit }: EmployeeCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const tenure = useMemo(() => {
    const joined = new Date(employee.joinedAt);
    const now = new Date();
    const years = now.getFullYear() - joined.getFullYear();
    const months = now.getMonth() - joined.getMonth();
    const total = years * 12 + months;
    if (total < 12) return `${total}m de empresa`;
    return `${Math.floor(total / 12)}a ${total % 12}m de empresa`;
  }, [employee.joinedAt]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-blue-200 hover:shadow-md transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Avatar src={employee.avatarUrl} name={employee.name} size="md" />
          <div>
            <h3 className="font-semibold text-gray-900 text-sm leading-tight group-hover:text-blue-600 transition-colors">
              {employee.name}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {employee.jobTitle ?? employee.role}
            </p>
            {employee.matricula && (
              <p className="text-xs text-gray-400 font-mono">
                {employee.matricula}
              </p>
            )}
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <MoreHorizontal size={16} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-xl border border-gray-100 shadow-lg z-20 py-1">
              <button
                onClick={() => {
                  onView(employee);
                  setMenuOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 w-full"
              >
                <Eye size={13} /> Ver perfil
              </button>
              <button
                onClick={() => {
                  onEdit(employee);
                  setMenuOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 w-full"
              >
                <Edit2 size={13} /> Editar
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-1.5 mb-4">
        {employee.department && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Building2 size={12} className="flex-shrink-0 text-gray-400" />
            <span className="truncate">{employee.department}</span>
          </div>
        )}
        {employee.location && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <MapPin size={12} className="flex-shrink-0 text-gray-400" />
            <span className="truncate">{employee.location}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Calendar size={12} className="flex-shrink-0 text-gray-400" />
          <span>{tenure}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-50">
        <StatusBadge status={employee.status} />
        <div className="flex items-center gap-2">
          {employee.seniority && (
            <span className="text-xs text-gray-400 font-medium">
              {SENIORITY_LABELS[employee.seniority]}
            </span>
          )}
          {employee.workMode && (
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
              {WORKMODE_LABELS[employee.workMode]}
            </span>
          )}
        </div>
      </div>

      {employee._count && (
        <div className="mt-3 pt-3 border-t border-gray-50 grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-sm font-bold text-gray-900">
              {employee._count.employeeSkills}
            </p>
            <p className="text-xs text-gray-400">Skills</p>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">
              {employee._count.pdis}
            </p>
            <p className="text-xs text-gray-400">PDIs</p>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">
              {employee._count.feedbacks}
            </p>
            <p className="text-xs text-gray-400">Feedbacks</p>
          </div>
        </div>
      )}
    </div>
  );
}
