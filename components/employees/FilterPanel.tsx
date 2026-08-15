// components/employees/FilterPanel.tsx
// Painel de filtros (departamento/status/senioridade/modalidade/contrato).
// Extraído de app/(platform)/employees/page.tsx. Migrado para a fundação
// de design: painel flutuante bespoke passa a tokens (mantém-se posição
// absoluta — não é um Modal/Dialog); inputs/selects passam a
// FormField+Input/Select (sentinela 'ALL' para a opção "Todos", mesmo
// padrão de components/audit/LogsView.tsx — Radix Select não aceita
// Item value=""); botão fechar passa a IconButton; botão "Limpar
// filtros" passa a Button.

import { X } from 'lucide-react';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button, IconButton } from '@/components/ui/Button';
import type { FilterState } from '@/hooks/useEmployees';
import {
  CONTRACT_LABELS,
  SENIORITY_LABELS,
  WORKMODE_LABELS,
} from './constants';

export interface FilterPanelProps {
  filters: FilterState;
  onChange: (f: Partial<FilterState>) => void;
  onClose: () => void;
}

const STATUS_ITEMS = [
  { value: 'ALL', label: 'Todos' },
  { value: 'ACTIVE', label: 'Ativo' },
  { value: 'INACTIVE', label: 'Inativo' },
  { value: 'ON_LEAVE', label: 'Afastado' },
  { value: 'TERMINATED', label: 'Desligado' },
];

export function FilterPanel({ filters, onChange, onClose }: FilterPanelProps) {
  const seniorityItems = [
    { value: 'ALL', label: 'Todos' },
    ...Object.entries(SENIORITY_LABELS).map(([k, v]) => ({ value: k, label: v })),
  ];
  const workModeItems = [
    { value: 'ALL', label: 'Todos' },
    ...Object.entries(WORKMODE_LABELS).map(([k, v]) => ({ value: k, label: v })),
  ];
  const contractItems = [
    { value: 'ALL', label: 'Todos' },
    ...Object.entries(CONTRACT_LABELS).map(([k, v]) => ({ value: k, label: v })),
  ];

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-surface rounded-card border border-border shadow-elevated z-30 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-ink">Filtros</h3>
        <IconButton icon={X} label="Fechar" intent="ghost" size="sm" onClick={onClose} />
      </div>

      <div className="space-y-3">
        <FormField label="Departamento" htmlFor="filter-department">
          <Input
            id="filter-department"
            value={filters.department}
            onChange={(e) => onChange({ department: e.target.value })}
            placeholder="Ex: Tecnologia"
            className="w-full"
          />
        </FormField>

        <FormField label="Status" htmlFor="filter-status">
          <Select
            items={STATUS_ITEMS}
            value={filters.status || 'ALL'}
            onValueChange={(v) => onChange({ status: v === 'ALL' ? '' : v })}
            className="w-full"
          />
        </FormField>

        <FormField label="Senioridade" htmlFor="filter-seniority">
          <Select
            items={seniorityItems}
            value={filters.seniority || 'ALL'}
            onValueChange={(v) => onChange({ seniority: v === 'ALL' ? '' : v })}
            className="w-full"
          />
        </FormField>

        <FormField label="Modalidade" htmlFor="filter-workmode">
          <Select
            items={workModeItems}
            value={filters.workMode || 'ALL'}
            onValueChange={(v) => onChange({ workMode: v === 'ALL' ? '' : v })}
            className="w-full"
          />
        </FormField>

        <FormField label="Contrato" htmlFor="filter-contract">
          <Select
            items={contractItems}
            value={filters.contractType || 'ALL'}
            onValueChange={(v) => onChange({ contractType: v === 'ALL' ? '' : v })}
            className="w-full"
          />
        </FormField>

        <Button
          intent="secondary"
          className="w-full justify-center"
          onClick={() =>
            onChange({
              department: '',
              status: '',
              seniority: '',
              workMode: '',
              contractType: '',
            })
          }
        >
          Limpar filtros
        </Button>
      </div>
    </div>
  );
}
