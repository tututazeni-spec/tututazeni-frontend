// components/evaluation360/CycleDetailModal.tsx
// Abre ao clicar numa linha da lista "Avaliações 360°". Mesmo desenho da ficha
// da competência (CompetencyDetailModal): cabeçalho com gradiente, duas
// colunas (informação | secções) e rodapé. Os dados da linha vêm já da lista;
// GET /evaluation360/cycles/:id acrescenta descrição, pesos, anonimato e
// competências avaliadas.

'use client';

import type { CSSProperties } from 'react';
import {
  AlertCircle,
  CalendarDays,
  FileText,
  Hash,
  Layers,
  ShieldCheck,
  Target,
  UserCog,
  Users,
} from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Button } from '@/components/ui/Button';
import {
  DetailDivider,
  DetailHeader,
  DetailInfoRow,
  DetailSectionRow,
} from '@/components/ui/DetailCardParts';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { cardSolidColor } from '@/components/competencies/cardColors';
import { cycleStatusDisplay } from './colors';

const NAVY_BTN =
  'border border-[#0F1F3D] bg-[#0F1F3D] text-white hover:bg-[#0F1F3D] hover:text-white';

const TYPE_LABEL: Record<string, string> = {
  TRIMESTRAL: 'Trimestral',
  SEMESTRAL: 'Semestral',
  ANUAL: 'Anual',
  PROJECT: 'Projecto',
  CUSTOM: 'Personalizado',
};

const ANONYMITY_LABEL: Record<string, string> = {
  ANONYMOUS: 'Anónimo',
  IDENTIFIED: 'Identificado',
  MIXED: 'Misto',
};

export interface CycleDetailRow {
  id: string;
  name: string;
  code: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  createdByName: string;
  createdAt: string;
  _count: { participants: number };
  evaluatorsCount: number;
  completedParticipants: number;
  participationRate: number;
}

interface CycleDetailExtra {
  description?: string | null;
  anonymityMode?: string;
  quorumMinimum?: number;
  weightSelf?: number;
  weightManager?: number;
  weightPeer?: number;
  weightSubordinate?: number;
  weightExternal?: number;
  competencies?: { id: string; competency?: { name?: string } | null }[];
}

export interface CycleDetailModalProps {
  cycle: CycleDetailRow;
  /** Posição do ciclo na lista: define a cor do cartão (como no catálogo). */
  colorIndex: number;
  onClose: () => void;
}

export function CycleDetailModal({
  cycle,
  colorIndex,
  onClose,
}: CycleDetailModalProps) {
  const { data, isLoading, error } = useApiQuery<CycleDetailExtra>(
    queryKeys.evaluation360.cycleDetail(cycle.id),
    `/evaluation360/cycles/${cycle.id}`,
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const color = cardSolidColor(colorIndex);
  const weights: [string, number | undefined][] = [
    ['Auto-avaliação', data?.weightSelf],
    ['Gestor', data?.weightManager],
    ['Pares', data?.weightPeer],
    ['Subordinados', data?.weightSubordinate],
    ['Externos', data?.weightExternal],
  ];
  const shownWeights = weights.filter(([, w]) => w != null && w > 0);

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title={cycle.name}
        hideHeading
        navyClose
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        style={
          {
            '--detail-label': '#0F1F3D',
            '--color-brand-ink': color,
            '--color-brand': color,
            '--color-brand-hover': color,
            '--color-brand-active': color,
          } as CSSProperties
        }
      >
        <DetailHeader name={cycle.name} icon={Target}>
          <span className="rounded-full bg-surface-sunken px-3 py-0.5 text-xs font-semibold text-ink">
            {cycleStatusDisplay(cycle.status, cycle.startDate, cycle.endDate)}
          </span>
        </DetailHeader>

        <div className="mt-6 grid gap-6 md:grid-cols-[1fr_auto_1fr]">
          <div className="space-y-4">
            <DetailInfoRow icon={Hash} label="Código">
              {cycle.code}
            </DetailInfoRow>
            <DetailInfoRow icon={Layers} label="Tipo">
              {TYPE_LABEL[cycle.type] ?? cycle.type}
            </DetailInfoRow>
            <DetailInfoRow icon={CalendarDays} label="Período">
              {cycle.startDate.slice(0, 10)} → {cycle.endDate.slice(0, 10)}
            </DetailInfoRow>
            <DetailInfoRow icon={Users} label="Avaliados / Avaliadores">
              {cycle._count.participants} / {cycle.evaluatorsCount}
            </DetailInfoRow>
            <DetailInfoRow icon={Target} label="Participação">
              {cycle.participationRate}% ({cycle.completedParticipants}{' '}
              concluídos)
            </DetailInfoRow>
            <DetailInfoRow icon={UserCog} label="Criado por">
              {cycle.createdByName} · {cycle.createdAt.slice(0, 10)}
            </DetailInfoRow>
          </div>

          <DetailDivider />

          <div className="space-y-4">
            {error ? (
              <div className="flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
                <AlertCircle size={16} strokeWidth={1.75} />
                Não foi possível carregar o detalhe do ciclo.
              </div>
            ) : isLoading ? (
              <p className="text-sm text-ink-muted">A carregar…</p>
            ) : (
              <>
                <DetailSectionRow icon={FileText} label="Descrição">
                  <span className="whitespace-pre-wrap">
                    {data?.description || '—'}
                  </span>
                </DetailSectionRow>
                <DetailSectionRow icon={ShieldCheck} label="Anonimato e quórum">
                  {data?.anonymityMode
                    ? (ANONYMITY_LABEL[data.anonymityMode] ??
                      data.anonymityMode)
                    : '—'}
                  {data?.quorumMinimum != null &&
                    ` · mínimo de ${data.quorumMinimum} respostas`}
                </DetailSectionRow>
                <DetailSectionRow icon={Users} label="Pesos por avaliador">
                  {shownWeights.length === 0
                    ? '—'
                    : shownWeights.map(([l, w]) => `${l} ${w}%`).join(' · ')}
                </DetailSectionRow>
                <DetailSectionRow icon={Layers} label="Competências avaliadas">
                  {!data?.competencies || data.competencies.length === 0 ? (
                    '—'
                  ) : (
                    <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                      {data.competencies.map((c) => (
                        <li key={c.id}>{c.competency?.name ?? '—'}</li>
                      ))}
                    </ul>
                  )}
                </DetailSectionRow>
              </>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-border pt-4">
          <Button intent="secondary" className={NAVY_BTN} onClick={onClose}>
            Fechar
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
