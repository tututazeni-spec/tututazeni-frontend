'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  CheckCircle,
  Clock,
  FileText,
  Plus,
  QrCode,
  RefreshCw,
  Search,
  Shield,
  Stamp,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { CreateModal } from '@/components/work-declaration/CreateModal';
import { DeclarationRow } from '@/components/work-declaration/DeclarationRow';
import { MOCK_DECLARATIONS, MOCK_STATS } from '@/components/work-declaration/mockData';
import { StatCard } from '@/components/work-declaration/StatCard';
import type {
  Declaration,
  DeclarationStatus,
  Stats,
} from '@/components/work-declaration/types';
import { Button, IconButton } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import type { KpiCardProps } from '@/components/ui/KpiCard';
import { TableBody, TableHead, TableHeaderCell } from '@/components/ui/Table';
import { useToast } from '@/providers/ToastProvider';

const STAT_CARDS: Array<{
  key: keyof Stats;
  label: string;
  icon: LucideIcon;
  intent: KpiCardProps['intent'];
}> = [
  { key: 'total', label: 'Total', icon: FileText, intent: 'primary' },
  { key: 'signed', label: 'Assinadas', icon: CheckCircle, intent: 'success' },
  { key: 'issued', label: 'Emitidas', icon: ArrowUpRight, intent: 'info' },
  { key: 'draft', label: 'Rascunhos', icon: Clock, intent: 'warning' },
];

const STATUS_FILTERS: Array<{ value: DeclarationStatus | 'all'; label: string }> = [
  { value: 'all', label: 'Todas' },
  { value: 'draft', label: 'Rascunho' },
  { value: 'issued', label: 'Emitida' },
  { value: 'signed', label: 'Assinada' },
  { value: 'expired', label: 'Expirada' },
];

export default function WorkDeclarationsPage() {
  const [declarations, setDeclarations] = useState<Declaration[]>(MOCK_DECLARATIONS);
  const [stats] = useState<Stats>(MOCK_STATS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<DeclarationStatus | 'all'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const notify = useToast();

  const handleAction = useCallback(
    (action: string, id: string) => {
      const messages: Record<string, string> = {
        pdf: 'PDF gerado com sucesso.',
        issue: 'Declaração emitida com sucesso.',
        sign: 'Declaração assinada.',
        revoke: 'Declaração revogada.',
        'send-email': 'Email enviado ao colaborador.',
        qr: 'QR Code aberto.',
        view: 'A abrir detalhes...',
      };
      if (action === 'issue') {
        setDeclarations((prev) =>
          prev.map((d) => (d.id === id ? { ...d, status: 'issued' } : d)),
        );
      }
      notify({ title: messages[action] ?? 'Ação executada.', intent: 'success' });
    },
    [notify],
  );

  const filtered = declarations.filter((d) => {
    const matchSearch =
      d.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.code.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="min-h-screen bg-canvas">
      <div className="mx-auto max-w-7xl space-y-8 px-6 py-10">
        {/* ── Header ── */}
        <div className="flex items-start justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div className="rounded-control bg-primary-subtle p-1.5">
                <Stamp size={18} strokeWidth={1.75} className="text-primary" />
              </div>
              <span className="font-body text-xs font-medium uppercase tracking-widest text-primary">
                INNOVA · RH
              </span>
            </div>
            <h1 className="font-display text-2xl font-bold text-ink">
              Declarações de Trabalho
            </h1>
            <p className="mt-1 font-body text-sm text-ink-faint">
              Emita, gerencie e valide declarações formais de colaboradores
            </p>
          </div>

          <Button onClick={() => setShowCreateModal(true)}>
            <Plus size={15} strokeWidth={1.75} />
            Nova Declaração
          </Button>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {STAT_CARDS.map((c) => (
            <StatCard
              key={c.key}
              label={c.label}
              value={stats[c.key]}
              icon={c.icon}
              intent={c.intent}
            />
          ))}
        </div>

        {/* ── Filters ── */}
        <div className="flex flex-col gap-3 sm:flex-row">
          {/* Search */}
          <div className="relative flex-1">
            <Search
              size={14}
              strokeWidth={1.75}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar por colaborador, título ou código..."
              className="w-full pl-9"
            />
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2">
            {STATUS_FILTERS.map((f) => (
              <Button
                key={f.value}
                size="sm"
                intent={statusFilter === f.value ? 'primary' : 'ghost'}
                onClick={() => setStatusFilter(f.value)}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>

        {/* ── Table ── */}
        <div className="overflow-hidden rounded-card border border-border bg-surface shadow-resting">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <span className="font-body text-sm text-ink-muted">
              {filtered.length} declaração{filtered.length !== 1 ? 'ões' : ''}
            </span>
            <IconButton
              icon={RefreshCw}
              label="Atualizar"
              intent="ghost"
              onClick={() => setIsLoading(true)}
              className={isLoading ? 'animate-spin' : undefined}
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse font-body text-sm text-ink">
              <TableHead>
                <tr>
                  <TableHeaderCell>Declaração</TableHeaderCell>
                  <TableHeaderCell>Colaborador</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>Datas</TableHeaderCell>
                  <TableHeaderCell>Ações</TableHeaderCell>
                </tr>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-10">
                      <EmptyState
                        icon={FileText}
                        title="Nenhuma declaração encontrada"
                        description="Ajusta a pesquisa ou os filtros para veres mais resultados."
                      />
                    </td>
                  </tr>
                ) : (
                  filtered.map((dec) => (
                    <DeclarationRow key={dec.id} dec={dec} onAction={handleAction} />
                  ))
                )}
              </TableBody>
            </table>
          </div>

          {/* Footer / Pagination hint */}
          <div className="flex items-center justify-between border-t border-border px-5 py-3">
            <span className="font-body text-xs text-ink-faint">
              Mostrando {filtered.length} de {stats.total}
            </span>
            <div className="flex items-center gap-1">
              <Button intent="ghost" size="sm">
                Anterior
              </Button>
              <Button intent="secondary" size="sm">
                1
              </Button>
              <Button intent="ghost" size="sm">
                Próxima
              </Button>
            </div>
          </div>
        </div>

        {/* ── Verification CTA ── */}
        <div className="flex items-center gap-4 rounded-card border border-info bg-info-subtle p-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-surface">
            <Shield size={18} strokeWidth={1.75} className="text-info" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-body text-sm font-medium text-ink">
              Verificação de Autenticidade
            </p>
            <p className="mt-0.5 font-body text-xs text-ink-muted">
              Qualquer declaração pode ser verificada publicamente via QR Code ou pelo código
              único.
            </p>
          </div>
          <Link
            href="/verify"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-control border border-info bg-surface px-4 py-2 font-body text-sm font-medium text-info transition-colors hover:bg-info-subtle"
          >
            <QrCode size={14} strokeWidth={1.75} />
            Verificar
          </Link>
        </div>
      </div>

      {/* ── Create Modal ── */}
      {showCreateModal && <CreateModal onClose={() => setShowCreateModal(false)} />}
    </div>
  );
}
