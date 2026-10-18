// components/trainings/ManageTrainingView.tsx
// Workspace de gestão de uma formação — separadores Visão geral, Planeamento,
// Sessões, Participantes, Operação, Avaliação, Custos e Resultados. Mesmo
// padrão de components/leadership/ProgramWorkspace.tsx: uma leitura
// partilhada (findOne) alimenta o cabeçalho/Visão geral, cada separador tem
// o seu próprio ficheiro e as suas próprias mutações.

'use client';

import {
  ArrowLeft,
  CalendarDays,
  Clock,
  GraduationCap,
  UserCheck,
  Users,
} from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { NavyBadge, NavyCard } from '@/components/courses/NavyCard';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { LEVEL_CFG, STATUS_CFG, TYPE_CFG } from './constants';
import { LEVEL_TONE, STATUS_TONE } from './trainingTones';
import { fmtDate, fmtHours } from './utils';
import { SessionsTab } from './manage/SessionsTab';
import { ParticipantsTab } from './manage/ParticipantsTab';
import { OperationTab } from './manage/OperationTab';
import { AssessmentsTab } from './manage/AssessmentsTab';
import { CostsTab } from './manage/CostsTab';
import { ResultsTab } from './manage/ResultsTab';
import { FormadoresTab } from './manage/FormadoresTab';
import { DocumentsTab } from './manage/DocumentsTab';
import { HistoryTab } from './manage/HistoryTab';
import type { Training } from './types';

interface ManageTrainingViewProps {
  trainingId: number;
  onBack: () => void;
}

export function ManageTrainingView({
  trainingId,
  onBack,
}: ManageTrainingViewProps) {
  const { data: training, isLoading } = useApiQuery<Training>(
    queryKeys.trainings.detail(trainingId),
    `/trainings/${trainingId}`,
    { staleTime: STALE_TIME.DYNAMIC },
  );

  return (
    <div>
      <Button intent="ghost" size="sm" onClick={onBack} className="mb-4">
        <ArrowLeft size={14} strokeWidth={1.75} />
        Voltar à gestão
      </Button>

      {isLoading || !training ? (
        <Skeleton
          rows={4}
          wrapperClassName="space-y-3"
          itemClassName="skeleton-shimmer h-16 rounded-card"
        />
      ) : (
        <>
          <div className="mb-5">
            <NavyCard
              seed={training.colorIndex ?? training.id}
              image={training.thumbnailUrl}
              flushFirstInfo
              compact
              kicker={training.category ?? TYPE_CFG[training.type]?.label}
              kickerIcon={GraduationCap}
              title={training.title}
              subtitle={
                training.shortDescription ?? training.thematicArea ?? undefined
              }
              badge={
                <>
                  <NavyBadge tone={STATUS_TONE[training.status]}>
                    {STATUS_CFG[training.status].label}
                  </NavyBadge>
                  <NavyBadge tone={LEVEL_TONE[training.level]}>
                    {LEVEL_CFG[training.level].label}
                  </NavyBadge>
                  <NavyBadge tone="neutral">
                    {TYPE_CFG[training.type]?.label ?? training.type}
                  </NavyBadge>
                  {training.code && (
                    <NavyBadge tone="neutral">{training.code}</NavyBadge>
                  )}
                  {training.requiresApproval && (
                    <NavyBadge tone="warning">
                      Inscrições requerem aprovação
                    </NavyBadge>
                  )}
                </>
              }
              infos={[
                {
                  icon: Clock,
                  value: fmtHours(training.workloadHours),
                  label: 'Carga horária',
                },
                {
                  icon: CalendarDays,
                  value: training.startDate ? fmtDate(training.startDate) : '—',
                  label: training.endDate
                    ? `até ${fmtDate(training.endDate)}`
                    : 'Data de início',
                },
                {
                  icon: Users,
                  value: String(training._count.participants),
                  label: 'Inscritos',
                },
                {
                  icon: UserCheck,
                  value:
                    training.instructor?.fullName ??
                    training.externalInstructor?.name ??
                    'Sem formador',
                  label: training.instructor ? 'Formador' : 'Formador externo',
                },
              ]}
            />
          </div>

          <Tabs defaultValue="sessions">
            <TabsList className="flex-wrap">
              <TabsTrigger value="sessions">Sessões</TabsTrigger>
              <TabsTrigger value="participants">Participantes</TabsTrigger>
              <TabsTrigger value="formadores">Formadores</TabsTrigger>
              <TabsTrigger value="operation">Operação</TabsTrigger>
              <TabsTrigger value="assessments">Avaliação</TabsTrigger>
              <TabsTrigger value="costs">Custos</TabsTrigger>
              <TabsTrigger value="results">Resultados</TabsTrigger>
              <TabsTrigger value="documents">Documentos</TabsTrigger>
              <TabsTrigger value="history">Histórico</TabsTrigger>
            </TabsList>

            <TabsContent value="sessions">
              <SessionsTab training={training} />
            </TabsContent>
            <TabsContent value="participants">
              <ParticipantsTab training={training} />
            </TabsContent>
            <TabsContent value="formadores">
              <FormadoresTab training={training} />
            </TabsContent>
            <TabsContent value="operation">
              <OperationTab training={training} />
            </TabsContent>
            <TabsContent value="assessments">
              <AssessmentsTab training={training} />
            </TabsContent>
            <TabsContent value="costs">
              <CostsTab training={training} />
            </TabsContent>
            <TabsContent value="results">
              <ResultsTab trainingId={training.id} />
            </TabsContent>
            <TabsContent value="documents">
              <DocumentsTab training={training} />
            </TabsContent>
            <TabsContent value="history">
              <HistoryTab trainingId={training.id} />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
