// components/departments/HeadPreviewPanel.tsx
// Cartão de resumo de um responsável (aba Responsáveis).

'use client';

import {
  Activity,
  Briefcase,
  Building2,
  CalendarDays,
  GitBranch,
  Mail,
  UserCog,
  UserRound,
  Users,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { formatDateNumeric } from '@/lib/format';
import { PREVIEW_ACTION_BUTTON, PreviewCard } from './PreviewCard';
import type { HeadRow } from './types';

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
  ARCHIVED: 'Arquivado',
};

interface HeadPreviewPanelProps {
  row: HeadRow;
  onChangeHead?: (row: HeadRow) => void;
  onClose: () => void;
}

export function HeadPreviewPanel({
  row,
  onChangeHead,
  onClose,
}: HeadPreviewPanelProps) {
  const name = row.head?.fullName ?? 'Por atribuir';
  return (
    <PreviewCard
      ariaLabel={`Resumo de ${name}`}
      lead={
        row.head ? (
          <Avatar name={row.head.fullName} size="md" />
        ) : (
          <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#078BFF] text-white">
            <UserRound size={24} strokeWidth={1.75} />
          </span>
        )
      }
      title={name}
      subtitle={row.position ?? 'Responsável'}
      onClose={onClose}
      fields={[
        { icon: Building2, label: 'Departamento', value: row.departmentName },
        {
          icon: UserRound,
          label: 'Responsável',
          value: row.head ? (
            <span className="flex items-center gap-2">
              <Avatar name={row.head.fullName} size="sm" />
              {row.head.fullName}
            </span>
          ) : (
            'Por atribuir'
          ),
        },
        { icon: Briefcase, label: 'Cargo', value: row.position ?? '—' },
        {
          icon: UserCog,
          label: 'Substituto',
          value: row.deputyHead?.fullName ?? '—',
        },
        {
          icon: CalendarDays,
          label: 'Desde',
          value: row.startedAt ? formatDateNumeric(row.startedAt) : '—',
        },
        {
          icon: Activity,
          label: 'Estado',
          value: STATUS_LABEL[row.status] ?? row.status,
        },
        {
          icon: Mail,
          label: 'Contacto',
          value: <span className="break-all">{row.contact ?? '—'}</span>,
        },
        {
          icon: Users,
          label: 'Colaboradores',
          value: row.usersUnderResponsibility,
        },
        {
          icon: GitBranch,
          label: 'Subdeptos',
          value: row.subdepartmentsUnderResponsibility,
        },
      ]}
      actions={
        onChangeHead && (
          <button
            type="button"
            onClick={() => onChangeHead(row)}
            className={PREVIEW_ACTION_BUTTON}
          >
            <UserCog size={18} strokeWidth={1.75} />
            Alterar responsável
          </button>
        )
      }
    />
  );
}
