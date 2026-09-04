// components/library/LibraryListView.tsx

import Link from 'next/link';
import { Plus, Eye, Download, Star, Package } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { GridSkeleton } from './shared';
import { TYPE_ICONS, TYPE_LABELS } from './types';
import type { Item } from './types';

interface LibraryListViewProps {
  data: Item[];
  total: number;
  totalPages: number;
  page: number;
  setPage: (updater: (p: number) => number) => void;
  search: string;
  onSearchChange: (value: string) => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  loading: boolean;
  error: string;
  onRetry: () => void;
}

const TYPE_FILTER_ITEMS = [
  { value: 'ALL', label: 'Todos os tipos' },
  ...(
    ['PDF', 'EBOOK', 'VIDEO', 'AUDIO', 'PRESENTATION', 'DOCUMENT'] as const
  ).map((v) => ({
    value: v,
    label: TYPE_LABELS[v],
  })),
];

export function LibraryListView({
  data,
  total,
  totalPages,
  page,
  setPage,
  search,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  loading,
  error,
  onRetry,
}: LibraryListViewProps) {
  if (loading) return <GridSkeleton />;

  if (error)
    return (
      <div className="p-6">
        <div className="flex items-center justify-between rounded-card border border-danger bg-danger-subtle p-4">
          <span className="font-body text-sm text-danger-ink">{error}</span>
          <Button intent="secondary" size="sm" onClick={onRetry}>
            Tentar novamente
          </Button>
        </div>
      </div>
    );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">
            Biblioteca Digital
          </h1>
          <p className="font-body text-ink-muted">
            {total} recursos disponíveis
          </p>
        </div>
        <Link
          href="/library/novo"
          className={buttonVariants({ intent: 'primary', size: 'md' })}
        >
          <Plus size={16} strokeWidth={1.75} />
          Adicionar Recurso
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-4">
        <Input
          type="text"
          placeholder="Pesquisar por título, autor, palavra-chave..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="min-w-[200px] flex-1"
        />
        <Select
          items={TYPE_FILTER_ITEMS}
          value={typeFilter || 'ALL'}
          onValueChange={(v) => onTypeFilterChange(v === 'ALL' ? '' : v)}
          className="w-56"
        />
      </div>

      {/* Grelha de cards */}
      {data.length === 0 ? (
        <EmptyState
          title="Nenhum recurso encontrado"
          description="Não há recursos para a pesquisa ou filtro seleccionados."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {data.map((item) => (
            <Link
              key={item.id}
              href={`/library/${item.id}`}
              className="block h-full"
            >
              <Card className="h-full hover:shadow-hover">
                <CardBody className="flex h-full flex-col">
                  {(() => {
                    const TypeIcon = TYPE_ICONS[item.type] || Package;
                    return (
                      <TypeIcon
                        size={32}
                        strokeWidth={1.5}
                        className="mb-3 text-ink-muted"
                      />
                    );
                  })()}
                  <h3 className="mb-1 line-clamp-2 font-display font-semibold text-ink">
                    {item.title}
                  </h3>
                  {item.author && (
                    <p className="mb-2 font-body text-sm text-ink-muted">
                      {item.author}
                    </p>
                  )}
                  <div className="mt-auto flex items-center justify-between pt-3 font-body text-xs text-ink-faint">
                    <span className="inline-flex items-center gap-1">
                      <Eye size={12} strokeWidth={1.75} /> {item.views}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Download size={12} strokeWidth={1.75} /> {item.downloads}
                    </span>
                    {item.rating > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Star size={12} strokeWidth={1.75} />{' '}
                        {item.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
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
