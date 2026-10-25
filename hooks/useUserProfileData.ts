// hooks/useUserProfileData.ts
// Dados dos separadores do Perfil do Colaborador (docs/modulo_users.md Ponto
// 3) que não são «Resumo»/«Cursos» (esses vêm de hooks/useUserProfile.ts).
// Extraído de components/users/ProfileTabs.tsx, onde cada separador misturava
// o fetch com a tabela.
//
// Por regra de arquitectura do módulo (docs/modulo_users.md, secção final),
// cada hook chama o endpoint do módulo DONO do dado, filtrado por userId —
// nunca duplica essa leitura dentro de Users. Cada hook só é montado (e
// portanto o pedido só é feito) quando o separador correspondente está activo.

'use client';

import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useApiQuery } from './useApiQuery';
import type { EvalResults } from '@/components/evaluation/types';
import type {
  AccessOverview,
  AttendanceResponse,
  CareerProfile,
  DevelopmentPlansResponse,
  DocumentsResponse,
  LeaveBalanceEntry,
  LeaveRequestsResponse,
  TeamResponse,
  TrainingParticipation,
  UserActivityStats,
  UserCompetencyEntry,
  UserEnrollmentsResponse,
  UserEval360CycleEntry,
  UserTimelineResponse,
} from '@/components/users/types';

/** O que as vistas precisam de uma query: os dados e se ainda carrega. */
export interface QueryData<T> {
  data: T | undefined;
  isLoading: boolean;
}

const DYNAMIC = { staleTime: STALE_TIME.DYNAMIC };

function select<T>(q: QueryData<T>): QueryData<T> {
  return { data: q.data, isLoading: q.isLoading };
}

export function useUserTeam(managerId: number) {
  return select(
    useApiQuery<TeamResponse>(
      queryKeys.users.team(managerId),
      `/users/${managerId}/team`,
      DYNAMIC,
    ),
  );
}

export function useUserAccess(userId: number) {
  return select(
    useApiQuery<AccessOverview>(
      queryKeys.users.access(userId),
      `/users/${userId}/access`,
      DYNAMIC,
    ),
  );
}

export function useUserTraining(userId: number) {
  return select(
    useApiQuery<TrainingParticipation[]>(
      queryKeys.trainings.byUser(userId),
      `/trainings/user/${userId}`,
      DYNAMIC,
    ),
  );
}

export function useUserCourses(userId: number) {
  return select(
    useApiQuery<UserEnrollmentsResponse>(
      queryKeys.enrollments.byUser(userId),
      `/enrollments/users/${userId}`,
      DYNAMIC,
    ),
  );
}

export function useUserCompetencies(userId: number) {
  return select(
    useApiQuery<UserCompetencyEntry[]>(
      queryKeys.competencies.byUser(userId),
      `/competencies/user/${userId}`,
      DYNAMIC,
    ),
  );
}

export function useUserPerformance(userId: number) {
  return select(
    useApiQuery<EvalResults>(
      queryKeys.evaluation.results(userId),
      `/evaluations/results/${userId}`,
      DYNAMIC,
    ),
  );
}

export function useUserEvaluations(userId: number) {
  return select(
    useApiQuery<UserEval360CycleEntry[]>(
      queryKeys.evaluation360.userCycles(String(userId)),
      `/evaluation360/user/${userId}/cycles`,
      DYNAMIC,
    ),
  );
}

export function useUserPdi(userId: number) {
  return select(
    useApiQuery<DevelopmentPlansResponse>(
      queryKeys.developmentPlans.byUser(userId),
      '/development-plans',
      { params: { userId }, ...DYNAMIC },
    ),
  );
}

export function useUserCareer(userId: number) {
  return select(
    useApiQuery<CareerProfile>(
      queryKeys.career.profileByUser(userId),
      `/career/users/${userId}/profile`,
      DYNAMIC,
    ),
  );
}

export function useUserDocuments(userId: number) {
  return select(
    useApiQuery<DocumentsResponse>(
      queryKeys.documents.byOwner(userId),
      '/documents',
      { params: { ownerId: userId }, ...DYNAMIC },
    ),
  );
}

/** Pedidos e saldos de férias/licenças: carrega-se enquanto qualquer um falta. */
export function useUserLeave(userId: number) {
  const requests = useApiQuery<LeaveRequestsResponse>(
    queryKeys.leave.byUser(userId),
    '/leave',
    { params: { userId }, ...DYNAMIC },
  );
  const balance = useApiQuery<LeaveBalanceEntry[]>(
    queryKeys.leave.balanceByUser(userId),
    `/leave/balance/${userId}`,
    DYNAMIC,
  );
  return {
    requests: requests.data,
    balance: balance.data,
    isLoading: requests.isLoading || balance.isLoading,
  };
}

export function useUserAttendance(userId: number) {
  return select(
    useApiQuery<AttendanceResponse>(
      queryKeys.attendance.byUser(userId),
      `/attendance/user/${userId}`,
      DYNAMIC,
    ),
  );
}

export function useUserHistory(userId: number) {
  return select(
    useApiQuery<UserTimelineResponse>(
      queryKeys.history.timelineByUser(userId),
      `/history/timeline/user/${userId}`,
      DYNAMIC,
    ),
  );
}

export function useUserActivity(userId: number) {
  return select(
    useApiQuery<UserActivityStats>(
      queryKeys.history.statsByUser(userId),
      `/history/stats/user/${userId}`,
      DYNAMIC,
    ),
  );
}
