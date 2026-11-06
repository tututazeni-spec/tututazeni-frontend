// components/ui/PdfFromCsvButton.tsx
// «Exportar PDF» para as exportações que só tinham CSV: pede o mesmo
// endpoint CSV (mesmos filtros e permissões) e converte-o em PDF no browser.

'use client';

import { useState } from 'react';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { downloadCsvAsPdf } from '@/lib/download';
import { reportError } from '@/lib/errorReporting';
import { useToast } from '@/providers/ToastProvider';

export interface PdfFromCsvButtonProps {
  /** Endpoint CSV relativo a /api, já com a query string (ex.: `/events/reports/export?year=2026`). */
  path: string;
  /** Título impresso no PDF e base do nome do ficheiro. */
  title: string;
  label?: string;
  intent?: 'ghost' | 'secondary';
}

export function PdfFromCsvButton({
  path,
  title,
  label = 'Exportar PDF',
  intent = 'ghost',
}: PdfFromCsvButtonProps) {
  const notify = useToast();
  const [busy, setBusy] = useState(false);

  const onClick = async () => {
    setBusy(true);
    try {
      await downloadCsvAsPdf(path, {
        title,
        filename: title
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-zA-Z0-9]+/g, '-')
          .toLowerCase(),
      });
    } catch (e) {
      reportError(e, { source: 'PdfFromCsvButton' });
      notify({
        title: e instanceof Error ? e.message : 'Não foi possível exportar',
        intent: 'danger',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      type="button"
      intent={intent}
      size="sm"
      loading={busy}
      onClick={onClick}
    >
      <FileText size={14} strokeWidth={1.75} />
      {label}
    </Button>
  );
}
