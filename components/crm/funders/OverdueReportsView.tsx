// components/crm/funders/OverdueReportsView.tsx

import Link from 'next/link';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatDate, ListSkeleton, ErrorBanner } from '@/components/crm/shared';
import { REPORT_COLORS } from './types';
import type { OverdueReport } from './types';

const MS_PER_DAY = 86_400_000;

function daysOverdue(dueDate: string): number {
  return Math.max(
    0,
    Math.floor((Date.now() - new Date(dueDate).getTime()) / MS_PER_DAY),
  );
}

interface OverdueReportsViewProps {
  data: OverdueReport[];
  total: number;
  totalPages: number;
  page: number;
  setPage: (updater: (p: number) => number) => void;
  loading: boolean;
  error: string;
  onRetry: () => void;
}

export function OverdueReportsView({
  data,
  total,
  totalPages,
  page,
  setPage,
  loading,
  error,
  onRetry,
}: OverdueReportsViewProps) {
  if (loading) return <ListSkeleton />;
  if (error) return <ErrorBanner message={error} onRetry={onRetry} />;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">
            Relatórios em Atraso
          </h1>
          <p className="font-body text-ink-muted">
            {total}{' '}
            {total === 1 ? 'relatório por entregar' : 'relatórios por entregar'}
          </p>
        </div>
        <Link href="/crm/funders">
          <Button intent="secondary">← Financiadores</Button>
        </Link>
      </div>

      {/* Tabela */}
      <Card>
        <div className="overflow-hidden">
          <table className="w-full font-body text-sm">
            <thead className="bg-surface-sunken text-ink-muted uppercase">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-xs">Relatório</th>
                <th className="px-4 py-3 text-left font-medium text-xs">Financiador</th>
                <th className="px-4 py-3 text-left font-medium text-xs">Grant</th>
                <th className="px-4 py-3 text-left font-medium text-xs">Período</th>
                <th className="px-4 py-3 text-left font-medium text-xs">Prazo</th>
                <th className="px-4 py-3 text-center font-medium text-xs">Atraso</th>
                <th className="px-4 py-3 text-left font-medium text-xs">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-ink-faint">
                    Nenhum relatório em atraso 🎉
                  </td>
                </tr>
              ) : (
                data.map((r) => {
                  const dias = daysOverdue(r.dueDate);
                  return (
                    <tr key={r.id} className="hover:bg-surface-sunken transition-colors">
                      <td className="px-4 py-3 font-medium text-ink">{r.title}</td>
                      <td className="px-4 py-3 text-ink-muted">
                        {r.funder ? (
                          <>
                            <span className="font-mono text-primary mr-1">
                              {r.funder.code}
                            </span>
                            {r.funder.name}
                          </>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3 text-ink-muted">
                        {r.grant ? (
                          <>
                            <span className="font-mono text-ink-muted mr-1">
                              {r.grant.code}
                            </span>
                            {r.grant.title}
                          </>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3 text-ink-muted">{r.period}</td>
                      <td className="px-4 py-3 text-ink-muted">
                        {formatDate(r.dueDate)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={cn(
                            'font-medium font-body',
                            dias > 30 ? 'text-danger-ink' : 'text-warning-ink',
                          )}
                        >
                          {dias} {dias === 1 ? 'dia' : 'dias'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-pill px-2 py-1 font-body text-xs font-semibold',
                            REPORT_COLORS[r.status] ?? 'bg-surface-sunken text-ink-muted',
                          )}
                        >
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
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
