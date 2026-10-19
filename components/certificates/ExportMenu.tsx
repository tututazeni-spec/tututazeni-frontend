// components/certificates/ExportMenu.tsx
// Exportação CSV / Excel / PDF com os filtros activos da lista. O backend aplica
// o âmbito do utilizador (gestor: só a equipa), limita o tamanho e audita.

'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { downloadAuditFile } from '@/components/audit/downloadAuditFile';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';

type Format = 'csv' | 'xlsx' | 'pdf';
type Param = string | number | undefined;

const OPTIONS: { format: Format; label: string }[] = [
  { format: 'csv', label: 'Exportar CSV' },
  { format: 'xlsx', label: 'Exportar Excel' },
  { format: 'pdf', label: 'Exportar PDF' },
];

export function ExportMenu({ params }: { params: Record<string, Param> }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function run(format: Format) {
    // Filtros vazios não vão no pedido; a paginação não se aplica à exportação.
    const filters = Object.fromEntries(
      Object.entries(params).filter(
        ([k, v]) =>
          v !== undefined && v !== '' && k !== 'page' && k !== 'limit',
      ),
    );
    setBusy(true);
    try {
      await downloadAuditFile(
        '/certificates/admin/export',
        { ...filters, format },
        `certificados.${format}`,
      );
    } catch (e) {
      toast({
        title: e instanceof Error ? e.message : 'Não foi possível exportar.',
        intent: 'danger',
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Exportar">
      {OPTIONS.map((o) => (
        <Button
          key={o.format}
          intent="secondary"
          size="sm"
          disabled={busy}
          onClick={() => void run(o.format)}
        >
          <Download size={14} strokeWidth={1.75} />
          {o.label}
        </Button>
      ))}
    </div>
  );
}
