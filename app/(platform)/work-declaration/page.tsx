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
  XCircle,
} from 'lucide-react';
import { CreateModal } from '@/components/work-declaration/CreateModal';
import { DeclarationRow } from '@/components/work-declaration/DeclarationRow';
import {
  MOCK_DECLARATIONS,
  MOCK_STATS,
} from '@/components/work-declaration/mockData';
import { StatCard } from '@/components/work-declaration/StatCard';
import type {
  Declaration,
  DeclarationStatus,
  Stats,
} from '@/components/work-declaration/types';

export default function WorkDeclarationsPage() {
  const [declarations, setDeclarations] =
    useState<Declaration[]>(MOCK_DECLARATIONS);
  const [stats] = useState<Stats>(MOCK_STATS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<DeclarationStatus | 'all'>(
    'all',
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{
    msg: string;
    type: 'success' | 'error';
  } | null>(null);

  const showToast = useCallback(
    (msg: string, type: 'success' | 'error' = 'success') => {
      setToast({ msg, type });
      setTimeout(() => setToast(null), 3500);
    },
    [],
  );

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
      showToast(messages[action] ?? 'Ação executada.');
    },
    [showToast],
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
    <div className="min-h-screen bg-[#070d18] text-white">
      {/* Subtle grid background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-6 py-10 space-y-8">
        {/* ── Header ── */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-sky-600/20 border border-sky-500/20 flex items-center justify-center">
                <Stamp size={14} className="text-sky-400" />
              </div>
              <span className="text-xs font-medium text-sky-400 uppercase tracking-widest">
                INNOVA · RH
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Declarações de Trabalho
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Emita, gerencie e valide declarações formais de colaboradores
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-sm font-medium text-white transition-colors shadow-lg shadow-sky-900/30"
          >
            <Plus size={15} />
            Nova Declaração
          </button>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            label="Total"
            value={stats.total}
            icon={<FileText size={18} className="text-slate-400" />}
            accent="bg-slate-700"
          />
          <StatCard
            label="Assinadas"
            value={stats.signed}
            icon={<CheckCircle size={18} className="text-emerald-400" />}
            accent="bg-emerald-800"
          />
          <StatCard
            label="Emitidas"
            value={stats.issued}
            icon={<ArrowUpRight size={18} className="text-sky-400" />}
            accent="bg-sky-800"
          />
          <StatCard
            label="Rascunhos"
            value={stats.draft}
            icon={<Clock size={18} className="text-amber-400" />}
            accent="bg-amber-800"
          />
        </div>

        {/* ── Filters ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              type="text"
              placeholder="Pesquisar por colaborador, título ou código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#111827] border border-white/8 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-sky-500/50 transition-colors"
            />
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2">
            {(
              [
                ['all', 'Todas'],
                ['draft', 'Rascunho'],
                ['issued', 'Emitida'],
                ['signed', 'Assinada'],
                ['expired', 'Expirada'],
              ] as const
            ).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setStatusFilter(val)}
                className={`px-3 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                  statusFilter === val
                    ? 'bg-sky-900/40 text-sky-300 border border-sky-500/30'
                    : 'text-slate-500 hover:text-slate-300 border border-transparent'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Table ── */}
        <div className="rounded-2xl bg-[#0b1121] border border-white/5 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <span className="text-sm text-slate-400">
              {filtered.length} declaração{filtered.length !== 1 ? 'ões' : ''}
            </span>
            <button
              onClick={() => setIsLoading(true)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors"
              title="Atualizar"
            >
              <RefreshCw
                size={14}
                className={isLoading ? 'animate-spin' : ''}
              />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5 text-xs text-slate-500 uppercase tracking-wider">
                  <th className="px-5 py-3 text-left font-medium">
                    Declaração
                  </th>
                  <th className="px-5 py-3 text-left font-medium">
                    Colaborador
                  </th>
                  <th className="px-5 py-3 text-left font-medium">Status</th>
                  <th className="px-5 py-3 text-left font-medium">Datas</th>
                  <th className="px-5 py-3 text-left font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-16 text-center text-slate-600"
                    >
                      <FileText size={32} className="mx-auto mb-3 opacity-30" />
                      <p className="text-sm">Nenhuma declaração encontrada</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((dec) => (
                    <DeclarationRow
                      key={dec.id}
                      dec={dec}
                      onAction={handleAction}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer / Pagination hint */}
          <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between">
            <span className="text-xs text-slate-600">
              Mostrando {filtered.length} de {stats.total}
            </span>
            <div className="flex items-center gap-1">
              <button className="px-3 py-1.5 text-xs text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                Anterior
              </button>
              <button className="px-3 py-1.5 text-xs text-white bg-sky-900/40 rounded-lg border border-sky-500/20">
                1
              </button>
              <button className="px-3 py-1.5 text-xs text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                Próxima
              </button>
            </div>
          </div>
        </div>

        {/* ── Verification CTA ── */}
        <div className="rounded-2xl border border-sky-500/10 bg-sky-950/20 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-sky-900/40 flex items-center justify-center shrink-0">
            <Shield size={18} className="text-sky-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white">
              Verificação de Autenticidade
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Qualquer declaração pode ser verificada publicamente via QR Code
              ou pelo código único.
            </p>
          </div>
          <Link
            href="/verify"
            className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 text-sm font-medium transition-colors border border-sky-500/20"
          >
            <QrCode size={14} />
            Verificar
          </Link>
        </div>
      </div>

      {/* ── Create Modal ── */}
      {showCreateModal && (
        <CreateModal onClose={() => setShowCreateModal(false)} />
      )}

      {/* ── Toast ── */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl text-sm font-medium transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-900/80 border border-emerald-500/30 text-emerald-200'
              : 'bg-red-900/80 border border-red-500/30 text-red-200'
          } backdrop-blur-md`}
        >
          {toast.type === 'success' ? (
            <CheckCircle size={15} />
          ) : (
            <XCircle size={15} />
          )}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
