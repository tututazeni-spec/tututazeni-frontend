// components/competencies/CompetencyExportMenu.tsx
// Botão «Exportar» (CSV e PDF) das abas do módulo Competências que mostram
// dados já carregados no ecrã (Visão geral, Matriz, Avaliações, Lacunas).
// Cada aba diz como construir a tabela (`build`) a partir do que está a ver,
// com os filtros aplicados; o botão trata da descarga e do aviso de vazio.
// O separador Relatórios tem exportação própria no backend.

'use client';

import { useState } from 'react';
import { exportTable, type TableExportInput } from '@/lib/tableExport';
import { useToast } from '@/providers/ToastProvider';
import { ExportMenu } from '@/components/ui/ExportMenu';

interface CompetencyExportMenuProps {
  build: () => TableExportInput;
  disabled?: boolean;
  className?: string;
}

export function CompetencyExportMenu({
  build,
  disabled,
  className,
}: CompetencyExportMenuProps) {
  const notify = useToast();
  const [loading, setLoading] = useState(false);

  const run = async (format: 'csv' | 'pdf') => {
    setLoading(true);
    try {
      const input = build();
      if (input.rows.length === 0) {
        notify({ title: 'Não há dados para exportar', intent: 'info' });
        return;
      }
      await exportTable(format, input);
    } catch (e) {
      notify({
        title: e instanceof Error ? e.message : 'Falha ao exportar',
        intent: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      <ExportMenu
        formats={['csv', 'pdf']}
        loading={loading}
        disabled={disabled}
        onExport={(f) => void run(f as 'csv' | 'pdf')}
      />
    </div>
  );
}
