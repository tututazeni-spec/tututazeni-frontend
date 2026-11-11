// components/departments/DepartmentExportMenu.tsx
// Botão «Exportar» (CSV e PDF) das abas do módulo Departamentos. Cada aba diz
// como construir a tabela (`build`); o botão trata do estado de carregamento,
// da descarga e do aviso de erro. As abas paginadas vão buscar todas as linhas
// dos filtros aplicados (não só a página visível) com `fetchAllRows`.

'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { exportTable, type TableExportInput } from '@/lib/tableExport';
import { useToast } from '@/providers/ToastProvider';
import { ExportMenu } from '@/components/ui/ExportMenu';

type ExportParams = Record<
  string,
  string | number | boolean | null | undefined
>;

/** Todas as linhas de um endpoint paginado, com os mesmos filtros da aba. */
export async function fetchAllRows<T>(
  path: string,
  params: ExportParams,
): Promise<T[]> {
  const res = await apiClient.get<{ data: T[] }>(path, {
    params: { ...params, page: 1, limit: 10000 },
  });
  return res.data ?? [];
}

interface DepartmentExportMenuProps {
  build: () => Promise<TableExportInput>;
  disabled?: boolean;
  className?: string;
}

export function DepartmentExportMenu({
  build,
  disabled,
  className,
}: DepartmentExportMenuProps) {
  const notify = useToast();
  const [loading, setLoading] = useState(false);

  const run = async (format: 'csv' | 'pdf') => {
    setLoading(true);
    try {
      const input = await build();
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
