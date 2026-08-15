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
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SENIORITY_LABELS, STATUS_MAP, WORKMODE_LABELS } from './constants';

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
    <Card className="p-5 hover:border-primary/30 hover:shadow-hover transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Avatar url={employee.avatarUrl} name={employee.name} size="md" />
          <div>
            <h3 className="font-semibold text-ink text-sm leading-tight group-hover:text-primary transition-colors">
              {employee.name}
            </h3>
            <p className="text-xs text-ink-muted mt-0.5">
              {employee.jobTitle ?? employee.role}
            </p>
            {employee.matricula && (
              <p className="text-xs text-ink-faint font-mono">
                {employee.matricula}
              </p>
            )}
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-control hover:bg-surface-sunken text-ink-faint hover:text-ink-muted transition-colors"
          >
            <MoreHorizontal size={16} strokeWidth={1.75} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-36 bg-surface rounded-card border border-border shadow-elevated z-20 py-1">
              <button
                onClick={() => {
                  onView(employee);
                  setMenuOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-2 text-xs text-ink hover:bg-surface-sunken w-full"
              >
                <Eye size={14} strokeWidth={1.75} /> Ver perfil
              </button>
              <button
                onClick={() => {
                  onEdit(employee);
                  setMenuOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-2 text-xs text-ink hover:bg-surface-sunken w-full"
              >
                <Edit2 size={14} strokeWidth={1.75} /> Editar
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-1.5 mb-4">
        {employee.department && (
          <div className="flex items-center gap-2 text-xs text-ink-muted">
            <Building2 size={14} strokeWidth={1.75} className="flex-shrink-0 text-ink-faint" />
            <span className="truncate">{employee.department}</span>
          </div>
        )}
        {employee.location && (
          <div className="flex items-center gap-2 text-xs text-ink-muted">
            <MapPin size={14} strokeWidth={1.75} className="flex-shrink-0 text-ink-faint" />
            <span className="truncate">{employee.location}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-ink-muted">
          <Calendar size={14} strokeWidth={1.75} className="flex-shrink-0 text-ink-faint" />
          <span>{tenure}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border">
        <StatusBadge value={employee.status} map={STATUS_MAP} variant="dot" />
        <div className="flex items-center gap-2">
          {employee.seniority && (
            <span className="text-xs text-ink-faint font-medium">
              {SENIORITY_LABELS[employee.seniority]}
            </span>
          )}
          {employee.workMode && (
            <span className="px-2 py-0.5 bg-surface-sunken text-ink-muted rounded-pill text-xs">
              {WORKMODE_LABELS[employee.workMode]}
            </span>
          )}
        </div>
      </div>

      {employee._count && (
        <div className="mt-3 pt-3 border-t border-border grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-sm font-bold text-ink">
              {employee._count.employeeSkills}
            </p>
            <p className="text-xs text-ink-faint">Skills</p>
          </div>
          <div>
            <p className="text-sm font-bold text-ink">
              {employee._count.pdis}
            </p>
            <p className="text-xs text-ink-faint">PDIs</p>
          </div>
          <div>
            <p className="text-sm font-bold text-ink">
              {employee._count.feedbacks}
            </p>
            <p className="text-xs text-ink-faint">Feedbacks</p>
          </div>
        </div>
      )}
    </Card>
  );
}
