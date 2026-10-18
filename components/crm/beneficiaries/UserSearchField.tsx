// components/crm/beneficiaries/UserSearchField.tsx
// Campo de utilizador: aceita o ID escrito directamente ou o nome — ao
// escrever, sugere os nomes do diretório interno (GET /users/directory).
// O valor do formulário é sempre o ID (string).

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { useDirectoryUsers } from '@/components/competencies/modelFormData';

interface UserSearchFieldProps {
  value: string;
  onChange: (value: string) => void;
}

export function UserSearchField({ value, onChange }: UserSearchFieldProps) {
  // `text` é o que o utilizador vê; `value` (ID) só muda ao escolher uma
  // sugestão ou ao escrever um número.
  const [text, setText] = useState(value);
  const [open, setOpen] = useState(false);
  const isId = /^\d+$/.test(text.trim());
  const term = text.trim();
  const { users, loading } = useDirectoryUsers(
    term,
    open && term.length >= 2 && !isId,
  );

  return (
    <div className="relative">
      <Input
        value={text}
        placeholder="Escreva o nome ou o ID"
        autoComplete="off"
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onChange={(e) => {
          const next = e.target.value;
          setText(next);
          setOpen(true);
          onChange(/^\d+$/.test(next.trim()) ? next.trim() : '');
        }}
      />
      {open && term.length >= 2 && !isId && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 z-[700] mt-1 max-h-60 overflow-auto rounded-card border border-field bg-surface p-1 shadow-elevated"
        >
          {users.length === 0 && (
            <li className="px-3 py-2 font-body text-sm text-ink-muted">
              {loading ? 'A pesquisar…' : 'Sem resultados'}
            </li>
          )}
          {users.map((u) => (
            <li key={u.id}>
              <button
                type="button"
                role="option"
                aria-selected={String(u.id) === value}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setText(u.fullName);
                  onChange(String(u.id));
                  setOpen(false);
                }}
                className="flex w-full flex-col rounded-control px-3 py-2 text-left font-body hover:bg-field-soft"
              >
                <span className="text-sm text-field-ink">{u.fullName}</span>
                <span className="text-xs text-ink-muted">
                  ID {u.id}
                  {u.position?.name ? ` · ${u.position.name}` : ''}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
