// components/crm/funders/FunderDetailView.tsx
// Vista do detalhe de um financiador: cabeçalho, resumo financeiro e dados
// gerais. Cada secção (grants, relatórios, interacções) é um componente com o
// seu próprio formulário e mutações — a busca do detalhe e a eliminação vivem
// em useFunderDetail.

import { useRouter } from 'next/navigation';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Info, SummaryCard, formatMoney } from '@/components/crm/shared';
import { GrantsSection } from './GrantsSection';
import { InteractionsSection } from './InteractionsSection';
import { ReportsSection } from './ReportsSection';
import { STATUS_COLORS } from './types';
import type { FunderDetail } from './types';
import { LinkButton } from '@/components/ui/LinkButton';

interface FunderDetailViewProps {
  funder: FunderDetail;
  canDelete: boolean;
  onDelete: () => void;
  isDeleting: boolean;
}

export function FunderDetailView({
  funder: f,
  canDelete,
  onDelete,
  isDeleting,
}: FunderDetailViewProps) {
  const router = useRouter();
  const executionRate =
    f.totalCommitted > 0 ? (f.totalReceived / f.totalCommitted) * 100 : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <LinkButton
            onClick={() => router.push('/crm/funders')}
            className="font-body text-sm mb-2"
          >
            ← Voltar à lista
          </LinkButton>
          <h1 className="font-display text-2xl font-bold text-ink">{f.name}</h1>
          <p className="font-mono font-body text-ink-muted">{f.code}</p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-pill px-2.5 py-0.5 font-body text-xs font-semibold',
              STATUS_COLORS[f.status] ?? 'bg-surface-sunken text-ink-muted',
            )}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {f.status}
          </span>
          {canDelete && (
            <Button
              intent="danger"
              size="sm"
              onClick={onDelete}
              loading={isDeleting}
            >
              Eliminar
            </Button>
          )}
        </div>
      </div>

      {/* Resumo financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard
          label="Comprometido"
          value={formatMoney(f.totalCommitted, f.currency)}
          color="text-ink"
        />
        <SummaryCard
          label="Recebido"
          value={formatMoney(f.totalReceived, f.currency)}
          color="text-success-ink"
        />
        <SummaryCard
          label="Pendente"
          value={formatMoney(f.totalPending, f.currency)}
          color="text-warning-ink"
        />
        <SummaryCard
          label="Taxa de execução"
          value={`${executionRate.toFixed(1)}%`}
          color="text-primary"
        />
      </div>

      {/* Dados gerais */}
      <Card>
        <CardBody className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Info label="Tipo" value={f.type} />
          <Info label="Nome legal" value={f.legalName} />
          <Info label="País" value={f.country} />
          <Info label="Região" value={f.region} />
          <Info label="Contacto" value={f.contactName} />
          <Info label="Cargo" value={f.contactTitle} />
          <Info label="Email" value={f.email} />
          <Info label="Telefone" value={f.phone} />
          <Info label="Requisitos de reporte" value={f.reportingReqs} />
          <Info label="Responsável" value={f.assignedTo?.fullName} />
          <Info label="Criado por" value={f.createdBy?.fullName} />
          <Info
            label="Satisfação média"
            value={f.satisfactionAvg ? f.satisfactionAvg.toFixed(1) : '—'}
          />
        </CardBody>
      </Card>

      <GrantsSection funderId={f.id} grants={f.grants} />
      <ReportsSection funderId={f.id} reports={f.reports} grants={f.grants} />
      <InteractionsSection funderId={f.id} interactions={f.interactions} />
    </div>
  );
}
