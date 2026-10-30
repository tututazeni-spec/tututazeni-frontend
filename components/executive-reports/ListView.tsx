// components/executive-reports/ListView.tsx
// Vista "Relatórios Executivos": stats + grelha filtrável de
// relatórios. Extraído de app/(platform)/executive-reports/page.tsx.

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import {
  CheckCircle2,
  Clock,
  FilePen,
  FileText,
  Filter,
  MapPin,
} from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Button } from '@/components/ui/Button';
import { NavyStatCard } from '@/components/ui/NavyStatCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { STATUS_CFG, TYPE_CFG } from './constants';
import { ReportCard } from './ReportCard';
import type { Report, ReportStats } from './types';

interface ListViewProps {
  onSelect: (id: number) => void;
  onGenerate: () => void;
}

// Sentinel 'ALL' porque o Select da fundação (Radix) não aceita value=""
// num Item — mesmo padrão usado em components/reports/ReportHub.tsx.
const TYPE_ITEMS = [
  { value: 'ALL', label: 'Todos os tipos' },
  ...Object.entries(TYPE_CFG).map(([k, v]) => ({
    value: k,
    label: v.label,
  })),
];
const STATUS_ITEMS = [
  { value: 'ALL', label: 'Todos os estados' },
  ...Object.entries(STATUS_CFG).map(([k, v]) => ({ value: k, label: v.label })),
];

export function ListView({ onSelect, onGenerate }: ListViewProps) {
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const params = {
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(typeFilter ? { type: typeFilter } : {}),
  };
  const { data, isLoading: loading } = useApiQuery<{
    data: Report[];
    total: number;
  }>(queryKeys.executiveReports.list(params), '/executive-reports', {
    params,
    staleTime: STALE_TIME.SEMI_STATIC,
    placeholderData: keepPreviousData,
  });
  const { data: stats } = useApiQuery<ReportStats>(
    queryKeys.executiveReports.stats(),
    '/executive-reports/stats',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  return (
    <div>
      {/* Stats */}
      {stats && (
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <NavyStatCard
            label="Total"
            value={stats.total}
            tone="blue"
            icon={FileText}
          />
          <NavyStatCard
            label="Publicados"
            value={stats.byStatus['PUBLISHED'] ?? 0}
            tone="green"
            icon={CheckCircle2}
          />
          <NavyStatCard
            label="Em revisão"
            value={stats.byStatus['IN_REVIEW'] ?? 0}
            tone="orange"
            icon={Clock}
          />
          <NavyStatCard
            label="Rascunhos"
            value={stats.byStatus['DRAFT'] ?? 0}
            tone="blue"
            iconTone="gray"
            icon={FilePen}
          />
        </div>
      )}

      {/* Filtros */}
      <div className="mb-5 flex items-center gap-3">
        <Select
          variant="underline"
          icon={Filter}
          items={TYPE_ITEMS}
          value={typeFilter || 'ALL'}
          onValueChange={(v) => setTypeFilter(v === 'ALL' ? '' : v)}
          className="w-56"
        />
        <Select
          variant="underline"
          icon={MapPin}
          items={STATUS_ITEMS}
          value={statusFilter || 'ALL'}
          onValueChange={(v) => setStatusFilter(v === 'ALL' ? '' : v)}
          className="w-56"
        />
        <span className="ml-auto font-body text-xs text-ink-faint">
          {data?.total ?? 0} relatórios
        </span>
        <Button size="sm" onClick={onGenerate}>
          Gerar relatório
        </Button>
      </div>

      {/* Grid */}
      {loading ? (
        <Skeleton
          rows={3}
          wrapperClassName="space-y-3"
          itemClassName="skeleton-shimmer h-16 rounded-card"
        />
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {data?.data.map((r) => (
            <ReportCard key={r.id} report={r} onClick={() => onSelect(r.id)} />
          ))}
          {data?.data.length === 0 && (
            <EmptyState
              title="Sem relatórios criados ainda"
              description="Gera automaticamente o primeiro relatório executivo com os KPIs actuais da plataforma."
              action={{
                label: 'Gerar primeiro relatório',
                onClick: onGenerate,
              }}
              className="col-span-2"
            />
          )}
        </div>
      )}
    </div>
  );
}
