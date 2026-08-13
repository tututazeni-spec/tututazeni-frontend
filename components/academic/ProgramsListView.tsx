// components/academic/ProgramsListView.tsx

import Link from 'next/link';
import { AlertCircle, BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button, buttonVariants } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { CardGridSkeleton } from './shared';
import { LEVEL_INTENT } from './types';
import type { Program } from './types';

const LEVEL_ITEMS = [
  { value: 'ALL', label: 'Todos os níveis' },
  { value: 'BASIC', label: 'Básico' },
  { value: 'INTERMEDIATE', label: 'Intermédio' },
  { value: 'ADVANCED', label: 'Avançado' },
  { value: 'EXPERT', label: 'Especialista' },
];

interface ProgramsListViewProps {
  data: Program[];
  total: number;
  totalPages: number;
  page: number;
  setPage: (updater: (p: number) => number) => void;
  search: string;
  onSearchChange: (value: string) => void;
  levelFilter: string;
  onLevelFilterChange: (value: string) => void;
  loading: boolean;
  error: string;
  onRetry: () => void;
}

export function ProgramsListView({
  data,
  total,
  totalPages,
  page,
  setPage,
  search,
  onSearchChange,
  levelFilter,
  onLevelFilterChange,
  loading,
  error,
  onRetry,
}: ProgramsListViewProps) {
  if (loading) return <CardGridSkeleton />;

  if (error)
    return (
      <div className="p-6">
        <EmptyState
          icon={AlertCircle}
          title="Erro ao carregar programas"
          description={error}
          action={{ label: 'Tentar novamente', onClick: onRetry }}
        />
      </div>
    );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">
            Programas Académicos
          </h1>
          <p className="font-body text-ink-muted">{total} programas disponíveis</p>
        </div>
        <Link
          href="/academic/transcript"
          className={buttonVariants({ intent: 'secondary', size: 'sm' })}
        >
          A minha transcrição
        </Link>
      </div>

      <div className="flex gap-4 flex-wrap">
        <Input
          type="text"
          placeholder="Pesquisar por nome ou código..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1 min-w-[200px]"
        />
        <Select
          value={levelFilter || 'ALL'}
          onValueChange={(value) => onLevelFilterChange(value === 'ALL' ? '' : value)}
          items={LEVEL_ITEMS}
        />
      </div>

      {data.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Nenhum programa encontrado"
          description="Não há programas para os filtros seleccionados."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.map((p) => (
            <Link
              key={p.id}
              href={`/academic/programs/${p.id}`}
              className="flex flex-col rounded-card border border-border bg-surface p-5 shadow-resting transition-shadow duration-150 hover:shadow-hover"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-data text-xs text-accent">{p.code}</span>
                <Badge intent={LEVEL_INTENT[p.level] ?? 'neutral'}>{p.level}</Badge>
              </div>
              <h3 className="font-body font-semibold text-ink mb-2">{p.name}</h3>
              <p className="font-body text-sm text-ink-muted line-clamp-2 mb-3">
                {p.description || 'Sem descrição'}
              </p>
              <div className="mt-auto flex justify-between font-body text-xs text-ink-faint pt-3 border-t border-border">
                <span>{p.durationHours}h</span>
                <span>{p._count?.enrollments || 0} alunos</span>
                <span>{p._count?.classes || 0} turmas</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <span className="font-body text-ink-muted">
            Página {page} de {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              intent="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Anterior
            </Button>
            <Button
              intent="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
