// components/crm/partners/ExpiringContractsView.tsx
// GET /crm/partners/expiring-contracts — só ADMIN/RH/GESTOR. Endpoint já
// existia no backend sem UI.

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatKz } from '@/lib/format';
import { ListSkeleton, ErrorBanner, formatDate } from '@/components/crm/shared';
import type { ExpiringContract } from './types';

interface ExpiringContractsViewProps {
  data: ExpiringContract[];
  isLoading: boolean;
  isError: boolean;
  errorMessage: string;
  onRetry: () => void;
}

export function ExpiringContractsView({
  data,
  isLoading,
  isError,
  errorMessage,
  onRetry,
}: ExpiringContractsViewProps) {
  if (isLoading) return <ListSkeleton />;
  if (isError) return <ErrorBanner message={errorMessage} onRetry={onRetry} />;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">
            Contratos a Expirar
          </h1>
          <p className="font-body text-ink-muted">
            {data.length} {data.length === 1 ? 'contrato' : 'contratos'} nos próximos 30 dias
          </p>
        </div>
        <Link href="/crm/partners">
          <Button intent="secondary">← Parceiros</Button>
        </Link>
      </div>

      <Card>
        <div className="overflow-hidden">
          <table className="w-full font-body text-sm">
            <thead className="bg-surface-sunken text-ink-muted uppercase">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-xs">Parceiro</th>
                <th className="px-4 py-3 text-left font-medium text-xs">Fim do contrato</th>
                <th className="px-4 py-3 text-right font-medium text-xs">Valor anual</th>
                <th className="px-4 py-3 text-left font-medium text-xs">Responsável</th>
                <th className="px-4 py-3 text-left font-medium text-xs">Contrato</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-ink-faint">
                    Nenhum contrato a expirar
                  </td>
                </tr>
              ) : (
                data.map((c) => (
                  <tr key={c.id} className="hover:bg-surface-sunken transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        href={`/crm/partners/${c.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        <span className="font-mono mr-1">{c.code}</span>
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-warning-ink font-medium">
                      {formatDate(c.contractEnd)}
                    </td>
                    <td className="px-4 py-3 text-right text-ink-muted">
                      {c.annualValue ? formatKz(c.annualValue) : '—'}
                    </td>
                    <td className="px-4 py-3 text-ink-muted">
                      {c.assignedTo?.fullName || '—'}
                    </td>
                    <td className="px-4 py-3">
                      {c.contractUrl ? (
                        <a
                          href={c.contractUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline"
                        >
                          Ver
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
