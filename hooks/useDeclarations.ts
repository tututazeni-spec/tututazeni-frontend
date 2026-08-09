// hooks/useDeclarations.ts
// Hook de dados do módulo de declarações — as 8 queries que antes viviam
// soltas dentro de app/(platform)/declarations/page.tsx, agrupadas num só
// hook (mesma convenção de hooks/useEmployees.ts). Devolve também
// `refetchAll`, usado pelo botão "Actualizar" e por onSuccess dos modais.

import { useApiQuery } from './useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import type {
  DashboardData,
  DocRequest,
  Purpose,
  Template,
  WorkDashboard,
  WorkForm,
  WorkSubmission,
} from '@/components/declarations/types';

export function useDeclarationsData() {
  const templatesQuery = useApiQuery<Template[]>(
    queryKeys.declarations.templates(),
    '/declarations/documents/templates',
    { staleTime: STALE_TIME.STATIC },
  );
  const purposesQuery = useApiQuery<Purpose[]>(
    queryKeys.declarations.purposes(),
    '/declarations/documents/purposes',
    { staleTime: STALE_TIME.STATIC },
  );
  const myDocsQuery = useApiQuery<{ data: DocRequest[] }>(
    queryKeys.declarations.myDocs(),
    '/declarations/documents/my',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const allDocsQuery = useApiQuery<{ data: DocRequest[] }>(
    queryKeys.declarations.allDocs(),
    '/declarations/documents',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const pendingWorkQuery = useApiQuery<{ pending: WorkForm[]; total: number }>(
    queryKeys.declarations.workPending(),
    '/declarations/work/my/pending',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const workSubsQuery = useApiQuery<{ data: WorkSubmission[] }>(
    queryKeys.declarations.workSubmissions(),
    '/declarations/work/my/submissions',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const docDashQuery = useApiQuery<DashboardData>(
    queryKeys.declarations.docDashboard(),
    '/declarations/documents/dashboard',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const workDashQuery = useApiQuery<WorkDashboard>(
    queryKeys.declarations.workDashboard(),
    '/declarations/work/dashboard',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  const queries = [
    templatesQuery,
    purposesQuery,
    myDocsQuery,
    allDocsQuery,
    pendingWorkQuery,
    workSubsQuery,
    docDashQuery,
    workDashQuery,
  ];

  return {
    templates: templatesQuery.data ?? [],
    purposes: purposesQuery.data ?? [],
    myDocs: myDocsQuery.data ?? null,
    allDocs: allDocsQuery.data ?? null,
    pendingWork: pendingWorkQuery.data ?? null,
    workSubs: workSubsQuery.data ?? null,
    docDash: docDashQuery.data ?? null,
    workDash: workDashQuery.data ?? null,
    loading: templatesQuery.isFetching || myDocsQuery.isFetching,
    refetchAll: () => queries.forEach((q) => q.refetch()),
  };
}
