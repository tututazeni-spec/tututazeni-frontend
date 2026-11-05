// components/ui/ExportMenu.tsx
// Botão «Exportar» com as três opções (CSV, Excel, PDF). Sem lógica de
// exportação: o módulo decide o que cada formato faz em `onExport`.

'use client';

import { Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import type { ExportFormat } from '@/lib/tableExport';

const OPTIONS: { format: ExportFormat; label: string }[] = [
  { format: 'csv', label: 'Exportar CSV' },
  { format: 'xlsx', label: 'Exportar Excel' },
  { format: 'pdf', label: 'Exportar PDF' },
];

export interface ExportMenuProps {
  onExport: (format: ExportFormat) => void;
  loading?: boolean;
  disabled?: boolean;
  intent?: 'secondary' | 'ghost' | 'onDark' | 'onDarkGhost';
  label?: string;
  /** Formatos oferecidos (por omissão os três). */
  formats?: ExportFormat[];
}

export function ExportMenu({
  onExport,
  loading,
  disabled,
  intent = 'secondary',
  label = 'Exportar',
  formats,
}: ExportMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size="sm"
          intent={intent}
          loading={loading}
          disabled={disabled}
        >
          <Download size={14} strokeWidth={1.75} />
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {OPTIONS.filter((o) => !formats || formats.includes(o.format)).map(
          (o) => (
            <DropdownMenuItem
              key={o.format}
              onSelect={() => onExport(o.format)}
            >
              {o.label}
            </DropdownMenuItem>
          ),
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
