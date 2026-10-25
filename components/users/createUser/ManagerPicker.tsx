// components/users/createUser/ManagerPicker.tsx
// Gestor directo: pesquisa no diretório interno (apresentação).

import { X } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { managerSubtitle } from './logic';
import type { DirectoryUser } from '../types';

interface ManagerPickerProps {
  selected: DirectoryUser | null;
  search: string;
  onSearch: (value: string) => void;
  results: DirectoryUser[];
  loading: boolean;
  onPick: (user: DirectoryUser) => void;
  onClear: () => void;
}

export function ManagerPicker({
  selected,
  search,
  onSearch,
  results,
  loading,
  onPick,
  onClear,
}: ManagerPickerProps) {
  return (
    <FormField label="Gestor direto" htmlFor="managerSearch">
      {selected ? (
        <div className="flex items-center gap-2 rounded-control border-[1.5px] border-border-strong bg-surface px-2 py-1.5">
          <Avatar
            name={selected.fullName}
            url={selected.avatarUrl ?? undefined}
            size="sm"
          />
          <div className="min-w-0 flex-1 truncate text-sm text-ink">
            {selected.fullName}
          </div>
          <button
            type="button"
            aria-label="Remover gestor"
            onClick={onClear}
            className="rounded-control p-1 text-ink-muted hover:bg-surface-sunken hover:text-ink"
          >
            <X size={16} strokeWidth={1.75} />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Input
            id="managerSearch"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full"
            placeholder="Pesquisar por nome ou email…"
            autoComplete="off"
          />
          {search.trim().length > 0 && (
            <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-card border border-border bg-surface shadow-elevated">
              {loading && (
                <div className="px-3 py-2 text-sm text-ink-muted">
                  A pesquisar…
                </div>
              )}
              {!loading && results.length === 0 && (
                <div className="px-3 py-2 text-sm text-ink-muted">
                  Nenhum colaborador encontrado
                </div>
              )}
              {results.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => onPick(u)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-primary-subtle"
                >
                  <Avatar
                    name={u.fullName}
                    url={u.avatarUrl ?? undefined}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <div className="truncate text-sm text-ink">
                      {u.fullName}
                    </div>
                    <div className="truncate text-xs text-ink-faint">
                      {managerSubtitle(u)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </FormField>
  );
}
