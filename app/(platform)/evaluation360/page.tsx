// app/(platform)/evaluation360/page.tsx
// Container da página de Avaliação 360º: gere o estado de navegação por
// separadores e de qual participante está a ser visto, e liga o hook de
// dados reais (hooks/useEvaluation360.ts) à vista apresentacional
// (components/evaluation360/Evaluation360View.tsx). Mesmo padrão usado em
// payslips/page.tsx (DetailView) e nos restantes módulos já separados — ver
// memory project_innova_component_separation_audit.

'use client';

import { useState } from 'react';
import { useEvaluation360 } from '@/hooks/useEvaluation360';
import { Evaluation360View } from '@/components/evaluation360/Evaluation360View';
import type { TabId } from '@/components/evaluation360/types';

export default function Evaluation360Page() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  // undefined = o próprio utilizador. Só ADMIN/RH conseguem escolher outro
  // colaborador na Visão Geral (ver Evaluation360View.tsx/OverviewTab.tsx).
  const [participantId, setParticipantId] = useState<string | undefined>(undefined);
  const {
    result,
    cycle,
    cycles,
    competencies,
    nineBox,
    feedbacks,
    selfFormQuestions,
    myId,
    cycleId,
  } = useEvaluation360(participantId);

  return (
    <Evaluation360View
      activeTab={activeTab}
      onTabChange={setActiveTab}
      result={result}
      cycle={cycle}
      cycles={cycles}
      competencies={competencies}
      nineBox={nineBox}
      feedbacks={feedbacks}
      selfFormQuestions={selfFormQuestions}
      myId={myId}
      cycleId={cycleId}
      isOwnResult={!participantId}
      onSelectParticipant={setParticipantId}
    />
  );
}
