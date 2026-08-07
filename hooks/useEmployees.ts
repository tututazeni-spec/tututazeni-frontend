// hooks/useEmployees.ts
// Extraído de app/(platform)/employees/page.tsx, seguindo o precedente de
// useCurrentUser.ts: fica em hooks/ para poder ser reutilizado por outras
// páginas (ex: um widget de headcount no dashboard) sem reimplementar o fetch.

'use client';

import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from './useApiQuery';
import { queryKeys } from '../lib/queryKeys';
import { STALE_TIME } from '../lib/queryClient';

export type EmployeeStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'TERMINATED' | 'SUSPENDED';
export type SeniorityLevel = 'JUNIOR' | 'MID' | 'SENIOR' | 'LEAD' | 'MANAGER' | 'DIRECTOR' | 'C_LEVEL';
export type WorkMode = 'REMOTE' | 'HYBRID' | 'ON_SITE';
export type ContractType =
  | 'INDEFINITE'
  | 'FIXED_TERM'
  | 'UNCERTAIN_TERM'
  | 'APPRENTICESHIP'
  | 'INTERNSHIP'
  | 'SERVICE_PROVISION'
  | 'TEMPORARY_PLACEMENT'
  | 'PART_TIME';

export interface Employee {
  id: number;
  matricula?: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  role: string;
  jobTitle?: string;
  department?: string;
  location?: string;
  seniority?: SeniorityLevel;
  contractType?: ContractType;
  workMode?: WorkMode;
  status: EmployeeStatus;
  joinedAt: string;
  manager?: { id: number; name: string; avatarUrl?: string };
  _count?: {
    contracts: number;
    feedbacks: number;
    pdis: number;
    employeeSkills: number;
    documents: number;
  };
}

export interface FilterState {
  search: string;
  department: string;
  status: string;
  seniority: string;
  workMode: string;
  contractType: string;
}

export interface HeadcountStats {
  total: number;
  byStatus: Array<{ status: string; _count: number }>;
  byDepartment: Array<{ department: string; _count: number }>;
  recentHires: number;
}

export interface EmployeesListMeta {
  total: number;
  page: number;
  totalPages: number;
}

export function useEmployees(filters: FilterState, page: number) {
  const params = {
    page, limit: 20,
    search: filters.search,
    department: filters.department,
    status: filters.status,
    seniority: filters.seniority,
    workMode: filters.workMode,
    contractType: filters.contractType,
  };
  const q = useApiQuery<{ data: Employee[]; meta: EmployeesListMeta }>(
    queryKeys.employees.list(params), '/employees',
    { params, staleTime: STALE_TIME.DYNAMIC, placeholderData: keepPreviousData },
  );
  return {
    data: q.data ?? null,
    loading: q.isLoading,
    error: q.error?.message ?? null,
    refetch: q.refetch,
  };
}

export function useHeadcount() {
  const q = useApiQuery<HeadcountStats>(
    queryKeys.employees.headcount(), '/employees/headcount',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  return { stats: q.data ?? null, loading: q.isLoading };
}
