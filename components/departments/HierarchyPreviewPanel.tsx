// components/departments/HierarchyPreviewPanel.tsx
// Cartão de resumo de um colaborador na aba Hierarquia.

'use client';

import {
  Briefcase,
  Building2,
  GitBranch,
  Layers,
  Pencil,
  UserCheck,
  UserRound,
  Users,
  Waypoints,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { PREVIEW_ACTION_BUTTON, PreviewCard } from './PreviewCard';
import type { HierarchyRow } from './types';

interface HierarchyPreviewPanelProps {
  row: HierarchyRow;
  onChangeManager?: (row: HierarchyRow) => void;
  onClose: () => void;
}

export function HierarchyPreviewPanel({
  row,
  onChangeManager,
  onClose,
}: HierarchyPreviewPanelProps) {
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
      subtitle={row.position?.name}
      onClose={onClose}
      fields={[
        {
          icon: UserRound,
          label: 'Colaborador',
          value: (
            <span className="flex items-center gap-2">
              <Avatar
                name={row.fullName}
                url={row.avatarUrl ?? undefined}
                size="sm"
              />
              {row.fullName}
              {!row.active && (
                <span className="text-xs font-normal text-brand-muted">
                  (Inactivo)
                </span>
              )}
            </span>
          ),
        },
        { icon: Briefcase, label: 'Cargo', value: row.position?.name ?? '—' },
        {
          icon: Building2,
          label: 'Departamento',
          value: `${row.department?.name ?? '—'}${row.subdepartment ? ` · ${row.subdepartment}` : ''}`,
        },
        {
          icon: UserCheck,
          label: 'Responsável directo',
          value: row.manager?.fullName ?? '—',
        },
        { icon: Layers, label: 'Nível', value: row.level },
        {
          icon: Users,
          label: 'Subordinados directos',
          value: row.directReportsCount,
        },
        {
          icon: GitBranch,
          label: 'Subordinados indirectos',
          value: row.indirectReportsCount,
        },
        {
          icon: Waypoints,
          label: 'Cadeia de reporte',
          value:
            row.reportingChain.length > 0
              ? row.reportingChain.join(' → ')
              : '—',
        },
      ]}
      actions={
        onChangeManager && (
          <button
            type="button"
            onClick={() => onChangeManager(row)}
            className={PREVIEW_ACTION_BUTTON}
          >
            <Pencil size={18} strokeWidth={1.75} />
            Alterar responsável directo
          </button>
        )
      }
    />
  );
}
