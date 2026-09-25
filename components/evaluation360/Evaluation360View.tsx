// components/evaluation360/Evaluation360View.tsx
// Vista apresentacional da página de Avaliação 360º: cabeçalho, navegação
// por separadores e o conteúdo de cada separador. Todos os dados chegam por
// props — quem os obtém é o hook hooks/useEvaluation360.ts, consumido pelo
// container em app/(platform)/evaluation360/page.tsx (mesmo padrão usado em
// components/payslips/PayslipDetailView.tsx).
//
// Extraído de page.tsx porque a página inteira (1868 linhas) estava toda
// numa única função — ver memory project_innova_component_separation_audit.

'use client';

import type {
  CompetencyScore,
  ContinuousFeedback,
  CycleInfo,
  ParticipantProfile,
  ParticipantResult,
  TabId,
} from './types';
import { OverviewTab } from './OverviewTab';
import { OverviewAdminTab } from './OverviewAdminTab';
import { EvaluationCyclesTab } from './EvaluationCyclesTab';
import { AvaliadosTab } from './AvaliadosTab';
import { AvaliadoresTab } from './AvaliadoresTab';
import { QuestionariosTab } from './QuestionariosTab';
import { ResultadosTab } from './ResultadosTab';
import { FeedbackTab } from './FeedbackTab';
import { RelatoriosTab } from './RelatoriosTab';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { EVAL_OVERVIEW_ROLES, EVAL_CREATOR_ROLES } from '@/lib/roles';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import {
  BarChart3,
  FileText,
  Layers,
  LayoutDashboard,
  LineChart,
  MessageSquare,
  Users,
  UserCog,
  ClipboardList,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
  { id: 'adminOverview', label: 'Painel Geral', icon: BarChart3 },
  { id: 'cycles', label: 'Avaliações 360°', icon: Layers },
  { id: 'evaluated', label: 'Avaliados', icon: Users },
  { id: 'evaluators', label: 'Avaliadores', icon: UserCog },
  { id: 'questionnaires', label: 'Questionários', icon: FileText },
  { id: 'results', label: 'Resultados', icon: LineChart },
  { id: 'feedback', label: 'Feedback', icon: MessageSquare },
  { id: 'reports', label: 'Relatórios', icon: ClipboardList },
];

// Abas "Avaliados"/"Avaliadores" (docs/evaluation360.md §4/§5) são vistas de
// gestão do ciclo — mesmo grupo de papéis que já gere participantes/
// avaliadores nas rotas POST (EVAL_CREATOR_ROLES), não a vista pessoal.
const MANAGEMENT_TAB_IDS: TabId[] = ['evaluated', 'evaluators'];

export interface Evaluation360ViewProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  result: ParticipantResult | null;
  participant?: ParticipantProfile;
  cycle: CycleInfo | null;
  competencies: CompetencyScore[];
  feedbacks: ContinuousFeedback[];
  myId?: string;
  cycleId?: string;
}

export function Evaluation360View({
  activeTab,
  onTabChange,
  result,
  participant,
  cycle,
  competencies,
  feedbacks,
  myId,
  cycleId,
}: Evaluation360ViewProps) {
  const role = useCurrentRole();
  // Espelha o @Roles de GET /evaluation360/overview — só quem gere o módulo
  // vê o painel agregado; o separador pessoal "Visão Geral" fica aberto a
  // todos (ver EVAL_OVERVIEW_ROLES em lib/roles.ts).
  const canSeeOverview = !!role && EVAL_OVERVIEW_ROLES.includes(role);
  const canManage = !!role && EVAL_CREATOR_ROLES.includes(role);
  const visibleTabs = TABS.filter((t) => {
    if (t.id === 'adminOverview' || t.id === 'reports') return canSeeOverview;
    if (MANAGEMENT_TAB_IDS.includes(t.id)) return canManage;
    return true;
  });
  const feedbackTargetId = result?.userId ?? myId;

  const renderTab = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <OverviewTab result={result} participant={participant} cycle={cycle} cycleId={cycleId} />
        );
      case 'adminOverview':
        return canSeeOverview ? <OverviewAdminTab /> : null;
      case 'results':
        return <ResultadosTab competencies={competencies} />;
      case 'questionnaires':
        return <QuestionariosTab />;
      case 'feedback':
        return feedbackTargetId ? <FeedbackTab feedbacks={feedbacks} /> : null;
      case 'reports':
        return canSeeOverview ? <RelatoriosTab /> : null;
      case 'cycles':
        return <EvaluationCyclesTab />;
      case 'evaluated':
        return canManage ? <AvaliadosTab /> : null;
      case 'evaluators':
        return canManage ? <AvaliadoresTab /> : null;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-surface font-body text-ink">
      {/* Header */}
      <div className="border-b border-border bg-surface px-6 py-5">
        <div className="mx-auto flex max-w-7xl items-start justify-between gap-4">
          <h1 className="font-display text-xl font-bold text-ink">
            Avaliação 360°
          </h1>
          {cycle && (
            <p className="mt-0.5 shrink-0 text-sm text-ink-muted">
              Ciclo: <strong className="text-ink">{cycle.name}</strong>
            </p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as TabId)}>
        <div className="border-b border-border bg-surface px-6">
          <TabsList className="mx-auto max-w-7xl gap-0 overflow-x-auto">
            {visibleTabs.map((tab, i) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className={
                    i < visibleTabs.length - 1
                      ? 'gap-2 whitespace-nowrap mr-[1cm]!'
                      : 'gap-2 whitespace-nowrap'
                  }
                >
                  <Icon size={16} strokeWidth={1.75} />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {/* Content */}
        <div className="mx-auto max-w-7xl px-6 py-6">{renderTab()}</div>
      </Tabs>
    </div>
  );
}
