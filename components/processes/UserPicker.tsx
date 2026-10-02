// components/processes/UserPicker.tsx
// Selector pesquisável de utilizadores (responsável, revisor, colaborador-alvo).
// Usa GET /users (primeiras 200 linhas, como o resto dos pickers do projecto).

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { STALE_TIME } from '@/lib/queryClient';
import { Combobox } from '@/components/ui/Combobox';

interface UserOption {
  id: number;
  fullName: string;
}

export interface UserPickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function UserPicker({
  value,
  onChange,
  placeholder = 'Seleccionar utilizador',
  className,
}: UserPickerProps) {
  const { data } = useApiQuery<{ data: UserOption[] }>(
    ['processes', 'user-picker'],
    '/users',
    { params: { limit: 200 }, staleTime: STALE_TIME.SEMI_STATIC },
  );
  const items = (data?.data ?? []).map((u) => ({
    value: String(u.id),
    label: u.fullName,
  }));

  return (
    <Combobox
      items={items}
      value={value}
      onValueChange={onChange}
      placeholder={placeholder}
      searchPlaceholder="Pesquisar…"
      emptyText="Sem resultados"
      className={className}
    />
  );
}
