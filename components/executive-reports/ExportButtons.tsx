// components/executive-reports/ExportButtons.tsx
// Botões PDF / Excel / CSV de um relatório guardado.

'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/providers/ToastProvider';
import { downloadReport } from './exportDownload';
import type { ExportFormat } from './reportTypes';

const FORMATS: { value: ExportFormat; label: string }[] = [
  { value: 'PDF', label: 'PDF' },
  { value: 'XLSX', label: 'Excel' },
  { value: 'CSV', label: 'CSV' },
];

export function ExportButtons({ reportId }: { reportId: number }) {
  const notify = useToast();
  const [busy, setBusy] = useState<ExportFormat | null>(null);

  const run = async (format: ExportFormat) => {
    setBusy(format);
    try {
      await downloadReport(reportId, format);
    } catch (e) {
      notify({
        title: e instanceof Error ? e.message : 'Falha na exportação',
        intent: 'danger',
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex gap-2">
      {FORMATS.map((f) => (
        <Button
          key={f.value}
          intent="secondary"
          size="sm"
          loading={busy === f.value}
          disabled={busy !== null}
          onClick={() => run(f.value)}
        >
          <Download size={14} strokeWidth={1.75} />
          {f.label}
        </Button>
      ))}
    </div>
  );
}
