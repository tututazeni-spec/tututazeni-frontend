// components/courses/CohortDepartmentPicker.tsx
// Escolhe um departamento e dispara `onAdd` — usado para adicionar todos os
// membros de um departamento a uma turma (criação e detalhe).

'use client';

import { useState } from 'react';
import { Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Combobox } from '@/components/ui/Combobox';
import { useDepartmentOptions } from '@/components/enrollments/enrollData';

export interface CohortDepartmentPickerProps {
  onAdd: (departmentId: number) => void | Promise<void>;
  loading?: boolean;
}

export function CohortDepartmentPicker({
  onAdd,
  loading,
}: CohortDepartmentPickerProps) {
  const [departmentId, setDepartmentId] = useState('');
  const { options } = useDepartmentOptions();

  async function handleAdd() {
    if (!departmentId) return;
    await onAdd(Number(departmentId));
    setDepartmentId('');
  }

  return (
    <div className="flex items-center gap-2">
      <Combobox
        items={options}
        value={departmentId || undefined}
        onValueChange={setDepartmentId}
        placeholder="Adicionar por departamento"
        searchPlaceholder="Escreva para filtrar departamentos…"
        emptyText="Nenhum departamento encontrado"
        className="flex-1"
      />
      <Button
        size="sm"
        intent="secondary"
        onClick={handleAdd}
        disabled={!departmentId}
        loading={loading}
      >
        <Users size={14} strokeWidth={1.75} className="mr-1" />
        Adicionar todos
      </Button>
    </div>
  );
}
