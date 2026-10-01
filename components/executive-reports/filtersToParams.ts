// components/executive-reports/filtersToParams.ts
// Converte os filtros globais em query params (omite o que não se aplica).

import type { ExecutiveFilters } from './dashboardTypes';

export function filtersToParams(
  f: ExecutiveFilters,
): Record<string, string | number> {
  const p: Record<string, string | number> = {
    period: f.period,
    compareWith: f.compareWith,
  };
  if (f.period === 'custom' && f.dateFrom && f.dateTo) {
    p.dateFrom = f.dateFrom;
    p.dateTo = f.dateTo;
  }
  if (f.unitId) p.unitId = f.unitId;
  if (f.departmentId) p.departmentId = f.departmentId;
  if (f.positionId) p.positionId = f.positionId;
  if (f.contractType) p.contractType = f.contractType;
  if (f.courseId) p.courseId = f.courseId;
  if (f.kpiState) p.kpiState = f.kpiState;
  return p;
}
