// components/trainings/plans/PlanActionsMenu.tsx
// Menu «⋯» do card do plano de formação: Editar, Adicionar formações, Duplicar, Exportar (CSV/PDF),
// Arquivar e Eliminar. Só decide o que mostrar; a lógica fica no PlansView.

'use client';

import {
  Archive,
  Copy,
  FileSpreadsheet,
  FileText,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import type { TrainingPlanStatus } from '../types';

interface PlanActionsMenuProps {
  planId: number;
  planName: string;
  status: TrainingPlanStatus;
  disabled?: boolean;
  onEdit: () => void;
  onAddTraining: () => void;
  onDuplicate: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

const ITEM = 'flex items-center gap-2';

export function PlanActionsMenu({
  planId,
  planName,
  status,
  disabled,
  onEdit,
  onAddTraining,
  onDuplicate,
  onArchive,
  onDelete,
}: PlanActionsMenuProps) {
  const exportUrl = `/api/training-plans/${planId}/export`;
  const canEdit = status === 'DRAFT' || status === 'REJECTED';
  const canArchive = status !== 'ARCHIVED';
  const canDelete =
    status === 'DRAFT' || status === 'REJECTED' || status === 'ARCHIVED';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          intent="onDarkGhost"
          size="icon"
          aria-label={`Mais acções de ${planName}`}
          title="Mais acções"
          disabled={disabled}
        >
          <MoreHorizontal size={16} strokeWidth={1.75} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {canEdit && (
          <DropdownMenuItem className={ITEM} onSelect={onEdit}>
            <Pencil size={15} strokeWidth={1.75} />
            Editar
          </DropdownMenuItem>
        )}
        {canArchive && (
          <DropdownMenuItem className={ITEM} onSelect={onAddTraining}>
            <Plus size={15} strokeWidth={1.75} />
            Adicionar formações
          </DropdownMenuItem>
        )}
        <DropdownMenuItem className={ITEM} onSelect={onDuplicate}>
          <Copy size={15} strokeWidth={1.75} />
          Duplicar
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={exportUrl} className={ITEM}>
            <FileSpreadsheet size={15} strokeWidth={1.75} />
            Exportar CSV
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={`${exportUrl}?format=pdf`} className={ITEM}>
            <FileText size={15} strokeWidth={1.75} />
            Exportar PDF
          </a>
        </DropdownMenuItem>
        {(canArchive || canDelete) && <DropdownMenuSeparator />}
        {canArchive && (
          <DropdownMenuItem className={ITEM} onSelect={onArchive}>
            <Archive size={15} strokeWidth={1.75} />
            Arquivar
          </DropdownMenuItem>
        )}
        {canDelete && (
          <DropdownMenuItem
            className={`${ITEM} text-danger-ink`}
            onSelect={onDelete}
          >
            <Trash2 size={15} strokeWidth={1.75} />
            Eliminar
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
