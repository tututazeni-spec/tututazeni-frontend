// components/avatar-training/programs/ProgramsListView.tsx
// Catálogo/Gestão de formações: filtros e cartões (apresentação). Dados e
// acções do ciclo de vida: hooks/useProgramsList.ts.

import { GraduationCap, ListFilter, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { PeriodPills } from '@/components/ui/Pills';
import { SearchInput } from '@/components/ui/SearchInput';
import { QueryError } from '@/components/ui/QueryError';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import type { ProgramsListController } from '@/hooks/useProgramsList';
import { CardGrid, ProgramCard } from '../cards';
import { PROGRAM_STATUS } from '../constants';
import { ProgramsRecycleView } from './ProgramsRecycleView';
import { ALL, programActions } from './logic';

interface ProgramsListViewProps {
  list: ProgramsListController;
  onCreate: () => void;
  onOpenSheet: (id: number) => void;
}

function ModeSwitch({ list }: { list: ProgramsListController }) {
  return (
    <PeriodPills
      label="Vista"
      value={list.mode}
      onChange={list.setMode}
      options={[
        { value: 'manage', label: 'Gestão' },
        { value: 'catalog', label: 'Catálogo' },
        { value: 'recycle', label: 'Reciclagem' },
      ]}
    />
  );
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
    removeProgram,
  } = list;

  if (isAuthor && mode === 'recycle') {
    return (
      <div className="space-y-4">
        <ModeSwitch list={list} />
        <ProgramsRecycleView />
      </div>
    );
  }

  if (error) return <QueryError error={error} onRetry={() => refetch()} />;
  if (isLoading || !data)
    return (
      <Skeleton rows={3} itemClassName="h-20 rounded-card bg-surface-sunken" />
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        {isAuthor && <ModeSwitch list={list} />}
        <div className="min-w-[180px] flex-1">
          <SearchInput
            variant="underline"
            placeholder="Pesquisar formações…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="min-w-[140px]">
          <Input
            variant="underline"
            aria-label="Categoria"
            placeholder="Categoria"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </div>
        {manage && (
          <div className="min-w-[140px]">
            <FormField label="Estado" htmlFor="ap-status">
              <Select
                variant="underline"
                icon={ListFilter}
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
          <Button size="sm" onClick={onCreate} className="ml-auto">
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
                    <Button
                      type="button"
                      intent="onDarkGhost"
                      size="sm"
                      onClick={() => onOpenSheet(p.id)}
                    >
                      Ficha
                    </Button>
                    {actions.canSubmitReview && (
                      <Button
                        type="button"
                        intent="onDark"
                        size="sm"
                        onClick={() => runAction(p.id, 'submit-review')}
                      >
                        Submeter a revisão
                      </Button>
                    )}
                    {actions.canPublish && (
                      <Button
                        type="button"
                        intent="onDark"
                        size="sm"
                        onClick={() => runAction(p.id, 'publish')}
                      >
                        Publicar
                      </Button>
                    )}
                    {manage && p.status !== 'PUBLISHED' && (
                      <Button
                        type="button"
                        intent="onDarkGhost"
                        size="sm"
                        onClick={() => removeProgram(p)}
                      >
                        Eliminar
                      </Button>
                    )}
                    {actions.canArchive && (
                      <Button
                        type="button"
                        intent="onDarkGhost"
                        size="sm"
                        onClick={() => runAction(p.id, 'archive')}
                      >
                        Arquivar
                      </Button>
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
