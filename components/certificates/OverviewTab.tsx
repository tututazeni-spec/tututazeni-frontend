// components/certificates/OverviewTab.tsx
// Indicadores reais do centro de certificados; cada cartão abre a lista já
// filtrada. "Vencem em 30 dias" não tem filtro de estado próprio na lista
// (são certificados válidos), por isso abre a lista de válidos.

'use client';

import {
  AlertTriangle,
  Award,
  CheckCircle2,
  Clock,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { KpiCard } from '@/components/ui/KpiCard';
import { QueryError } from '@/components/ui/QueryError';
import { Skeleton } from '@/components/ui/Skeleton';
import type { CertificatesOverview, EffectiveStatus } from './types';

export function OverviewTab({
  onOpen,
}: {
  onOpen: (status: EffectiveStatus | '') => void;
}) {
  const { data, isLoading, error, refetch } = useApiQuery<CertificatesOverview>(
    queryKeys.certificates.overview(),
    '/certificates/admin/overview',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (isLoading) return <Skeleton rows={2} />;
  if (error || !data)
    return <QueryError error={error} onRetry={() => void refetch()} />;

  const cards: {
    key: string;
    label: string;
    value: string | number;
    sub?: string;
    icon: typeof Award;
    intent: 'primary' | 'success' | 'warning' | 'danger' | 'info';
    open: EffectiveStatus | '';
  }[] = [
    {
      key: 'total',
      label: 'Emitidos',
      value: data.total,
      icon: Award,
      intent: 'primary',
      open: '',
    },
    {
      key: 'active',
      label: 'Válidos',
      value: data.active,
      icon: CheckCircle2,
      intent: 'success',
      open: 'ACTIVE',
    },
    {
      key: 'pending',
      label: 'Aguardam aprovação',
      value: data.pendingApproval,
      icon: Clock,
      intent: 'info',
      open: 'PENDING_APPROVAL',
    },
    {
      key: 'expired',
      label: 'Expirados',
      value: data.expired,
      icon: AlertTriangle,
      intent: 'warning',
      open: 'EXPIRED',
    },
    {
      key: 'soon',
      label: 'Vencem em 30 dias',
      value: data.expiringSoon,
      sub: 'Certificados válidos a expirar',
      icon: Clock,
      intent: 'warning',
      open: 'ACTIVE',
    },
    {
      key: 'revoked',
      label: 'Revogados',
      value: data.revoked,
      icon: XCircle,
      intent: 'danger',
      open: 'REVOKED',
    },
    {
      key: 'coverage',
      label: 'Cobertura obrigatória',
      value:
        data.mandatoryCoveragePct === null
          ? '—'
          : `${data.mandatoryCoveragePct}%`,
      sub:
        data.mandatoryCoveragePct === null
          ? 'Sem formações obrigatórias atribuídas'
          : 'Obrigatórias concluídas com certificado válido',
      icon: ShieldCheck,
      intent: 'success',
      open: '',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={() => onOpen(c.open)}
          className="text-left transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-card"
          aria-label={`${c.label}: ${c.value}`}
        >
          <KpiCard
            icon={c.icon}
            label={c.label}
            value={c.value}
            sub={c.sub}
            intent={c.intent}
          />
        </button>
      ))}
    </div>
  );
}
