// components/crm/funders/FundersListView.tsx
// Vista pura da listagem de financiadores — recebe tudo via props do
// hook useFundersList, sem chamadas à API nem estado próprio.

import Link from 'next/link';
import { cn } from '@/lib/cn';
import { formatKz } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ListSkeleton, ErrorBanner } from '@/components/crm/shared';
import { STATUS_COLORS, TYPE_LABELS } from './types';
import type { Funder } from './types';

interface FundersListViewProps {
  data: Funder[];
  total: number;
  totalPages: number;
  page: number;
  setPage: (updater: (p: number) => number) => void;
  search: string;
  onSearchChange: (value: string) => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  loading: boolean;
  error: string;
  onRetry: () => void;
}

export function FundersListView({
  data,
  total,
  totalPages,
  page,
  setPage,
  search,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  statusFilter,
  onStatusFilterChange,
  loading,
  error,
  onRetry,
}: FundersListViewProps) {
  if (loading) return <ListSkeleton />;
  if (error) return <ErrorBanner message={error} onRetry={onRetry} />;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Financiadores</h1>
          <p className="font-body text-ink-muted">{total} financiadores registados</p>
        </div>
        <div className="flex gap-2">
          <Link href="/crm/funders/overdue-reports">
            <Button intent="secondary">Relatórios em atraso</Button>
          </Link>
          <Link href="/crm/funders/novo">
            <Button>+ Novo Financiador</Button>
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-4 flex-wrap">
        <Input
          type="text"
          placeholder="Pesquisar por nome, código, email..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1 min-w-[200px]"
        />
        <Select
          value={typeFilter}
          onValueChange={onTypeFilterChange}
          items={[
            { value: '', label: 'Todos os tipos' },
            ...Object.entries(TYPE_LABELS).map(([v, l]) => ({
              value: v,
              label: l,
            })),
          ]}
        />
        <Select
          value={statusFilter}
          onValueChange={onStatusFilterChange}
          items={[
            { value: '', label: 'Todos os estados' },
            { value: 'ACTIVE', label: 'Activo' },
            { value: 'PROSPECT', label: 'Prospecto' },
            { value: 'SUSPENDED', label: 'Suspenso' },
            { value: 'INACTIVE', label: 'Inactivo' },
            { value: 'FORMER', label: 'Antigo' },
          ]}
        />
      </div>

      {/* Tabela */}
      <Card>
        <div className="overflow-hidden">
          <table className="w-full font-body text-sm">
            <thead className="bg-surface-sunken text-ink-muted uppercase">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-xs">Código</th>
                <th className="px-4 py-3 text-left font-medium text-xs">Nome</th>
                <th className="px-4 py-3 text-left font-medium text-xs">Tipo</th>
                <th className="px-4 py-3 text-left font-medium text-xs">País</th>
                <th className="px-4 py-3 text-left font-medium text-xs">Estado</th>
                <th className="px-4 py-3 text-right font-medium text-xs">Comprometido</th>
                <th className="px-4 py-3 text-right font-medium text-xs">Recebido</th>
                <th className="px-4 py-3 text-center font-medium text-xs">Grants</th>
                <th className="px-4 py-3 text-left font-medium text-xs">Acções</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-ink-faint">
                    Nenhum financiador encontrado
                  </td>
                </tr>
              ) : (
                data.map((f) => (
                  <tr key={f.id} className="hover:bg-surface-sunken transition-colors">
                    <td className="px-4 py-3 font-mono text-primary">
                      {f.code}
                    </td>
                    <td className="px-4 py-3 font-medium text-ink">{f.name}</td>
                    <td className="px-4 py-3 text-ink-muted">
                      {TYPE_LABELS[f.type] || f.type}
                    </td>
                    <td className="px-4 py-3 text-ink-muted">
                      {f.country || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-pill px-2 py-1 font-body text-xs font-semibold',
                          STATUS_COLORS[f.status] ?? 'bg-surface-sunken text-ink-muted',
                        )}
                      >
                        {f.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-ink-muted">
                      {f.totalCommitted > 0 ? formatKz(f.totalCommitted) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-success-ink">
                      {f.totalReceived > 0 ? formatKz(f.totalReceived) : '—'}
                    </td>
                    <td className="px-4 py-3 text-center text-ink-muted">
                      {f._count?.grants || 0}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/crm/funders/${f.id}`}
                        className="text-primary hover:underline font-body text-sm"
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <span className="font-body text-ink-muted">
            Página {page} de {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              intent="secondary"
            >
              Anterior
            </Button>
            <Button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              intent="secondary"
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
