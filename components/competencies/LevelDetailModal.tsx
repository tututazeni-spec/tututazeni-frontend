// components/competencies/LevelDetailModal.tsx
// Ficha (só leitura) de um nível de proficiência, aberta ao clicar no card do
// nível em "Níveis de Proficiência". Mesmo desenho do modal de detalhe da
// logística (DetailHeader + duas colunas).

'use client';

import {
  BookOpen,
  Brain,
  ClipboardCheck,
  Compass,
  Eye,
  Gauge,
  Hash,
  Layers,
  ListChecks,
  Target,
} from 'lucide-react';
import { Modal, ModalContent } from '@/components/ui/Modal';
import {
  DetailDivider,
  DetailHeader,
  DetailInfoRow,
  DetailSectionRow,
} from '@/components/ui/DetailCardParts';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CATEGORY_CFG, STATUS_CFG } from './constants';
import { parseLevelItems } from './LevelMultiField';
import type { ProficiencyLevelWithCompetency } from './types';

function ItemList({ text }: { text: string | null }) {
  const items = parseLevelItems(text ?? '');
  if (items.length === 0) return <>—</>;
  if (items.length === 1) return <>{items[0]}</>;
  return (
    <ul className="list-disc space-y-1 pl-4">
      {items.map((i) => (
        <li key={i}>{i}</li>
      ))}
    </ul>
  );
}

export interface LevelDetailModalProps {
  level: ProficiencyLevelWithCompetency;
  onClose: () => void;
}

export function LevelDetailModal({ level, onClose }: LevelDetailModalProps) {
  const score =
    level.minScore != null || level.maxScore != null
      ? `${level.minScore ?? '—'}–${level.maxScore ?? '—'} pts`
      : '—';

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title={`Nível ${level.value} — ${level.name}`}
        hideHeading
        navyClose
        className="max-h-[90vh] max-w-4xl overflow-y-auto"
      >
        <DetailHeader
          name={level.name}
          icon={Layers}
          subtitle={`Nível ${level.value} · ${level.competency.name}`}
        >
          <StatusBadge value={level.status} map={STATUS_CFG} variant="pill" />
        </DetailHeader>

        <div className="mt-6 grid gap-6 md:grid-cols-[1fr_auto_1fr]">
          <div className="space-y-4">
            <DetailInfoRow icon={Target} label="Competência">
              <span className="flex flex-wrap items-center gap-2">
                {level.competency.name}
                <StatusBadge
                  value={level.competency.category}
                  map={CATEGORY_CFG}
                />
              </span>
            </DetailInfoRow>
            <DetailInfoRow icon={Gauge} label="Nível (escala 1-5)">
              {level.value}
            </DetailInfoRow>
            <DetailInfoRow icon={Hash} label="Código">
              {level.code ?? '—'}
            </DetailInfoRow>
            <DetailInfoRow icon={ListChecks} label="Pontuação">
              {score}
            </DetailInfoRow>
            <DetailInfoRow icon={BookOpen} label="Descrição">
              {level.description ?? '—'}
            </DetailInfoRow>
          </div>

          <DetailDivider />

          <div className="space-y-5">
            <DetailSectionRow icon={Brain} label="Comportamentos esperados">
              <ItemList text={level.expectedBehaviors} />
            </DetailSectionRow>
            <DetailSectionRow
              icon={BookOpen}
              label="Conhecimentos demonstrados"
            >
              <ItemList text={level.knowledgeDemonstrated} />
            </DetailSectionRow>
            <DetailSectionRow icon={Compass} label="Autonomia">
              <ItemList text={level.autonomy} />
            </DetailSectionRow>
            <DetailSectionRow icon={Layers} label="Complexidade das tarefas">
              <ItemList text={level.taskComplexity} />
            </DetailSectionRow>
            <DetailSectionRow icon={Eye} label="Evidências observáveis">
              <ItemList text={level.observableEvidence} />
            </DetailSectionRow>
            <DetailSectionRow
              icon={ClipboardCheck}
              label="Critérios de avaliação"
            >
              <ItemList text={level.evaluationCriteria} />
            </DetailSectionRow>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}
