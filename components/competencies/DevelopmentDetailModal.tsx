// components/competencies/DevelopmentDetailModal.tsx
// Detalhe de um plano de evolução (acção de desenvolvimento) do separador
// Desenvolvimento (docs/módulo_competencies.md §8). Mesmo desenho do detalhe
// do modelo de competências (ModelDetailModal): ficha em duas colunas com
// DetailCardParts. Os dados vêm da própria linha da lista (GET
// /competencies/development), por isso não há pedido extra.

'use client';

import type { CSSProperties } from 'react';
import {
  Activity,
  BookOpen,
  CalendarCheck,
  CalendarRange,
  ClipboardList,
  Flag,
  Gauge,
  Layers,
  Shapes,
  Target,
  TrendingUp,
  UserCog,
  Workflow,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  DetailDivider,
  DetailHeader,
  DetailInfoRow,
} from '@/components/ui/DetailCardParts';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  CATEGORY_CFG,
  DEV_ACTION_STATUS_CFG,
  DEV_ACTION_TYPE_CFG,
  DEV_RESULT_CFG,
} from './constants';
import type { CompetencyDevelopmentAction } from './types';
import { formatDateNumeric } from '@/lib/format';

const NAVY_BTN =
  'border border-[#0F1F3D] bg-[#0F1F3D] text-white hover:bg-[#0F1F3D] hover:text-white';

export interface DevelopmentDetailModalProps {
  action: CompetencyDevelopmentAction;
  onClose: () => void;
}

export function DevelopmentDetailModal({
  action: r,
  onClose,
}: DevelopmentDetailModalProps) {
  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title={r.acao}
        hideHeading
        navyClose
        className="max-h-[90vh] max-w-4xl overflow-y-auto"
        style={
          {
            '--detail-label': '#0F1F3D',
            '--color-brand-ink': '#0F1F3D',
            '--color-brand': '#0F1F3D',
            '--color-brand-hover': '#0F1F3D',
            '--color-brand-active': '#0F1F3D',
          } as CSSProperties
        }
      >
        <DetailHeader
          name={r.colaborador}
          avatarUrl={r.colaboradorAvatarUrl}
          subtitle={`${r.departamento ?? '—'} · ${r.acao}`}
        >
          <StatusBadge value={r.estado} map={DEV_ACTION_STATUS_CFG} />
        </DetailHeader>

        <div className="mt-6 grid gap-6 md:grid-cols-[1fr_auto_1fr]">
          <div className="space-y-4">
            <DetailInfoRow icon={UserCog} label="Colaborador">
              {r.colaborador}
            </DetailInfoRow>
            <DetailInfoRow icon={Layers} label="Competência">
              <span className="flex flex-wrap items-center gap-2">
                {r.competencia}
                <StatusBadge value={r.categoria} map={CATEGORY_CFG} />
              </span>
            </DetailInfoRow>
            <DetailInfoRow icon={TrendingUp} label="Lacuna">
              {r.gap ?? '—'}
            </DetailInfoRow>
            <DetailInfoRow icon={Gauge} label="Nível actual">
              {r.nivelAtual ?? '—'}
            </DetailInfoRow>
            <DetailInfoRow icon={Target} label="Nível objectivo">
              {r.nivelObjetivo ?? '—'}
            </DetailInfoRow>
            <DetailInfoRow icon={ClipboardList} label="Acção">
              {r.acao}
            </DetailInfoRow>
            <DetailInfoRow icon={Shapes} label="Tipo">
              <StatusBadge value={r.tipoAcao} map={DEV_ACTION_TYPE_CFG} />
            </DetailInfoRow>
            <DetailInfoRow icon={BookOpen} label="Curso/Formação">
              {r.cursoFormacao ?? '—'}
            </DetailInfoRow>
          </div>

          <DetailDivider />

          <div className="space-y-4">
            <DetailInfoRow icon={Workflow} label="PDI">
              {r.pdiAssociado.name}
            </DetailInfoRow>
            <DetailInfoRow icon={UserCog} label="Responsável">
              {r.responsavel ?? '—'}
            </DetailInfoRow>
            <DetailInfoRow icon={CalendarRange} label="Início">
              {r.dataInicio ? formatDateNumeric(r.dataInicio) : '—'}
            </DetailInfoRow>
            <DetailInfoRow icon={CalendarCheck} label="Conclusão prevista">
              {r.dataPrevistaConclusao
                ? formatDateNumeric(r.dataPrevistaConclusao)
                : '—'}
            </DetailInfoRow>
            <DetailInfoRow icon={Activity} label="Estado">
              <StatusBadge value={r.estado} map={DEV_ACTION_STATUS_CFG} />
            </DetailInfoRow>
            <DetailInfoRow icon={Gauge} label="Progresso">
              <div className="w-40">
                <ProgressBar value={r.progresso} />
                <span className="mt-0.5 block text-xs">{r.progresso}%</span>
              </div>
            </DetailInfoRow>
            <DetailInfoRow icon={Flag} label="Resultado">
              <StatusBadge value={r.resultado} map={DEV_RESULT_CFG} />
            </DetailInfoRow>
            <DetailInfoRow icon={TrendingUp} label="Nível após">
              {r.nivelAposDesenvolvimento ?? '—'}
            </DetailInfoRow>
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
