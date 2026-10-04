// components/payroll/RunPicker.tsx
// Selector de processamento (PayrollRun) reutilizado pelas vistas
// Colaboradores, Pagamentos e Fecho Salarial.
'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Select } from '@/components/ui/Select';
import { RUN_STATUS_MAP, type Paginated, type PayrollRun } from './types';

export interface RunPickerProps {
  value: number | null;
  onChange: (runId: number | null) => void;
  className?: string;
}

export function RunPicker({ value, onChange, className }: RunPickerProps) {
  const params = { page: 1, limit: 50 };
  const { data, isLoading } = useApiQuery<Paginated<PayrollRun>>(
    queryKeys.payroll.runList(params),
    '/payroll/runs',
    { params, staleTime: STALE_TIME.DYNAMIC },
  );
  const items = (data?.data ?? []).map((r) => ({
    value: String(r.id),
    label: `${r.period}${r.payGroup ? ` · ${r.payGroup}` : ''} — ${
      RUN_STATUS_MAP[r.status]?.label ?? r.status
    }`,
  }));
  return (
    <Select
      items={items}
      value={value ? String(value) : undefined}
      onValueChange={(v) => onChange(Number(v))}
      placeholder={isLoading ? 'A carregar…' : 'Escolher processamento'}
      className={className ?? 'w-80'}
    />
  );
}
