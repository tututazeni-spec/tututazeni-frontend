// components/employees/FilterPanel.tsx
// Painel de filtros (departamento/status/senioridade/modalidade/contrato).
// Extraído de app/(platform)/employees/page.tsx.

import { X } from 'lucide-react';
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

export function FilterPanel({ filters, onChange, onClose }: FilterPanelProps) {
  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl border border-gray-100 shadow-xl z-30 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Filtros</h3>
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="p-1 rounded-lg hover:bg-gray-100 text-gray-500"
        >
          <X size={16} />
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Departamento
          </label>
          <input
            value={filters.department}
            onChange={(e) => onChange({ department: e.target.value })}
            placeholder="Ex: Tecnologia"
            className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => onChange({ status: e.target.value })}
            className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Todos</option>
            <option value="ACTIVE">Ativo</option>
            <option value="INACTIVE">Inativo</option>
            <option value="ON_LEAVE">Afastado</option>
            <option value="TERMINATED">Desligado</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Senioridade
          </label>
          <select
            value={filters.seniority}
            onChange={(e) => onChange({ seniority: e.target.value })}
            className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Todos</option>
            {Object.entries(SENIORITY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Modalidade
          </label>
          <select
            value={filters.workMode}
            onChange={(e) => onChange({ workMode: e.target.value })}
            className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Todos</option>
            {Object.entries(WORKMODE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Contrato
          </label>
          <select
            value={filters.contractType}
            onChange={(e) => onChange({ contractType: e.target.value })}
            className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Todos</option>
            {Object.entries(CONTRACT_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() =>
            onChange({
              department: '',
              status: '',
              seniority: '',
              workMode: '',
              contractType: '',
            })
          }
          className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
        >
          Limpar filtros
        </button>
      </div>
    </div>
  );
}
