// components/certificates/VariableChips.tsx
// Botões que inserem variáveis ({{nome_completo}}, …) nos textos do modelo. Só a
// lista fechada que o backend aceita; campos opcionais desaparecem sem valor.

'use client';

import { VARIABLES } from './templateLabels';

export function VariableChips({
  onInsert,
}: {
  onInsert: (token: string) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-ink-muted">
        Clique para inserir um campo no texto. Os campos opcionais desaparecem
        do certificado quando não houver valor (por exemplo, sem nota ou sem
        validade).
      </p>
      <div className="flex flex-wrap gap-2">
        {VARIABLES.map((v) => (
          <button
            key={v.name}
            type="button"
            title={`{{${v.name}}}`}
            onClick={() => onInsert(`{{${v.name}}}`)}
            className="rounded-pill border border-border-strong bg-surface px-3 py-1 text-xs font-semibold text-ink hover:bg-surface-sunken"
          >
            {v.optional ? `${v.label} (opcional)` : v.label}
          </button>
        ))}
      </div>
    </div>
  );
}
