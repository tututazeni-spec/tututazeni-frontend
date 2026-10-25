// components/avatar-training/builder/NewSessionView.tsx
// Criar uma sessão numa formação (apresentação). Dados e pedido:
// hooks/useNewSession.ts.

import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import type { NewSessionController } from '@/hooks/useNewSession';

export function NewSessionView({ ctl }: { ctl: NewSessionController }) {
  const {
    programId,
    setProgramId,
    title,
    setTitle,
    programItems,
    canCreate,
    create,
    isCreating,
  } = ctl;

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-card border border-border bg-surface p-4">
      <FormField label="Formação" htmlFor="ns-prog">
        <Select
          value={programId}
          onValueChange={setProgramId}
          placeholder="Escolha a formação"
          items={programItems}
        />
      </FormField>
      <FormField label="Título da nova sessão" htmlFor="ns-title">
        <Input
          id="ns-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </FormField>
      <Button
        size="sm"
        loading={isCreating}
        disabled={!canCreate}
        onClick={create}
      >
        <Plus size={14} /> Criar sessão
      </Button>
    </div>
  );
}
