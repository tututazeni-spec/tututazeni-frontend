// components/audit/audits/detailParts.tsx
// Botões partilhados pelas secções do detalhe de uma auditoria (apresentação).

import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface AddButtonProps {
  label: string;
  onClick: () => void;
}

/** «+ Adicionar …» no cabeçalho de uma secção. */
export function AddButton({ label, onClick }: AddButtonProps) {
  return (
    <Button size="sm" intent="secondary" onClick={onClick}>
      <Plus size={12} /> {label}
    </Button>
  );
}

interface SubmitRowProps {
  onClick: () => void;
  onCancel: () => void;
  pending: boolean;
  disabled?: boolean;
  label?: string;
}

/** Guardar / Cancelar no fim de um formulário inline. */
export function SubmitRow({
  onClick,
  onCancel,
  pending,
  disabled,
  label = 'Guardar',
}: SubmitRowProps) {
  return (
    <div className="flex gap-2 pt-1">
      <Button size="sm" loading={pending} disabled={disabled} onClick={onClick}>
        {label}
      </Button>
      <Button size="sm" intent="ghost" onClick={onCancel}>
        Cancelar
      </Button>
    </div>
  );
}
