// components/crm/beneficiaries/BeneficiariesListView.tsx

import Link from 'next/link';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ListSkeleton } from '@/components/crm/shared';
import { STATUS_COLORS } from './types';
import type { Beneficiary } from './types';

interface BeneficiariesListViewProps {
  rows: Beneficiary[];
  total: number;
  totalPages: number;
  page: number;
  setPage: (updater: (p: number) => number) => void;
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  errorMessage: string;
  onRetry: () => void;
}

export function BeneficiariesListView({
  rows,
  total,
  totalPages,
  page,
  setPage,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  typeFilter,
  onTypeFilterChange,
  isLoading,
  isFetching,
  isError,
  errorMessage,
  onRetry,
}: BeneficiariesListViewProps) {
  // Loading inicial (sem dados em cache).
  if (isLoading) return <ListSkeleton />;

  if (isError)
    return (
      <div className="p-6">
        <div className="rounded-card border border-danger bg-danger-subtle p-4 flex justify-between">
          <span className="text-danger-ink">{errorMessage}</span>
          <button onClick={onRetry} className="underline text-danger-ink">
            Tentar novamente
          </button>
        </div>
      </div>
    );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Beneficiários</h1>
          <p className="font-body text-ink-muted">{total} beneficiários registados</p>
        </div>
        <Link href="/crm/beneficiaries/novo">
          <Button>+ Novo Beneficiário</Button>
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex gap-4 flex-wrap items-center">
        <Input
          type="text"
          placeholder="Pesquisar por nome, email, código..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1 min-w-[200px]"
        />
        <Select
          value={statusFilter}
          onValueChange={onStatusFilterChange}
          items={[
            { value: '', label: 'Todos os estados' },
            { value: 'ACTIVE', label: 'Activo' },
            { value: 'PROSPECT', label: 'Prospecto' },
            { value: 'INACTIVE', label: 'Inactivo' },
            { value: 'FORMER', label: 'Ex-beneficiário' },
          ]}
        />
        <Select
          value={typeFilter}
          onValueChange={onTypeFilterChange}
          items={[
            { value: '', label: 'Todos os tipos' },
            { value: 'INDIVIDUAL', label: 'Individual' },
            { value: 'FAMILY', label: 'Família' },
            { value: 'INSTITUTION', label: 'Instituição' },
            { value: 'COMMUNITY', label: 'Comunidade' },
            { value: 'GROUP', label: 'Grupo' },
          ]}
        />
        {/* Indicador discreto de refetch em fundo (paginação/filtros). */}
        {isFetching && (
          <span className="font-body text-xs text-ink-faint animate-pulse">
            A actualizar…
          </span>
        )}
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
                <th className="px-4 py-3 text-left font-medium text-xs">Província</th>
                <th className="px-4 py-3 text-left font-medium text-xs">Estado</th>
                <th className="px-4 py-3 text-left font-medium text-xs">Interacções</th>
                <th className="px-4 py-3 text-left font-medium text-xs">Responsável</th>
                <th className="px-4 py-3 text-left font-medium text-xs">Acções</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-ink-faint">
                    Nenhum beneficiário encontrado
                  </td>
                </tr>
              ) : (
                rows.map((b) => (
                  <tr key={b.id} className="hover:bg-surface-sunken transition-colors">
                    <td className="px-4 py-3 font-mono text-primary">
                      {b.code}
                    </td>
                    <td className="px-4 py-3 font-medium text-ink">{b.fullName}</td>
                    <td className="px-4 py-3 text-ink-muted">{b.type}</td>
                    <td className="px-4 py-3 text-ink-muted">
                      {b.province || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-pill px-2 py-1 font-body text-xs font-semibold',
                          STATUS_COLORS[b.status] ?? 'bg-surface-sunken text-ink-muted',
                        )}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink-muted">
                      {b._count.interactions}
                    </td>
                    <td className="px-4 py-3 text-ink-muted">
                      {b.assignedTo?.fullName || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/crm/beneficiaries/${b.id}`}
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
