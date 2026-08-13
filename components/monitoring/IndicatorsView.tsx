// components/monitoring/IndicatorsView.tsx

import { Button } from '@/components/ui/Button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
import { ErrorBanner, ListSkeleton } from './shared';
import type { Indicator } from './types';

interface IndicatorsViewProps {
  data: Indicator[];
  total: number;
  totalPages: number;
  page: number;
  setPage: (updater: (p: number) => number) => void;
  loading: boolean;
  error: string;
  onRetry: () => void;
}

export function IndicatorsView({
  data,
  total,
  totalPages,
  page,
  setPage,
  loading,
  error,
  onRetry,
}: IndicatorsViewProps) {
  if (loading) return <ListSkeleton height="h-16" rows={5} />;
  if (error) return <ErrorBanner message={error} onRetry={onRetry} />;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">
            Indicadores de Monitoria
          </h1>
          <p className="font-body text-ink-muted">{total} indicadores activos</p>
        </div>
        <a href="/monitoring/okrs" className="font-body text-sm text-primary hover:underline">
          ← OKRs
        </a>
      </div>

      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Código</TableHeaderCell>
            <TableHeaderCell>Indicador</TableHeaderCell>
            <TableHeaderCell>Categoria</TableHeaderCell>
            <TableHeaderCell className="text-right">Baseline</TableHeaderCell>
            <TableHeaderCell className="text-right">Meta</TableHeaderCell>
            <TableHeaderCell>Frequência</TableHeaderCell>
            <TableHeaderCell className="text-center">Registos</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="py-8 text-center text-ink-faint">
                Nenhum indicador encontrado
              </TableCell>
            </TableRow>
          ) : (
            data.map((ind) => (
              <TableRow key={ind.id}>
                <TableCell className="font-data text-primary">{ind.code}</TableCell>
                <TableCell className="font-medium">{ind.name}</TableCell>
                <TableCell className="text-ink-muted">{ind.category || '—'}</TableCell>
                <TableCell className="text-right text-ink-muted">
                  {ind.baseline != null ? `${ind.baseline}${ind.unit || ''}` : '—'}
                </TableCell>
                <TableCell className="text-right font-medium text-ink">
                  {ind.target != null ? `${ind.target}${ind.unit || ''}` : '—'}
                </TableCell>
                <TableCell className="text-ink-muted">{ind.frequency}</TableCell>
                <TableCell className="text-center text-ink-muted">
                  {ind._count?.records ?? 0}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <span className="font-body text-ink-muted">
            Página {page} de {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              intent="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Anterior
            </Button>
            <Button
              intent="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
