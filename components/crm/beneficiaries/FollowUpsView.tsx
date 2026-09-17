// components/crm/beneficiaries/FollowUpsView.tsx
// Separador "Follow-ups" — GET /crm/beneficiaries/follow-ups, sem @Roles()
// no controller (visível a qualquer utilizador autenticado; filtra pelos
// beneficiários atribuídos/criados por si). Endpoint já existia sem UI.

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ListSkeleton, ErrorBanner, formatDate } from '@/components/crm/shared';
import type { FollowUp } from './types';

interface FollowUpsViewProps {
  followUps: FollowUp[];
  isLoading: boolean;
  isError: boolean;
  errorMessage: string;
  onRetry: () => void;
}

export function FollowUpsView({
  followUps,
  isLoading,
  isError,
  errorMessage,
  onRetry,
}: FollowUpsViewProps) {
  if (isLoading) return <ListSkeleton />;
  if (isError) return <ErrorBanner message={errorMessage} onRetry={onRetry} />;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">
            Follow-ups Pendentes
          </h1>
          <p className="font-body text-ink-muted">
            {followUps.length}{' '}
            {followUps.length === 1 ? 'beneficiário' : 'beneficiários'} atribuídos a si
            com follow-up a vencer
          </p>
        </div>
        <Link href="/crm/beneficiaries">
          <Button intent="secondary">← Beneficiários</Button>
        </Link>
      </div>

      <Card>
        <div className="divide-y divide-border">
          {followUps.length === 0 ? (
            <p className="p-4 font-body text-ink-faint">Sem follow-ups pendentes</p>
          ) : (
            followUps.map((f) => (
              <Link
                key={f.id}
                href={`/crm/beneficiaries/${f.id}`}
                className="p-4 flex justify-between items-center hover:bg-surface-sunken transition-colors"
              >
                <div>
                  <p className="font-body font-medium text-ink">
                    <span className="font-mono text-primary mr-2">{f.code}</span>
                    {f.fullName}
                  </p>
                  <p className="font-body text-xs text-ink-muted">
                    {f.phone || f.email || '—'} · {f._count.interactions} interacções
                  </p>
                </div>
                <span className="font-body text-xs text-warning-ink font-medium">
                  Follow-up: {formatDate(f.nextFollowUpAt)}
                </span>
              </Link>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
