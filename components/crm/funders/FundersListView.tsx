// components/crm/funders/FundersListView.tsx
// Vista pura da listagem de financiadores — recebe tudo via props do
// hook useFundersList, sem chamadas à API nem estado próprio.

import Link from 'next/link';
import { CircleCheck, FileBarChart, LayoutDashboard, Plus } from 'lucide-react';
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
          <h1 className="font-display text-2xl font-bold text-ink">
            Financiadores
          </h1>
          <p className="font-body text-ink-muted">
            {total} financiadores registados
          </p>
        </div>
               <Link
          href="/crm/funders/novo"
          className="inline-flex items-center gap-2 rounded-xl bg-[#0F1F3D] px-5 py-3 font-body text-sm font-bold text-white shadow-lg transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F1F3D]/40"
        >
          <Plus className="h-4 w-4" />
          Novo Financiador
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex gap-4 flex-wrap">
        <Input
          type="text"
          placeholder="Pesquisar por nome, código, email..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="min-w-[160px] flex-1"
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

      
      {/* Navegação — botões em glassmorphism */}
      <div className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div className="absolute -left-16 top-0 h-32 w-72 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -right-10 bottom-0 h-32 w-72 rounded-full bg-primary/15 blur-3xl" />
        </div>

        <div className="relative rounded-3xl border border-white/60 bg-white/50 p-3 shadow-[0_8px_32px_rgba(31,38,135,0.12)] backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <NavCard
              href="/crm/funders/dashboard"
              active
              label="Dashboard"
              hint="Visão geral"
              icon={<LayoutDashboard className="h-4 w-4" />}
            />
            <NavCard
              href="/crm/funders/report"
              label="Relatório por período"
              hint="Análise e exportação"
              icon={<FileBarChart className="h-4 w-4" />}
            />
          </div>
        </div>
      </div>

      {/* Tabela */}
      <Card>
        <div className="overflow-hidden">
          <table className="w-full font-body text-sm">
            <thead className="bg-[#0F1F3D]/60 text-white uppercase">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-xs">
                  Código
                </th>
                <th className="px-4 py-3 text-left font-medium text-xs">
                  Nome
                </th>
                <th className="px-4 py-3 text-left font-medium text-xs">
                  Tipo
                </th>
                <th className="px-4 py-3 text-left font-medium text-xs">
                  País
                </th>
                <th className="px-4 py-3 text-left font-medium text-xs">
                  Estado
                </th>
                <th className="px-4 py-3 text-right font-medium text-xs">
                  Comprometido
                </th>
                <th className="px-4 py-3 text-right font-medium text-xs">
                  Recebido
                </th>
                <th className="px-4 py-3 text-center font-medium text-xs">
                  Grants
                </th>
                <th className="px-4 py-3 text-left font-medium text-xs">
                  Acções
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-8 text-center text-ink-faint"
                  >
                    Nenhum financiador encontrado
                  </td>
                </tr>
              ) : (
                data.map((f) => (
                  <tr
                    key={f.id}
                    className="hover:bg-surface-sunken transition-colors"
                  >
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
                          STATUS_COLORS[f.status] ??
                            'bg-surface-sunken text-ink-muted',
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

function NavCard({
  href,
  label,
  hint,
  icon,
  active = false,
}: {
  href: string;
  label: string;
  hint: string;
  icon: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      data-state={active ? 'active' : 'inactive'}
      aria-current={active ? 'page' : undefined}
      className="group flex items-center gap-3 whitespace-nowrap rounded-full border border-white/70 bg-white/60 py-2 pl-2 pr-4 text-ink shadow-sm backdrop-blur transition-all
                 duration-200 hover:scale-105 hover:bg-white/80 hover:shadow-md data-[state=inactive]:hover:border-primary motion-reduce:hover:scale-100
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40
                 data-[state=active]:border-transparent data-[state=active]:bg-[#0F1F3D] data-[state=active]:text-white data-[state=active]:shadow-lg"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/70 text-ink/70 group-data-[state=active]:bg-white/20 group-data-[state=active]:text-white">
        {icon}
      </span>
      <span className="flex flex-col items-start leading-tight">
        <span className="text-sm font-semibold">{label}</span>
        <span className="text-xs opacity-70 group-data-[state=active]:opacity-85">
          {hint}
        </span>
      </span>
      <CircleCheck
        size={16}
        strokeWidth={2}
        className="hidden shrink-0 group-data-[state=active]:block"
      />
    </Link>
  );
}