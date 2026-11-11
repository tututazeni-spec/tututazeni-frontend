// components/departments/EmployeePreviewPanel.tsx
// Cartão de resumo de um colaborador (aba Colaboradores).

'use client';

import {
  Activity,
  Briefcase,
  Building2,
  CalendarDays,
  FileText,
  MapPin,
  Network,
  UserCheck,
  UserRound,
} from 'lucide-react';
import { CONTRACT_LABELS } from '@/components/employees/constants';
import { Avatar } from '@/components/ui/Avatar';
import { formatDateNumeric } from '@/lib/format';
import { PreviewCard } from './PreviewCard';
import type { EmployeeRow } from './types';

interface EmployeePreviewPanelProps {
  row: EmployeeRow;
  onClose: () => void;
}

export function EmployeePreviewPanel({
  row,
  onClose,
}: EmployeePreviewPanelProps) {
  const contract = row.contractType
    ? ((CONTRACT_LABELS as Record<string, string>)[row.contractType] ??
      row.contractType)
    : '—';
  return (
    <PreviewCard
      ariaLabel={`Resumo de ${row.fullName}`}
      lead={
        <Avatar
          name={row.fullName}
          url={row.avatarUrl ?? undefined}
          size="md"
        />
      }
      title={row.fullName}
      subtitle={row.position?.name ?? row.email}
      onClose={onClose}
      fields={[
        {
          icon: UserRound,
          label: 'Colaborador',
          value: (
            <span className="flex flex-col">
              <span>{row.fullName}</span>
              <span className="break-all text-xs font-normal text-brand-muted">
                {row.employeeNumber ? `${row.employeeNumber} · ` : ''}
                {row.email}
              </span>
            </span>
          ),
        },
        { icon: Briefcase, label: 'Cargo', value: row.position?.name ?? '—' },
        {
          icon: Building2,
          label: 'Departamento',
          value: row.department?.name ?? '—',
        },
        {
          icon: Network,
          label: 'Subdepartamento',
          value: row.subdepartment ?? '—',
        },
        {
          icon: UserCheck,
          label: 'Responsável directo',
          value: row.manager?.fullName ?? '—',
        },
        { icon: MapPin, label: 'Localização', value: row.location ?? '—' },
        { icon: FileText, label: 'Tipo de vínculo', value: contract },
        {
          icon: CalendarDays,
          label: 'Admissão',
          value: row.hireDate ? formatDateNumeric(row.hireDate) : '—',
        },
        {
          icon: Activity,
          label: 'Estado',
          value: row.active ? 'Activo' : 'Inactivo',
        },
      ]}
    />
  );
}
