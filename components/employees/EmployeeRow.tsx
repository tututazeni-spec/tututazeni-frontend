// components/employees/EmployeeRow.tsx
// Linha de colaborador (list view). Extraído de
// app/(platform)/employees/page.tsx.

import { Edit2, Eye } from 'lucide-react';
import type { Employee } from '@/hooks/useEmployees';
import { Avatar } from '@/components/ui/Avatar';
import { IconButton } from '@/components/ui/Button';
import { TableCell, TableRow } from '@/components/ui/Table';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SENIORITY_LABELS, STATUS_MAP } from './constants';

export interface EmployeeRowProps {
  employee: Employee;
  onView: (e: Employee) => void;
  onEdit: (e: Employee) => void;
}

export function EmployeeRow({ employee, onView, onEdit }: EmployeeRowProps) {
  return (
    <TableRow className="group cursor-pointer" onClick={() => onView(employee)}>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar url={employee.avatarUrl} name={employee.name} size="sm" />
          <div>
            <p className="text-sm font-semibold text-ink group-hover:text-primary transition-colors">
              {employee.name}
            </p>
            <p className="text-xs text-ink-faint">{employee.email}</p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <p className="text-sm text-ink">
          {employee.jobTitle ?? employee.role}
        </p>
        <p className="text-xs text-ink-faint">{employee.department ?? '—'}</p>
      </TableCell>
      <TableCell className="text-sm text-ink-muted">
        {employee.location ?? '—'}
      </TableCell>
      <TableCell>
        {employee.seniority ? (
          <span className="text-xs font-medium text-ink-muted bg-surface-sunken px-2 py-1 rounded-pill">
            {SENIORITY_LABELS[employee.seniority]}
          </span>
        ) : (
          '—'
        )}
      </TableCell>
      <TableCell>
        <StatusBadge value={employee.status} map={STATUS_MAP} variant="dot" />
      </TableCell>
      <TableCell>
        <p className="text-xs text-ink-muted">
          {new Date(employee.joinedAt).toLocaleDateString('pt-BR')}
        </p>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <IconButton
            icon={Eye}
            label="Ver perfil"
            intent="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onView(employee);
            }}
          />
          <IconButton
            icon={Edit2}
            label="Editar"
            intent="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(employee);
            }}
          />
        </div>
      </TableCell>
    </TableRow>
  );
}
