// app/(platform)/evaluation360/page.tsx
// Container da página de Avaliação 360º: só gere o estado de navegação por
// separadores e liga o hook de dados (hooks/useEvaluation360.ts, mock por
// agora) à vista apresentacional (components/evaluation360/Evaluation360View.tsx).
// Mesmo padrão usado em payslips/page.tsx (DetailView) e nos restantes
// módulos já separados — ver memory project_innova_component_separation_audit.

'use client';

import { useState } from 'react';
import { useEvaluation360 } from '@/hooks/useEvaluation360';
import { Evaluation360View } from '@/components/evaluation360/Evaluation360View';
import type { TabId } from '@/components/evaluation360/types';

export default function Evaluation360Page() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const {
    result,
    cycle,
    cycles,
    competencies,
    nineBox,
    feedbacks,
    formQuestions,
  } = useEvaluation360();

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
      formQuestions={formQuestions}
    />
  );
}
