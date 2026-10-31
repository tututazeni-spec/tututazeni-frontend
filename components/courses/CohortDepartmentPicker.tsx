// components/courses/CohortDepartmentPicker.tsx
// Escolhe um ou mais departamentos (ficam como chips) e dispara `onAdd` com
// todos os ids de uma vez — usado para adicionar todos os membros desses
// departamentos a uma turma (criação e detalhe).

'use client';

import { useState } from 'react';
import { Users, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Combobox } from '@/components/ui/Combobox';
import { useDepartmentOptions } from '@/components/enrollments/enrollData';

export interface CohortDepartmentPickerProps {
  onAdd: (departmentIds: number[]) => void | Promise<void>;
  loading?: boolean;
}

export function CohortDepartmentPicker({
  onAdd,
  loading,
}: CohortDepartmentPickerProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const { options } = useDepartmentOptions();

  const available = options.filter((o) => !selected.includes(String(o.value)));
  const labelOf = (id: string) =>
    options.find((o) => String(o.value) === id)?.label ?? `Departamento ${id}`;

  async function handleAdd() {
    if (selected.length === 0) return;
    await onAdd(selected.map(Number));
    setSelected([]);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Combobox
          items={available}
          value={undefined}
          onValueChange={(id) =>
            id && setSelected((cur) => (cur.includes(id) ? cur : [...cur, id]))
          }
          placeholder={
            selected.length === 0
              ? 'Adicionar por departamento'
              : 'Adicionar outro departamento'
          }
          searchPlaceholder="Escreva para filtrar departamentos…"
          emptyText="Nenhum departamento encontrado"
          className="flex-1"
        />
        <Button
          size="sm"
          intent="secondary"
          onClick={handleAdd}
          disabled={selected.length === 0}
          loading={loading}
        >
          <Users size={14} strokeWidth={1.75} className="mr-1" />
          {selected.length > 1
            ? `Adicionar ${selected.length} departamentos`
            : 'Adicionar todos'}
        </Button>
      </div>
      {selected.length > 0 && (
        <ul
          aria-label="Departamentos escolhidos"
          className="flex flex-wrap gap-2"
        >
          {selected.map((id) => (
            <li
              key={id}
              className="inline-flex items-center gap-1.5 rounded-pill border border-border-strong bg-surface-sunken py-1 pl-3 pr-1.5 text-xs font-medium text-ink"
            >
              {labelOf(id)}
              <button
                type="button"
                aria-label={`Remover ${labelOf(id)}`}
                onClick={() =>
                  setSelected((cur) => cur.filter((x) => x !== id))
                }
                className="rounded-full p-0.5 text-ink-muted hover:bg-border hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <X size={12} strokeWidth={2} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
