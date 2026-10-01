// components/executive-reports/ArchivePanel.tsx
// "Histórico & Arquivo" (docs/Executive_Reports.md §2, §7 e §12.4): relatórios
// gerados com modelo, versão do modelo e das fórmulas, filtros aplicados,
// autor, data, número de consultas, e exportação PDF/Excel/CSV.

'use client';

import { useState } from 'react';
import { Archive, Eye } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { QueryError } from '@/components/ui/QueryError';
import { Skeleton } from '@/components/ui/Skeleton';
import { ExportButtons } from './ExportButtons';
import { SectionTables } from './SectionTable';
import type {
  ArchiveResponse,
  OmittedSection,
  ReportSection,
} from './reportTypes';

interface StoredContent {
  meta: { title: string; periodLabel: string };
  sections: ReportSection[];
  omitted: OmittedSection[];
}

function filtersSummary(filters: ArchiveResponse['data'][number]['filters']) {
  const a = filters?.applied;
  if (!a) return '—';
  const parts: string[] = [];
  if (a.period) parts.push(String(a.period));
  if (a.compareWith) parts.push(`vs ${String(a.compareWith)}`);
  if (a.unitId) parts.push(`unidade ${String(a.unitId)}`);
  if (a.departmentId) parts.push(`dep. ${String(a.departmentId)}`);
  if (a.positionId) parts.push(`cargo ${String(a.positionId)}`);
  if (a.contractType) parts.push(String(a.contractType));
  return parts.join(' · ') || '—';
}

function StoredReport({ id }: { id: number }) {
  const q = useApiQuery<StoredContent>(
    ['executive-reports', 'content', id],
    `/executive-reports/${id}/content`,
    { staleTime: STALE_TIME.DYNAMIC },
  );
  if (q.isLoading)
    return (
      <Skeleton
        rows={1}
        wrapperClassName="animate-pulse"
        itemClassName="h-32 rounded-card bg-surface-sunken"
      />
    );
  if (q.error || !q.data)
    return <QueryError error={q.error} onRetry={() => q.refetch()} />;
  return <SectionTables sections={q.data.sections} omitted={q.data.omitted} />;
}

export function ArchivePanel() {
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<number | null>(null);
  const params = { page, limit: 10 };
  const q = useApiQuery<ArchiveResponse>(
    queryKeys.executiveReports.archive(params),
    '/executive-reports/archive',
    { params, staleTime: STALE_TIME.DYNAMIC },
  );

  if (q.isLoading)
    return (
      <Skeleton
        rows={3}
        wrapperClassName="space-y-3 animate-pulse"
        itemClassName="h-24 rounded-card bg-surface-sunken"
      />
    );
  if (q.error || !q.data)
    return <QueryError error={q.error} onRetry={() => q.refetch()} />;

  if (q.data.data.length === 0)
    return (
      <EmptyState
        icon={Archive}
        title="Arquivo vazio"
        description="Os relatórios gerados a partir dos modelos, do construtor ou dos agendamentos ficam aqui, com o contexto da geração."
      />
    );

  return (
    <div className="space-y-3">
      {q.data.data.map((r) => (
        <Card key={r.id} className="p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-body text-sm font-semibold text-ink">
                  {r.title}
                </span>
                {r.schedule && (
                  <Badge intent="info" dot={false}>
                    Agendado: {r.schedule.name}
                  </Badge>
                )}
                {r.confidentiality === 'RESTRICTED' && (
                  <Badge intent="danger" dot={false}>
                    Restrito
                  </Badge>
                )}
              </div>
              <p className="mt-1 font-body text-xs text-ink-muted">
                Modelo {r.templateCode ?? 'n/d'}
                {r.templateVersion ? ` v${r.templateVersion}` : ''} · Fórmulas v
                {r.formulaVersion ?? 'n/d'} · Período {r.period ?? 'n/d'}
              </p>
              <p className="mt-0.5 font-body text-xs text-ink-faint">
                Filtros: {filtersSummary(r.filters)} · Gerado por{' '}
                {r.generatedBy.fullName} em{' '}
                {new Date(r.createdAt).toLocaleString('pt-PT')} ·{' '}
                {r._count.accessLogs} consulta(s)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                intent="ghost"
                size="sm"
                onClick={() => setOpenId(openId === r.id ? null : r.id)}
              >
                <Eye size={14} strokeWidth={1.75} />
                {openId === r.id ? 'Fechar' : 'Ver conteúdo'}
              </Button>
              <ExportButtons reportId={r.id} />
            </div>
          </div>
          {openId === r.id && (
            <div className="mt-4 border-t border-border pt-4">
              <StoredReport id={r.id} />
            </div>
          )}
        </Card>
      ))}

      {q.data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            size="sm"
            intent="ghost"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Anterior
          </Button>
          <span className="font-body text-xs text-ink-muted">
            Página {q.data.page} de {q.data.totalPages}
          </span>
          <Button
            size="sm"
            intent="ghost"
            disabled={page >= q.data.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Seguinte
          </Button>
        </div>
      )}
    </div>
  );
}
