// components/competencies/UserFilterSearch.tsx
// Filtro "Colaborador" (docs/módulo_competencies.md §5/§6) — pesquisa no
// diretório interno com debounce, mesmo padrão de
// components/onboarding/AssignPlanModal.tsx, mas compacto para caber numa
// barra de filtros em vez de um formulário de modal.

'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Input } from '@/components/ui/Input';
import { useDirectoryUsers, type DirectoryUser } from './modelFormData';

interface UserFilterSearchProps {
  selected: DirectoryUser | null;
  onChange: (user: DirectoryUser | null) => void;
  className?: string;
}

export function UserFilterSearch({ selected, onChange, className }: UserFilterSearchProps) {
  const [search, setSearch] = useState('');
  const { users, loading } = useDirectoryUsers(search, search.trim().length > 0);

  if (selected) {
    return (
      <div
        className={`flex items-center gap-2 rounded-control border-[1.5px] border-border-strong bg-surface px-2.5 py-1.5 ${className ?? ''}`}
      >
        <Avatar name={selected.fullName} url={selected.avatarUrl ?? undefined} size="sm" />
        <span className="truncate font-body text-sm text-ink">{selected.fullName}</span>
        <button
          type="button"
          aria-label="Remover filtro de colaborador"
          onClick={() => onChange(null)}
          className="ml-auto rounded p-0.5 text-ink-muted hover:bg-surface-sunken hover:text-ink"
        >
          <X size={14} strokeWidth={1.75} />
        </button>
      </div>
    );
  }

  return (
    <div className={`relative ${className ?? ''}`}>
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Colaborador (nome ou email)…"
        autoComplete="off"
      />
      {search.trim().length > 0 && (
        <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-card border border-border bg-surface shadow-elevated">
          {loading && (
            <div className="px-3 py-2 font-body text-sm text-ink-muted">A pesquisar…</div>
          )}
          {!loading && users.length === 0 && (
            <div className="px-3 py-2 font-body text-sm text-ink-muted">
              Nenhum colaborador encontrado
            </div>
          )}
          {users.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => {
                onChange(u);
                setSearch('');
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-primary-subtle"
            >
              <Avatar name={u.fullName} url={u.avatarUrl ?? undefined} size="sm" />
              <div className="min-w-0">
                <div className="truncate font-body text-sm text-ink">{u.fullName}</div>
                <div className="truncate font-body text-xs text-ink-faint">
                  {u.department?.name ?? u.email ?? '—'}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
