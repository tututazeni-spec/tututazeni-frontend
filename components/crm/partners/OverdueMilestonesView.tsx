// components/crm/partners/OverdueMilestonesView.tsx
// GET /crm/partners/overdue-milestones — só ADMIN/RH/GESTOR. Endpoint já
// existia no backend sem UI.

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ListSkeleton, ErrorBanner, formatDate } from '@/components/crm/shared';
import type { OverdueMilestone } from './types';

interface OverdueMilestonesViewProps {
  data: OverdueMilestone[];
  isLoading: boolean;
  isError: boolean;
  errorMessage: string;
  onRetry: () => void;
}

export function OverdueMilestonesView({
  data,
  isLoading,
  isError,
  errorMessage,
  onRetry,
}: OverdueMilestonesViewProps) {
  if (isLoading) return <ListSkeleton />;
  if (isError) return <ErrorBanner message={errorMessage} onRetry={onRetry} />;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">
            Milestones em Atraso
          </h1>
          <p className="font-body text-ink-muted">
            {data.length} {data.length === 1 ? 'milestone' : 'milestones'} por concluir
          </p>
        </div>
        <Link href="/crm/partners">
          <Button intent="secondary">← Parceiros</Button>
        </Link>
      </div>

      <Card>
        <div className="divide-y divide-border">
          {data.length === 0 ? (
            <p className="p-4 font-body text-ink-faint">Sem milestones em atraso</p>
          ) : (
            data.map((m) => (
              <Link
                key={m.id}
                href={`/crm/partners/${m.partnerId}`}
                className="p-4 flex justify-between items-center hover:bg-surface-sunken transition-colors"
              >
                <div>
                  <p className="font-body font-medium text-ink">{m.title}</p>
                  <p className="font-body text-xs text-ink-muted">
                    <span className="font-mono text-primary mr-1">{m.partner.code}</span>
                    {m.partner.name}
                    {m.createdBy?.fullName ? ` · Criado por ${m.createdBy.fullName}` : ''}
                  </p>
                </div>
                <span className="font-body text-xs text-danger-ink font-medium">
                  Prazo: {formatDate(m.dueDate)}
                </span>
              </Link>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
