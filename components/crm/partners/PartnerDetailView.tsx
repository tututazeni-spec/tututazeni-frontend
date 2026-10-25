// components/crm/partners/PartnerDetailView.tsx
// Vista do detalhe de um parceiro: cabeçalho, dados gerais e contrato. Cada
// secção com formulário (marcos, interacções) é um componente com o seu
// próprio estado e mutações — a busca do detalhe e a eliminação vivem em
// usePartnerDetail.

import { useRouter } from 'next/navigation';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Info, formatDate } from '@/components/crm/shared';
import { InteractionsSection } from './InteractionsSection';
import { MilestonesSection } from './MilestonesSection';
import { STATUS_COLORS, TYPE_LABELS } from './types';
import type { PartnerDetail } from './types';
import { safeHref } from '@/lib/safeHref';
import { LinkButton } from '@/components/ui/LinkButton';

interface PartnerDetailViewProps {
  partner: PartnerDetail;
  canDelete: boolean;
  onDelete: () => void;
  isDeleting: boolean;
}

export function PartnerDetailView({
  partner: p,
  canDelete,
  onDelete,
  isDeleting,
}: PartnerDetailViewProps) {
  const router = useRouter();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <LinkButton
            onClick={() => router.push('/crm/partners')}
            className="font-body text-sm mb-2"
          >
            ← Voltar à lista
          </LinkButton>
          <h1 className="font-display text-2xl font-bold text-ink">{p.name}</h1>
          <p className="font-mono font-body text-ink-muted">{p.code}</p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-pill px-2.5 py-0.5 font-body text-xs font-semibold',
              STATUS_COLORS[p.status] ?? 'bg-surface-sunken text-ink-muted',
            )}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {p.status}
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

      {/* Dados gerais */}
      <Card>
        <CardBody className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Info label="Tipo" value={TYPE_LABELS[p.type] || p.type} />
          <Info label="Nível" value={p.tier} />
          <Info label="Nome legal" value={p.legalName} />
          <Info label="Contacto" value={p.contactName} />
          <Info label="Cargo" value={p.contactTitle} />
          <Info label="Email" value={p.email} />
          <Info label="Telefone" value={p.phone} />
          <Info label="Website" value={p.website} />
          <Info label="NIF" value={p.nif} />
          <Info label="Província" value={p.province} />
          <Info label="Cidade" value={p.city} />
          <Info
            label="Valor anual"
            value={
              p.annualValue
                ? `${p.currency} ${p.annualValue.toLocaleString('pt-AO')}`
                : '—'
            }
          />
          <Info
            label="Partilha de receita"
            value={p.revenueSharing != null ? `${p.revenueSharing}%` : '—'}
          />
          <Info
            label="Satisfação média"
            value={p.satisfactionAvg ? p.satisfactionAvg.toFixed(1) : '—'}
          />
          <Info label="Responsável" value={p.assignedTo?.fullName} />
        </CardBody>
      </Card>

      {/* Contrato */}
      <section>
        <h2 className="font-display text-lg font-semibold text-ink mb-3">
          Contrato
        </h2>
        <Card>
          <CardBody className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Info
              label="Início"
              value={p.contractStart ? formatDate(p.contractStart) : '—'}
            />
            <Info
              label="Fim"
              value={p.contractEnd ? formatDate(p.contractEnd) : '—'}
            />
            <Info
              label="Próxima revisão"
              value={p.nextReviewAt ? formatDate(p.nextReviewAt) : '—'}
            />
            <div className="md:col-span-3">
              {p.contractUrl ? (
                <a
                  href={safeHref(p.contractUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline font-body text-sm"
                >
                  Ver documento do contrato
                </a>
              ) : (
                <span className="font-body text-sm text-ink-faint">
                  Sem documento
                </span>
              )}
            </div>
          </CardBody>
        </Card>
      </section>

      <MilestonesSection partnerId={p.id} milestones={p.milestones} />
      <InteractionsSection partnerId={p.id} interactions={p.interactions} />
    </div>
  );
}
