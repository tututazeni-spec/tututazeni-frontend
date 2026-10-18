// components/crm/partners/OverdueMilestonesView.tsx
// GET /crm/partners/overdue-milestones — só ADMIN/RH/GESTOR. Endpoint já
// existia no backend sem UI.

import Link from 'next/link';
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
      <Card>
        <div className="divide-y divide-border">
          {data.length === 0 ? (
            <p className="p-4 font-body text-ink-faint">Sem marcos em atraso</p>
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
                    <span className="font-mono text-primary mr-1">
                      {m.partner.code}
                    </span>
                    {m.partner.name}
                    {m.createdBy?.fullName
                      ? ` · Criado por ${m.createdBy.fullName}`
                      : ''}
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
