// components/departments/DepartmentUserPicker.tsx
// Picker de colaborador por pesquisa no diretório interno, usado no
// CreateDepartmentModal para "Responsável pelo departamento" e "Gestor
// directo". Mesmo padrão de components/development-plans/PlanFormSteps.tsx
// (UserPicker local) — dropdown num Popover.Portal para escapar ao
// `overflow-y-auto` do ModalContent.

'use client';

import { useState } from 'react';
import { Popover } from 'radix-ui';
import { X } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { useDirectoryUsers, type DirectoryUser } from './departmentFormData';

export function DepartmentUserPicker({
  label,
  htmlFor,
  value,
  onChange,
  excludeId,
}: {
  label: string;
  htmlFor: string;
  value: DirectoryUser | null;
  onChange: (u: DirectoryUser | null) => void;
  /** Não mostrar este utilizador nos resultados. */
  excludeId?: number;
}) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const { users, loading } = useDirectoryUsers(search, open && !value && search.trim().length > 0);
  const results = users.filter((u) => u.id !== excludeId);

  const select = (u: DirectoryUser) => {
    onChange(u);
    setSearch('');
    setOpen(false);
  };

  return (
    <FormField label={label} htmlFor={htmlFor}>
      {value ? (
        <div className="flex items-center gap-2 rounded-control border-[1.5px] border-border-strong bg-surface px-2 py-1.5">
          <Avatar name={value.fullName} url={value.avatarUrl ?? undefined} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm text-ink">{value.fullName}</div>
            {(value.position?.name || value.department?.name) && (
              <div className="truncate text-xs text-ink-faint">
                {[value.position?.name, value.department?.name].filter(Boolean).join(' · ')}
              </div>
            )}
          </div>
          <button
            type="button"
            aria-label={`Remover ${label.toLowerCase()}`}
            onClick={() => onChange(null)}
            className="rounded-control p-1 text-ink-muted hover:bg-surface-sunken hover:text-ink"
          >
            <X size={16} strokeWidth={1.75} />
          </button>
        </div>
      ) : (
        <Popover.Root open={open} onOpenChange={setOpen}>
          <Popover.Anchor asChild>
            <Input
              id={htmlFor}
              value={search}
              onChange={(e) => {
                const v = e.target.value;
                setSearch(v);
                setOpen(v.trim().length > 0);
              }}
              onFocus={() => search.trim().length > 0 && setOpen(true)}
              className="w-full"
              placeholder="Pesquisar por nome ou email…"
              autoComplete="off"
            />
          </Popover.Anchor>
          <Popover.Portal>
            <Popover.Content
              align="start"
              sideOffset={4}
              onOpenAutoFocus={(e) => e.preventDefault()}
              onCloseAutoFocus={(e) => e.preventDefault()}
              className="z-[60] max-h-56 w-[--radix-popover-trigger-width] overflow-y-auto rounded-card border border-border bg-surface shadow-elevated"
            >
              {loading && <div className="px-3 py-2 text-sm text-ink-muted">A pesquisar…</div>}
              {!loading && results.length === 0 && (
                <div className="px-3 py-2 text-sm text-ink-muted">Nenhum colaborador encontrado</div>
              )}
              {results.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => select(u)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-primary-subtle"
                >
                  <Avatar name={u.fullName} url={u.avatarUrl ?? undefined} size="sm" />
                  <div className="min-w-0">
                    <div className="truncate text-sm text-ink">{u.fullName}</div>
                    <div className="truncate text-xs text-ink-faint">
                      {u.department?.name ?? u.email ?? '—'}
                    </div>
                  </div>
                </button>
              ))}
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      )}
    </FormField>
  );
}
