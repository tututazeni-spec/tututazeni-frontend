// components/crm/beneficiaries/BeneficiaryDetailView.tsx
// Vista do detalhe de um beneficiário: cabeçalho e separadores. As secções com
// formulário (necessidades, interacções) têm o seu próprio estado e mutações;
// a busca do detalhe e a eliminação vivem em useBeneficiaryDetail.

import { useRouter } from 'next/navigation';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { STATUS_COLORS } from './types';
import { STATUS_OPTIONS } from './formConfig';
import { InteractionsSection } from './InteractionsSection';
import { NeedsSection } from './NeedsSection';
import {
  BenefitsTab,
  ConsentTab,
  DocumentsTab,
  FollowUpTab,
  HistoryTab,
  ParticipationsTab,
  ProfileTab,
  type BeneficiaryExtras,
} from './BeneficiaryExtraTabs';
import type { BeneficiaryDetail } from './types';
import { LinkButton } from '@/components/ui/LinkButton';

interface BeneficiaryDetailViewProps {
  beneficiary: BeneficiaryDetail;
  canDelete: boolean;
  onDelete: () => void;
  isDeleting: boolean;
  extras: BeneficiaryExtras;
}

export function BeneficiaryDetailView({
  beneficiary: b,
  canDelete,
  onDelete,
  isDeleting,
  extras,
}: BeneficiaryDetailViewProps) {
  const router = useRouter();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <LinkButton
            onClick={() => router.push('/crm/beneficiaries')}
            className="font-body text-sm mb-2"
          >
            ← Voltar à lista
          </LinkButton>
          <h1 className="font-display text-2xl font-bold text-ink">
            {b.fullName}
          </h1>
          <p className="font-mono font-body text-ink-muted">{b.code}</p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-pill px-2.5 py-0.5 font-body text-xs font-semibold',
              STATUS_COLORS[b.status] ?? 'bg-info-subtle text-info-ink',
            )}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {STATUS_OPTIONS.find((o) => o.value === b.status)?.label ??
              b.status}
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

      <Tabs defaultValue="perfil">
        <TabsList className="flex-wrap">
          <TabsTrigger value="perfil">Perfil</TabsTrigger>
          <TabsTrigger value="beneficios">
            Benefícios ({b.benefits.length})
          </TabsTrigger>
          <TabsTrigger value="programas">
            Programas ({b.participations.length})
          </TabsTrigger>
          <TabsTrigger value="acompanhamento">Acompanhamento</TabsTrigger>
          <TabsTrigger value="interacoes">
            Interacções ({b.interactions.length})
          </TabsTrigger>
          <TabsTrigger value="documentos">
            Documentos ({b.documents.length})
          </TabsTrigger>
          <TabsTrigger value="consentimentos">Consentimentos</TabsTrigger>
          <TabsTrigger
            value="historico"
            onClick={() => extras.setHistoryEnabled(true)}
          >
            Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="perfil" className="space-y-6">
          <ProfileTab b={b} />
          <NeedsSection beneficiaryId={b.id} needs={b.needs} />
        </TabsContent>

        <TabsContent value="beneficios">
          <BenefitsTab b={b} extras={extras} />
        </TabsContent>
        <TabsContent value="programas">
          <ParticipationsTab b={b} extras={extras} />
        </TabsContent>
        <TabsContent value="acompanhamento">
          <FollowUpTab b={b} extras={extras} />
        </TabsContent>
        <TabsContent value="documentos">
          <DocumentsTab b={b} extras={extras} />
        </TabsContent>
        <TabsContent value="consentimentos">
          <ConsentTab b={b} extras={extras} />
        </TabsContent>
        <TabsContent value="historico">
          <HistoryTab extras={extras} />
        </TabsContent>

        <TabsContent value="interacoes">
          <InteractionsSection
            beneficiaryId={b.id}
            interactions={b.interactions}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
