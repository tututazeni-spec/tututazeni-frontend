// components/settings/seguranca/LoginHistoryCardView.tsx
// Histórico de logins pessoal/da organização (apresentação). Dados: hooks/useLoginHistory.ts.

import { Badge } from '@/components/ui/Badge';
import { Card, CardBody } from '@/components/ui/Card';
import { Pagination } from '@/components/ui/Pagination';
import { Select } from '@/components/ui/Select';
import type { LoginHistoryController } from '@/hooks/useLoginHistory';
import { fmtDate, loginActionIntent, type LoginOutcome } from './logic';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

interface LoginHistoryCardViewProps {
  title: string;
  showOutcomeFilter: boolean;
  ctl: LoginHistoryController;
}

export function LoginHistoryCardView({
  title,
  showOutcomeFilter,
  ctl,
}: LoginHistoryCardViewProps) {
  const { scope, outcome, setOutcome, setPage, isLoading, rows, meta } = ctl;

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-brand/60 px-4 py-3 text-xs font-medium uppercase tracking-wide text-white">
        {title}
        {showOutcomeFilter && (
          <Select
            className="w-44"
            items={[
              { value: 'ALL', label: 'Todos' },
              { value: 'SUCCESS', label: 'Sucesso' },
              { value: 'FAILED', label: 'Falha' },
            ]}
            value={outcome}
            onValueChange={(v) => setOutcome(v as LoginOutcome)}
          />
        )}
      </div>
      <CardBody>
        {isLoading ? (
          <Skeleton rows={3} />
        ) : !rows.length ? (
          <EmptyState variant="inline" title="Sem registos" />
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-ink-faint">
                  {scope === 'all' && <th className="py-2">Utilizador</th>}
                  <th>Acção</th>
                  <th>IP</th>
                  <th>Data</th>
                  <th>Motivo</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-border">
                    {scope === 'all' && (
                      <td className="py-2">{row.user?.fullName ?? '—'}</td>
                    )}
                    <td>
                      <Badge intent={loginActionIntent(row.action)}>
                        {row.action}
                      </Badge>
                    </td>
                    <td>{row.ip ?? '—'}</td>
                    <td>{fmtDate(row.createdAt)}</td>
                    <td className="text-ink-faint">{row.reason ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination
              page={meta?.page ?? 1}
              totalPages={meta?.totalPages ?? 1}
              onPageChange={setPage}
            />
          </>
        )}
      </CardBody>
    </Card>
  );
}
