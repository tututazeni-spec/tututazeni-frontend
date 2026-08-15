// components/crm/partners/PartnersListView.tsx

import Link from 'next/link';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ListSkeleton, ErrorBanner } from '@/components/crm/shared';
import { STATUS_COLORS, TIER_COLORS } from './types';
import type { Partner } from './types';

interface PartnersListViewProps {
  data: Partner[];
  total: number;
  totalPages: number;
  page: number;
  setPage: (updater: (p: number) => number) => void;
  search: string;
  onSearchChange: (value: string) => void;
  tierFilter: string;
  onTierFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  loading: boolean;
  error: string;
  onRetry: () => void;
}

export function PartnersListView({
  data,
  total,
  totalPages,
  page,
  setPage,
  search,
  onSearchChange,
  tierFilter,
  onTierFilterChange,
  statusFilter,
  onStatusFilterChange,
  loading,
  error,
  onRetry,
}: PartnersListViewProps) {
  if (loading) return <ListSkeleton />;
  if (error) return <ErrorBanner message={error} onRetry={onRetry} />;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Parceiros</h1>
          <p className="font-body text-ink-muted">{total} parceiros registados</p>
        </div>
        <Link href="/crm/partners/novo">
          <Button>+ Novo Parceiro</Button>
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex gap-4 flex-wrap">
        <Input
          type="text"
          placeholder="Pesquisar por nome, código, NIF..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1 min-w-[200px]"
        />
        <Select
          value={tierFilter}
          onChange={(e) => onTierFilterChange(e.target.value)}
        >
          <option value="">Todos os níveis</option>
          <option value="PLATINUM">Platinum</option>
          <option value="GOLD">Gold</option>
          <option value="SILVER">Silver</option>
          <option value="STANDARD">Standard</option>
        </Select>
        <Select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
        >
          <option value="">Todos os estados</option>
          <option value="ACTIVE">Activo</option>
          <option value="NEGOTIATION">Em negociação</option>
          <option value="SUSPENDED">Suspenso</option>
          <option value="INACTIVE">Inactivo</option>
          <option value="FORMER">Ex-parceiro</option>
        </Select>
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
                <th className="px-4 py-3 text-left font-medium text-xs">Nível</th>
                <th className="px-4 py-3 text-left font-medium text-xs">Estado</th>
                <th className="px-4 py-3 text-left font-medium text-xs">Valor Anual</th>
                <th className="px-4 py-3 text-left font-medium text-xs">Responsável</th>
                <th className="px-4 py-3 text-left font-medium text-xs">Acções</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-ink-faint">
                    Nenhum parceiro encontrado
                  </td>
                </tr>
              ) : (
                data.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-sunken transition-colors">
                    <td className="px-4 py-3 font-mono text-primary">
                      {p.code}
                    </td>
                    <td className="px-4 py-3 font-medium text-ink">{p.name}</td>
                    <td className="px-4 py-3 text-ink-muted">{p.type}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-pill px-2 py-1 font-body text-xs font-semibold',
                          TIER_COLORS[p.tier] ?? 'bg-surface-sunken text-ink-muted',
                        )}
                      >
                        {p.tier}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-pill px-2 py-1 font-body text-xs font-semibold',
                          STATUS_COLORS[p.status] ?? 'bg-surface-sunken text-ink-muted',
                        )}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink-muted">
                      {p.annualValue
                        ? `AOA ${p.annualValue.toLocaleString('pt-AO')}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-ink-muted">
                      {p.assignedTo?.fullName || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/crm/partners/${p.id}`}
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
              variant="secondary"
            >
              Anterior
            </Button>
            <Button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              variant="secondary"
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
