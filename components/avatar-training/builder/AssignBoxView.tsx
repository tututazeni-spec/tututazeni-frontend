// components/avatar-training/builder/AssignBoxView.tsx
// Atribuir a sessão a colaboradores (apresentação). Procura, seleção e pedido:
// hooks/useAssignSession.ts.

import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import type { AssignSessionController } from '@/hooks/useAssignSession';
import { Checkbox } from '@/components/ui/Checkbox';

interface AssignBoxViewProps {
  ctl: AssignSessionController;
  published: boolean;
}

export function AssignBoxView({ ctl, published }: AssignBoxViewProps) {
  const {
    query,
    setQuery,
    showResults,
    idQuery,
    isSearching,
    results,
    hasResults,
    picked,
    userIds,
    pick,
    unpick,
    dueDate,
    setDueDate,
    mandatory,
    setMandatory,
    assign,
    isAssigning,
  } = ctl;

  return (
    <div className="space-y-3 rounded-card border border-border bg-surface p-4">
      <h3 className="font-display text-sm font-semibold text-ink">
        Atribuir a colaboradores
      </h3>
      <FormField
        label="Colaboradores"
        htmlFor="as-ids"
        hint="Procura pelo nome, email, nº de colaborador ou ID. GESTOR/LIDER só podem atribuir à sua equipa."
      >
        <Input
          id="as-ids"
          placeholder="Escreve o nome do colaborador"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </FormField>
      {!published && (
        <p className="font-body text-xs text-warning-ink">
          Esta sessão ainda não está publicada — publica-a (e a formação) para a
          poderes atribuir.
        </p>
      )}
      {showResults && (
        <ul className="max-h-40 divide-y divide-border overflow-y-auto rounded-control border border-border bg-surface">
          {isSearching && (
            <li className="px-3 py-2 font-body text-xs text-ink-faint">
              A procurar…
            </li>
          )}
          {results.map((u) => (
            <li key={u.id}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left font-body text-sm text-ink hover:bg-surface-sunken"
                onClick={() => pick(u.id, u.fullName)}
              >
                {u.fullName}
                {u.email && (
                  <span className="ml-2 text-xs text-ink-faint">{u.email}</span>
                )}
              </button>
            </li>
          ))}
          {idQuery && !(idQuery in picked) && (
            <li>
              <button
                type="button"
                className="w-full px-3 py-2 text-left font-body text-sm text-ink hover:bg-surface-sunken"
                onClick={() => pick(idQuery, `ID ${idQuery}`)}
              >
                Adicionar colaborador com ID {idQuery}
              </button>
            </li>
          )}
          {!isSearching && !hasResults && !idQuery && (
            <li className="px-3 py-2 font-body text-xs text-ink-faint">
              Nenhum colaborador encontrado.
            </li>
          )}
        </ul>
      )}
      {userIds.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {userIds.map((id) => (
            <span
              key={id}
              className="inline-flex items-center gap-1 rounded-full bg-surface-sunken px-2.5 py-1 font-body text-xs text-ink"
            >
              {picked[id]}
              <button
                type="button"
                aria-label={`Remover ${picked[id]}`}
                onClick={() => unpick(id)}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex flex-wrap items-end gap-3">
        <FormField label="Prazo" htmlFor="as-due">
          <Input
            id="as-due"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </FormField>
        <label className="flex items-center gap-2 pb-2 font-body text-sm text-ink">
          <Checkbox
            checked={mandatory}
            onChange={(e) => setMandatory(e.target.checked)}
          />
          Obrigatória
        </label>
        <Button
          size="sm"
          loading={isAssigning}
          disabled={!published || userIds.length === 0}
          onClick={assign}
        >
          Atribuir ({userIds.length})
        </Button>
      </div>
    </div>
  );
}
