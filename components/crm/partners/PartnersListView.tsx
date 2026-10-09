// components/crm/partners/PartnersListView.tsx

import Link from 'next/link';
import { CalendarClock, CircleCheck, FileBarChart, Flag, LayoutDashboard, Plus } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ListSkeleton, ErrorBanner } from '@/components/crm/shared';
import { STATUS_COLORS, TIER_COLORS, TYPE_LABELS } from './types';
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
          <h1 className="font-display text-2xl font-bold text-ink">
            Parceiros
          </h1>
          <p className="font-body text-ink-muted">
            {total} parceiros registados
          </p>
        </div>
               <Link
          href="/crm/partners/novo"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-body text-sm font-bold text-white shadow-lg transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <Plus className="h-4 w-4" />
          Novo Parceiro
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex gap-4 flex-wrap">
        <Input
          type="text"
          placeholder="Pesquisar por nome, código, NIF..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="min-w-[160px] flex-1"
        />
        <Select
          value={tierFilter}
          onValueChange={onTierFilterChange}
          items={[
            { value: '', label: 'Todos os níveis' },
            { value: 'PLATINUM', label: 'Platina' },
            { value: 'GOLD', label: 'Ouro' },
            { value: 'SILVER', label: 'Prata' },
            { value: 'STANDARD', label: 'Padrão' },
          ]}
        />
        <Select
          value={statusFilter}
          onValueChange={onStatusFilterChange}
          items={[
            { value: '', label: 'Todos os estados' },
            { value: 'ACTIVE', label: 'Activo' },
            { value: 'NEGOTIATION', label: 'Em negociação' },
            { value: 'SUSPENDED', label: 'Suspenso' },
            { value: 'INACTIVE', label: 'Inactivo' },
            { value: 'FORMER', label: 'Ex-parceiro' },
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
              href="/crm/partners/dashboard"
              active
              label="Dashboard"
              hint="Visão geral"
              icon={<LayoutDashboard className="h-4 w-4" />}
            />
            <NavCard
              href="/crm/partners/expiring-contracts"
              label="Contratos a expirar"
              hint="Renovações próximas"
              icon={<CalendarClock className="h-4 w-4" />}
            />
            <NavCard
              href="/crm/partners/overdue-milestones"
              label="Marcos em atraso"
              hint="Acção necessária"
              icon={<Flag className="h-4 w-4" />}
            />
            <NavCard
              href="/crm/partners/report"
              label="Relatório"
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
            <thead className="bg-[#0F1F3D] text-white uppercase">
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
                  Nível
                </th>
                <th className="px-4 py-3 text-left font-medium text-xs">
                  Estado
                </th>
                <th className="px-4 py-3 text-left font-medium text-xs">
                  Valor Anual
                </th>
                <th className="px-4 py-3 text-left font-medium text-xs">
                  Responsável
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
                    colSpan={8}
                    className="px-4 py-8 text-center text-ink-faint"
                  >
                    Nenhum parceiro encontrado
                  </td>
                </tr>
              ) : (
                data.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-surface-sunken transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-primary">
                      {p.code}
                    </td>
                    <td className="px-4 py-3 font-medium text-ink">{p.name}</td>
                    <td className="px-4 py-3 text-ink-muted">
                      {TYPE_LABELS[p.type] || p.type}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-pill px-2 py-1 font-body text-xs font-semibold',
                          TIER_COLORS[p.tier] ??
                            'bg-surface-sunken text-ink-muted',
                        )}
                      >
                        {p.tier}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-pill px-2 py-1 font-body text-xs font-semibold',
                          STATUS_COLORS[p.status] ??
                            'bg-surface-sunken text-ink-muted',
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