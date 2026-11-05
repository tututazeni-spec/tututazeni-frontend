// components/avatar-training/builder/NewSessionView.tsx
// Criar uma sessão numa formação (apresentação). Dados e pedido:
// hooks/useNewSession.ts.

import { ListFilter, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
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
    <div className="flex flex-wrap items-end gap-x-8 gap-y-4 rounded-card border border-border bg-surface p-4">
      <Select
        variant="underline"
        icon={ListFilter}
        value={programId}
        onValueChange={setProgramId}
        placeholder="Escolha a formação"
        items={programItems}
      />
      <Input
        variant="underline"
        aria-label="Título da nova sessão"
        placeholder="Título da nova sessão"
        className="min-w-[220px]"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
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
