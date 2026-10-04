// hooks/useLeave.ts
// Hooks de dados do módulo de gestão de ausências — extraídos de
// app/(platform)/leave/page.tsx para o directório hooks/ (mesma convenção
// de hooks/useEmployees.ts, hooks/usePayslipDetail.ts, ...). Puramente
// dados (useApiQuery); a apresentação vive em components/leave/.

import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from './useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import type {
  AbsenceCalendarData,
  AbsenceDetail,
  AbsenceHistory,
  AbsencesResponse,
  ApprovalListStatus,
  ApprovalsResponse,
  ApproverCandidate,
  DelegationRow,
  HolidaysResponse,
  SettingsHistoryEntry,
  SettingsOverview,
  CalendarView,
  LeaveRequest,
  LeaveType,
  LicensesResponse,
  OverviewData,
  LeaveReportKind,
  OverviewFilters,
  PlanningData,
  ReportCatalogItem,
  ReportResult,
  VacationsResponse,
} from '@/components/leave/types';

export function useLeaveTypes() {
  // Catálogo quase imutável → cache longa (STATIC).
  const q = useApiQuery<LeaveType[]>(queryKeys.leave.types(), '/leave/types', {
    staleTime: STALE_TIME.STATIC,
  });
  return q.data ?? [];
}

/**
 * @param enabled - GET /leave/pending-approvals exige @Roles(ADMIN, RH,
 * GESTOR) no backend; páginas que a montam para todas as roles passam
 * `false` para um COLABORADOR, ou o pedido rebenta sempre com 403.
 */
export function usePendingApprovals(enabled = true) {
  // Fila de aprovações → polling de 60s.
  const q = useApiQuery<LeaveRequest[]>(
    queryKeys.leave.pendingApprovals(),
    '/leave/pending-approvals',
    { staleTime: STALE_TIME.DYNAMIC, refetchInterval: 60_000, enabled },
  );
  return { data: q.data ?? [], loading: q.isLoading, refetch: q.refetch };
}

/** Só envia ao backend os filtros preenchidos. */
function compact(params: Record<string, string | number | undefined>) {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== undefined),
  );
}

/** GET /leave/overview — o âmbito (próprio/equipa/organização) vem do backend. */
export function useLeaveOverview(filters: OverviewFilters) {
  const params = compact({ ...filters });
  const q = useApiQuery<OverviewData>(
    queryKeys.leave.overview(params),
    '/leave/overview',
    {
      params,
      staleTime: STALE_TIME.DYNAMIC,
      placeholderData: keepPreviousData,
    },
  );
  return { data: q.data ?? null, loading: q.isLoading, refetch: q.refetch };
}

export interface VacationFilters {
  year: number;
  unitId: string;
  departmentId: string;
  search: string;
  planState: string;
  page: number;
}

/** GET /leave/vacations — tabela de saldos/plano anual de férias. */
export function useVacations(filters: VacationFilters) {
  const params = compact({ ...filters, limit: 20 });
  const q = useApiQuery<VacationsResponse>(
    queryKeys.leave.vacations(params),
    '/leave/vacations',
    {
      params,
      staleTime: STALE_TIME.DYNAMIC,
      placeholderData: keepPreviousData,
    },
  );
  return { data: q.data ?? null, loading: q.isLoading, refetch: q.refetch };
}

export interface LicenseFilters {
  leaveTypeCode: string;
  phase: string;
  departmentId: string;
  unitId: string;
  from: string;
  to: string;
  search: string;
  page: number;
}

/** GET /leave/licenses — o âmbito e a privacidade (motivo/comprovativos) vêm do backend. */
export function useLicenses(filters: LicenseFilters) {
  const params = compact({ ...filters, limit: 20 });
  const q = useApiQuery<LicensesResponse>(
    queryKeys.leave.licenses(params),
    '/leave/licenses',
    {
      params,
      staleTime: STALE_TIME.DYNAMIC,
      placeholderData: keepPreviousData,
    },
  );
  return { data: q.data ?? null, loading: q.isLoading, refetch: q.refetch };
}

export interface AbsenceFilters {
  occurrenceType: string;
  justificationStatus: string;
  source: string;
  departmentId: string;
  unitId: string;
  from: string;
  to: string;
  search: string;
  page: number;
}

/** GET /leave/absences — ocorrências do âmbito do perfil. */
export function useAbsences(filters: AbsenceFilters) {
  const params = compact({ ...filters, limit: 20 });
  const q = useApiQuery<AbsencesResponse>(
    queryKeys.leave.absences(params),
    '/leave/absences',
    {
      params,
      staleTime: STALE_TIME.DYNAMIC,
      placeholderData: keepPreviousData,
    },
  );
  return { data: q.data ?? null, loading: q.isLoading, refetch: q.refetch };
}

export function useAbsenceDetail(id: number | null) {
  const q = useApiQuery<AbsenceDetail>(
    queryKeys.leave.absence(id ?? 0),
    `/leave/absences/${id}`,
    { staleTime: STALE_TIME.DYNAMIC, enabled: id !== null },
  );
  return { data: q.data ?? null, loading: q.isLoading };
}

export function useAbsenceHistory(userId: number | null) {
  const q = useApiQuery<AbsenceHistory>(
    queryKeys.leave.absenceHistory(userId ?? 0),
    `/leave/absences/history/${userId}`,
    { staleTime: STALE_TIME.DYNAMIC, enabled: userId !== null },
  );
  return { data: q.data ?? null, loading: q.isLoading };
}

export interface CalendarFilters {
  view: CalendarView;
  date: string;
  unitId: string;
  departmentId: string;
  managerId: string;
  userId: string;
  leaveTypeCode: string;
}

/** GET /leave/absence-calendar — entradas, cobertura e sobreposições do período. */
export function useAbsenceCalendar(filters: CalendarFilters) {
  const params = compact({ ...filters });
  const q = useApiQuery<AbsenceCalendarData>(
    queryKeys.leave.absenceCalendar(params),
    '/leave/absence-calendar',
    {
      params,
      staleTime: STALE_TIME.DYNAMIC,
      placeholderData: keepPreviousData,
    },
  );
  return { data: q.data ?? null, loading: q.isLoading };
}

export interface ApprovalFilters {
  status: ApprovalListStatus;
  stage: string;
  leaveTypeCode: string;
  search: string;
  page: number;
}

/** GET /leave/approvals — etapas de aprovação (fila e histórico). Só ADMIN/RH/GESTOR. */
export function useApprovals(filters: ApprovalFilters, enabled = true) {
  const params = compact({ ...filters, limit: 20 });
  const q = useApiQuery<ApprovalsResponse>(
    queryKeys.leave.approvals(params),
    '/leave/approvals',
    {
      params,
      staleTime: STALE_TIME.DYNAMIC,
      refetchInterval: 60_000,
      placeholderData: keepPreviousData,
      enabled,
    },
  );
  return { data: q.data ?? null, loading: q.isLoading, refetch: q.refetch };
}

export function useApproverCandidates(search: string, enabled: boolean) {
  const params = compact({ search });
  const q = useApiQuery<ApproverCandidate[]>(
    queryKeys.leave.approverCandidates(search),
    '/leave/approvals/candidates',
    { params, staleTime: STALE_TIME.SEMI_STATIC, enabled },
  );
  return q.data ?? [];
}

export interface PlanningFilters {
  from: string;
  to: string;
  unitId: string;
  departmentId: string;
}

/** GET /leave/planning — disponibilidade, cobertura e conflitos por equipa. */
export function usePlanning(filters: PlanningFilters) {
  const params = compact({ ...filters });
  const q = useApiQuery<PlanningData>(
    queryKeys.leave.planning(params),
    '/leave/planning',
    {
      params,
      staleTime: STALE_TIME.DYNAMIC,
      placeholderData: keepPreviousData,
    },
  );
  return { data: q.data ?? null, loading: q.isLoading };
}

export function useReportCatalog() {
  const q = useApiQuery<ReportCatalogItem[]>(
    queryKeys.leave.reportCatalog(),
    '/leave/reports',
    { staleTime: STALE_TIME.STATIC },
  );
  return q.data ?? [];
}

export interface ReportFilters {
  year: number;
  from: string;
  to: string;
  departmentId: string;
  unitId: string;
  leaveTypeCode: string;
  includeCodes: string;
}

/** GET /leave/reports/:kind — corre um relatório (ADMIN/RH). */
export function useLeaveReport(kind: LeaveReportKind, filters: ReportFilters) {
  const params = compact({ ...filters });
  const q = useApiQuery<ReportResult>(
    queryKeys.leave.report(kind, params),
    `/leave/reports/${kind}`,
    {
      params,
      staleTime: STALE_TIME.DYNAMIC,
      placeholderData: keepPreviousData,
    },
  );
  return { data: q.data ?? null, loading: q.isLoading };
}

// ─── §10 Configurações ──────────────────────────────────────────────────────

/** GET /leave/settings — só ADMIN/RH. */
export function useLeaveSettings(enabled: boolean) {
  const q = useApiQuery<SettingsOverview>(
    queryKeys.leave.settings(),
    '/leave/settings',
    { staleTime: STALE_TIME.DYNAMIC, enabled },
  );
  return { data: q.data ?? null, loading: q.isLoading, error: q.error };
}

export function useSettingsHistory(enabled: boolean) {
  const q = useApiQuery<SettingsHistoryEntry[]>(
    queryKeys.leave.settingsHistory(),
    '/leave/settings/history',
    { params: { limit: 50 }, staleTime: STALE_TIME.DYNAMIC, enabled },
  );
  return { data: q.data ?? [], loading: q.isLoading };
}

export function useHolidays(year: number, location: string, enabled: boolean) {
  const params = compact({ year, location });
  const q = useApiQuery<HolidaysResponse>(
    queryKeys.leave.holidays(params),
    '/leave/settings/holidays',
    {
      params,
      staleTime: STALE_TIME.DYNAMIC,
      placeholderData: keepPreviousData,
      enabled,
    },
  );
  return { data: q.data ?? null, loading: q.isLoading };
}

export function useHolidayLocations(enabled: boolean) {
  const q = useApiQuery<string[]>(
    queryKeys.leave.holidayLocations(),
    '/leave/settings/locations',
    { staleTime: STALE_TIME.SEMI_STATIC, enabled },
  );
  return q.data ?? [];
}

/** GET /leave/settings/delegations — as minhas; `all` (ADMIN/RH) inclui inactivas. */
export function useDelegations(all: boolean) {
  const q = useApiQuery<DelegationRow[]>(
    queryKeys.leave.delegations(all),
    '/leave/settings/delegations',
    { params: all ? { all: 'true' } : undefined, staleTime: STALE_TIME.DYNAMIC },
  );
  return { data: q.data ?? [], loading: q.isLoading };
}
