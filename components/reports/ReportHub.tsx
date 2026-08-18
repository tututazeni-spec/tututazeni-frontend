// components/reports/ReportHub.tsx
// Vista inicial "Report Hub": grelha de templates pesquisável e
// filtrável por categoria. Extraído de
// app/(platform)/reports/page.tsx.

'use client';

import { useState } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { CAT_CONFIG } from './constants';
import { TemplateCard } from './TemplateCard';
import type { Template } from './types';

interface ReportHubProps {
  onRun: (t: Template) => void;
}

// Sentinel 'ALL' porque o Select da fundação (Radix) não aceita value=""
// num Item — mesmo padrão usado em components/library/LibraryListView.tsx.
const CATEGORY_ITEMS = [
  { value: 'ALL', label: 'Todas as categorias' },
  ...Object.entries(CAT_CONFIG).map(([k, v]) => ({ value: k, label: v.label })),
];

export function ReportHub({ onRun }: ReportHubProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const { data: templates = [], isLoading: loading } = useApiQuery<Template[]>(
    queryKeys.reports.templates(),
    '/reports/templates',
    { staleTime: STALE_TIME.STATIC },
  );

  const filtered = templates.filter(
    (t) =>
      (!category || t.category === category) &&
      (!search || t.name.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div className="space-y-6">
      {/* Search + filter */}
      <Card>
        <CardBody className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] flex-1">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar modelos..."
              className="w-full"
            />
          </div>
          <Select
            items={CATEGORY_ITEMS}
            value={category || 'ALL'}
            onValueChange={(v) => setCategory(v === 'ALL' ? '' : v)}
            className="w-56"
          />
          <span className="self-center font-body text-xs text-ink-faint">
            {filtered.length} modelos
          </span>
        </CardBody>
      </Card>

      {loading ? (
        <Skeleton
          rows={6}
          wrapperClassName="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4"
          itemClassName="skeleton-shimmer h-40 rounded-card"
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {filtered.map((t) => (
            <TemplateCard key={t.id} tpl={t} onRun={onRun} />
          ))}
        </div>
      )}
    </div>
  );
}
