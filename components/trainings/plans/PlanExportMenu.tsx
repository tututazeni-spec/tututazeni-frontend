// components/trainings/plans/PlanExportMenu.tsx
// Botão único «Exportar» do plano de formação: ao clicar abre as duas opções
// (CSV / PDF). Usado no card da lista e no detalhe do plano.

'use client';

import type { ReactNode } from 'react';
import { FileSpreadsheet, FileText } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';

interface PlanExportMenuProps {
  planId: number;
  /** Botão que abre o menu (recebe o clique via asChild). */
  children: ReactNode;
}

export function PlanExportMenu({ planId, children }: PlanExportMenuProps) {
  const base = `/api/training-plans/${planId}/export`;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <a href={base} className="flex items-center gap-2">
            <FileSpreadsheet size={15} strokeWidth={1.75} />
            Exportar CSV
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={`${base}?format=pdf`} className="flex items-center gap-2">
            <FileText size={15} strokeWidth={1.75} />
            Exportar PDF
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
