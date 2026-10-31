// components/employees/EmployeeCard.tsx
// Cartão de colaborador (grid view). O desenho é o do Diretório (PersonCard),
// igual para todos os roles; aqui só mudam o menu (Ver perfil / Editar) e a
// informação de gestão (estado, senioridade, modo de trabalho, contagens).

'use client';

import { Edit2, Eye, MoreHorizontal } from 'lucide-react';
import type { Employee } from '@/hooks/useEmployees';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PersonCard } from '@/components/users/PersonCard';
import { SENIORITY_LABELS, STATUS_MAP, WORKMODE_LABELS } from './constants';

export interface EmployeeCardProps {
  employee: Employee;
  onView: (e: Employee) => void;
  onEdit: (e: Employee) => void;
}

export function EmployeeCard({ employee, onView, onEdit }: EmployeeCardProps) {
  return (
    <PersonCard
      fullName={employee.name}
      avatarUrl={employee.avatarUrl}
      departmentName={employee.department}
      email={employee.email}
      positionName={employee.jobTitle ?? employee.role}
      onOpen={() => onView(employee)}
      menu={
        <div
          className="absolute right-3 top-2.5"
          onClick={(ev) => ev.stopPropagation()}
          onKeyDown={(ev) => ev.stopPropagation()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={`Acções de ${employee.name}`}
                className="rounded-control p-1 text-white/90 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
              >
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => onView(employee)}>
                <Eye size={14} strokeWidth={1.75} /> Ver perfil
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onEdit(employee)}>
                <Edit2 size={14} strokeWidth={1.75} /> Editar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      }
      footer={
        <div className="mt-4 space-y-3 border-t border-border pt-3">
          <div className="flex items-center justify-between">
            <StatusBadge
              value={employee.status}
              map={STATUS_MAP}
              variant="dot"
            />
            <div className="flex items-center gap-2">
              {employee.seniority && (
                <span className="text-xs font-medium text-ink-faint">
                  {SENIORITY_LABELS[employee.seniority]}
                </span>
              )}
              {employee.workMode && (
                <span className="rounded-pill bg-surface-sunken px-2 py-0.5 text-xs text-ink-muted">
                  {WORKMODE_LABELS[employee.workMode]}
                </span>
              )}
            </div>
          </div>
          {employee._count && (
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-sm font-bold text-ink">
                  {employee._count.employeeSkills}
                </p>
                <p className="text-xs text-ink-faint">Competências</p>
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
        </div>
      }
    />
  );
}
