// components/trainings/ManageTrainingView.tsx
// Workspace de gestão de uma formação — separadores Visão geral, Planeamento,
// Sessões, Participantes, Operação, Avaliação, Custos e Resultados. Mesmo
// padrão de components/leadership/ProgramWorkspace.tsx: uma leitura
// partilhada (findOne) alimenta o cabeçalho/Visão geral, cada separador tem
// o seu próprio ficheiro e as suas próprias mutações.

'use client';

import { ArrowLeft } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { LEVEL_CFG, TYPE_CFG } from './constants';
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
          <Card className="mb-5 p-5">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <h2 className="font-display text-lg font-semibold text-ink">
                {training.title}
              </h2>
              <StatusBadge value={training.level} map={LEVEL_CFG} />
              <span
                className={`rounded px-2 py-0.5 font-body text-xs font-medium ${TYPE_CFG[training.type]?.cls}`}
              >
                {TYPE_CFG[training.type]?.label}
              </span>
              {training.code && (
                <span className="font-body text-xs text-ink-faint">
                  {training.code}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-4 font-body text-xs text-ink-faint">
              <span>{fmtHours(training.workloadHours)}</span>
              {training.startDate && (
                <span>
                  {fmtDate(training.startDate)}
                  {training.endDate ? ` – ${fmtDate(training.endDate)}` : ''}
                </span>
              )}
              <span>{training._count.participants} inscritos</span>
              {training.instructor && (
                <span>Formador: {training.instructor.fullName}</span>
              )}
              {!training.instructor && training.externalInstructor && (
                <span>
                  Formador externo: {training.externalInstructor.name}
                </span>
              )}
              {training.requiresApproval && (
                <span className="text-warning-ink">
                  Inscrições requerem aprovação
                </span>
              )}
            </div>
          </Card>

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
