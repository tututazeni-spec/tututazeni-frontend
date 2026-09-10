// components/leadership/ProgramWorkspace.tsx
// Workspace de gestão de um programa de liderança (spec § "Interface"):
// separadores Visão Geral, Participantes, Mentores & Coaches, Projetos de
// Liderança, Avaliações, Resultados e Configurações. Uma leitura partilhada
// do detalhe do programa alimenta a maioria dos separadores; cada mutação
// invalida só a key afectada.

'use client';

import { ArrowLeft } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Button } from '@/components/ui/Button';
import { QueryError } from '@/components/ui/QueryError';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { LEVEL_CFG } from './constants';
import { AdvisorsView } from './AdvisorsView';
import { AssessmentsView } from './AssessmentsView';
import { ParticipantsView } from './ParticipantsView';
import { ProjectsView } from './ProjectsView';
import { ResultsView } from './ResultsView';
import { SettingsView } from './SettingsView';
import type { LeadershipProgramDetail, ProgramLevel } from './types';

const TABS = [
  { id: 'overview', label: 'Visão Geral' },
  { id: 'participants', label: 'Participantes' },
  { id: 'advisors', label: 'Mentores & Coaches' },
  { id: 'projects', label: 'Projetos de Liderança' },
  { id: 'assessments', label: 'Avaliações' },
  { id: 'results', label: 'Resultados' },
  { id: 'settings', label: 'Configurações' },
] as const;

export interface ProgramWorkspaceProps {
  programId: number;
  canManage: boolean;
  onBack: () => void;
}

export function ProgramWorkspace({ programId, canManage, onBack }: ProgramWorkspaceProps) {
  const { data, isLoading, error, refetch } = useApiQuery<LeadershipProgramDetail>(
    queryKeys.leadership.programDetail(programId),
    `/leadership/programs/${programId}`,
    { staleTime: STALE_TIME.DYNAMIC },
  );

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1 font-body text-sm text-ink-muted hover:text-ink"
      >
        <ArrowLeft size={14} strokeWidth={1.75} /> Voltar aos programas
      </button>

      {isLoading && <Skeleton />}
      {error && <QueryError error={error} onRetry={refetch} />}

      {data && (
        <>
          <div className="mb-5 flex items-center gap-3">
            <h2 className="font-display text-lg font-semibold text-ink">{data.name}</h2>
            <StatusBadge value={data.level as ProgramLevel} map={LEVEL_CFG} />
            <span className="font-body text-xs text-ink-faint">{data.code}</span>
          </div>

          <Tabs defaultValue="overview">
            <TabsList className="flex-wrap">
              {TABS.map((t) => (
                <TabsTrigger key={t.id} value={t.id}>
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="overview">
              <OverviewTab detail={data} />
            </TabsContent>
            <TabsContent value="participants">
              <ParticipantsView programId={programId} detail={data} canManage={canManage} />
            </TabsContent>
            <TabsContent value="advisors">
              <AdvisorsView programId={programId} detail={data} canManage={canManage} />
            </TabsContent>
            <TabsContent value="projects">
              <ProjectsView programId={programId} detail={data} canManage={canManage} />
            </TabsContent>
            <TabsContent value="assessments">
              <AssessmentsView programId={programId} detail={data} canManage={canManage} />
            </TabsContent>
            <TabsContent value="results">
              <ResultsView programId={programId} />
            </TabsContent>
            <TabsContent value="settings">
              <SettingsView detail={data} />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}

function OverviewTab({ detail }: { detail: LeadershipProgramDetail }) {
  const rows: Array<[string, string]> = [
    ['Estado', detail.status],
    ['Tipo', detail.type ?? '—'],
    ['Nível corporativo', detail.corporateLevel ?? '—'],
    ['Participantes', String(detail.participants.length)],
    ['Duração', detail.durationWeeks ? `${detail.durationWeeks} semanas` : '—'],
    ['Carga horária', detail.workloadHours ? `${detail.workloadHours} h` : '—'],
    ['Modalidade', detail.modality ?? '—'],
    ['Certificação', detail.certificationEnabled ? 'Ativa' : 'Inativa'],
  ];
  return (
    <div className="space-y-4">
      {detail.objective && (
        <p className="font-body text-sm text-ink-muted">{detail.objective}</p>
      )}
      <dl className="grid grid-cols-2 gap-x-6 gap-y-2 font-body text-sm md:grid-cols-4">
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt className="text-ink-faint">{k}</dt>
            <dd className="text-ink">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
