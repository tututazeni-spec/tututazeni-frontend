// components/avatar-training/programs/ProgramsListView.tsx
// Catálogo/Gestão de formações: filtros e cartões (apresentação). Dados e
// acções do ciclo de vida: hooks/useProgramsList.ts.

import { GraduationCap, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { QueryError } from '@/components/ui/QueryError';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import type { ProgramsListController } from '@/hooks/useProgramsList';
import { CARD_BTN, CARD_BTN_GHOST, CardGrid, ProgramCard } from '../cards';
import { PROGRAM_STATUS } from '../constants';
import { ALL, programActions } from './logic';

interface ProgramsListViewProps {
  list: ProgramsListController;
  onCreate: () => void;
  onOpenSheet: (id: number) => void;
}

export function ProgramsListView({
  list,
  onCreate,
  onOpenSheet,
}: ProgramsListViewProps) {
  const {
    isAuthor,
    isAdmin,
    manage,
    mode,
    setMode,
    search,
    setSearch,
    category,
    setCategory,
    status,
    setStatus,
    programs: data,
    isLoading,
    error,
    refetch,
    runAction,
  } = list;

  if (error) return <QueryError error={error} onRetry={() => refetch()} />;
  if (isLoading || !data)
    return (
      <Skeleton
        rows={3}
        itemClassName="h-20 rounded-card bg-surface-sunken animate-pulse"
      />
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        {isAuthor && (
          <div role="group" aria-label="Vista" className="flex gap-2">
            {(
              [
                ['catalog', 'Catálogo'],
                ['manage', 'Gestão'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                aria-pressed={mode === id}
                onClick={() => setMode(id)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  mode === id
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-white text-ink-muted hover:text-ink'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
        <div className="min-w-[180px] flex-1">
          <FormField label="Pesquisar" htmlFor="ap-search">
            <Input
              id="ap-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </FormField>
        </div>
        <div className="min-w-[140px]">
          <FormField label="Categoria" htmlFor="ap-filter-cat">
            <Input
              id="ap-filter-cat"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </FormField>
        </div>
        {manage && (
          <div className="min-w-[140px]">
            <FormField label="Estado" htmlFor="ap-status">
              <Select
                value={status}
                onValueChange={setStatus}
                items={[
                  { value: ALL, label: 'Todos' },
                  ...Object.entries(PROGRAM_STATUS).map(([value, v]) => ({
                    value,
                    label: v.label,
                  })),
                ]}
              />
            </FormField>
          </div>
        )}
        {manage && (
          <Button size="sm" onClick={onCreate}>
            <Plus size={14} /> Nova formação
          </Button>
        )}
      </div>

      {data.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="Sem formações com avatar"
          description={
            manage
              ? 'Crie a primeira formação para a poder atribuir a colaboradores.'
              : 'Ainda não existem formações publicadas para o seu perfil.'
          }
        />
      ) : (
        <CardGrid>
          {data.map((p) => {
            const actions = programActions(p, manage, isAdmin);
            return (
              <ProgramCard
                key={p.id}
                program={p}
                onSelect={() => onOpenSheet(p.id)}
                footer={
                  <>
                    <button
                      type="button"
                      className={CARD_BTN_GHOST}
                      onClick={() => onOpenSheet(p.id)}
                    >
                      Ficha
                    </button>
                    {actions.canSubmitReview && (
                      <button
                        type="button"
                        className={CARD_BTN}
                        onClick={() => runAction(p.id, 'submit-review')}
                      >
                        Submeter a revisão
                      </button>
                    )}
                    {actions.canPublish && (
                      <button
                        type="button"
                        className={CARD_BTN}
                        onClick={() => runAction(p.id, 'publish')}
                      >
                        Publicar
                      </button>
                    )}
                    {actions.canArchive && (
                      <button
                        type="button"
                        className={CARD_BTN_GHOST}
                        onClick={() => runAction(p.id, 'archive')}
                      >
                        Arquivar
                      </button>
                    )}
                  </>
                }
              />
            );
          })}
        </CardGrid>
      )}
    </div>
  );
}
