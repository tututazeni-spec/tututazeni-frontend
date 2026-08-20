'use client';

// Container: gere dados (useApiQuery/useApiMutation), estado de UI
// (separador/filtros/pesquisa/modais) e liga tudo à vista apresentacional
// em components/live-classes/LiveClassesView.tsx (mesmo padrão que
// components/evaluation360/page.tsx usa para a Evaluation360View). Ver
// memory project_innova_component_separation_audit.

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { reportError } from '@/lib/errorReporting';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useConfirm } from '@/providers/ConfirmProvider';
import { LiveClassesView } from '@/components/live-classes/LiveClassesView';
import { RecordingModal } from '@/components/live-classes/RecordingModal';
import { Toast } from '@/components/live-classes/Toast';
import { getStatus } from '@/components/live-classes/utils';
import type {
  Filters,
  MainTab,
} from '@/components/live-classes/LiveClassesView';
import type {
  LiveClass,
  PaginatedClasses,
} from '@/components/live-classes/types';

const INITIAL_FILTERS: Filters = { page: 1, courseId: '' };

export default function LivePage() {
  const router = useRouter();
  const [tab, setTab] = useState<MainTab>('live');
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [search, setSearch] = useState('');
  const [viewRecording, setViewRecording] = useState<LiveClass | null>(null);
  const [toast, setToast] = useState<{
    msg: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  function updateFilters(patch: Partial<Omit<Filters, 'page'>>) {
    setFilters((f) => ({ ...f, ...patch, page: 1 }));
  }
  function goToPage(delta: number) {
    setFilters((f) => ({ ...f, page: f.page + delta }));
  }

  const showToast = (msg: string, type: 'success' | 'error' | 'info') =>
    setToast({ msg, type });

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const listParams = {
    page: filters.page,
    limit: 12,
    ...(filters.courseId ? { courseId: filters.courseId } : {}),
  };
  const { data: classesData, isLoading: loading } =
    useApiQuery<PaginatedClasses>(
      queryKeys.liveClasses.list(listParams),
      '/live-classes',
      {
        params: listParams,
        staleTime: STALE_TIME.DYNAMIC,
        placeholderData: keepPreviousData,
      },
    );
  const classes = classesData?.data ?? [];
  const total = classesData?.total ?? 0;
  const totalPages = classesData?.totalPages ?? 1;
  // Nota: só reflecte gravações da página actual, tal como o comportamento original.
  const recordings = classes.filter((lc) => lc.recordingUrl);

  const { data: upcoming = [] } = useApiQuery<LiveClass[]>(
    queryKeys.liveClasses.upcoming(),
    '/live-classes/upcoming',
    { staleTime: STALE_TIME.DYNAMIC, refetchInterval: 30_000 },
  );

  // ── Handlers ────────────────────────────────────────────────────────────────

  const confirm = useConfirm();
  const deleteMutation = useApiMutation<void, number>(
    (id) => apiClient.delete(`/live-classes/${id}`),
    { invalidateKeys: [queryKeys.liveClasses.all] },
  );
  async function deleteClass(lc: LiveClass) {
    if (
      !(await confirm({
        title: `Eliminar "${lc.topic}"?`,
        confirmLabel: 'Eliminar',
        destructive: true,
      }))
    )
      return;
    try {
      await deleteMutation.mutateAsync(lc.id);
      showToast('Aula eliminada.', 'info');
    } catch (e) {
      reportError(e, { source: 'LiveClassesPage.deleteLiveClass' });
      showToast(e instanceof Error ? e.message : String(e), 'error');
    }
  }

  // ── Filters ────────────────────────────────────────────────────────────────

  const filtered =
    tab === 'recordings'
      ? recordings.filter(
          (lc) =>
            !search ||
            lc.topic.toLowerCase().includes(search.toLowerCase()) ||
            lc.course?.title?.toLowerCase().includes(search.toLowerCase()),
        )
      : classes.filter(
          (lc) =>
            !search ||
            lc.topic.toLowerCase().includes(search.toLowerCase()) ||
            lc.course?.title?.toLowerCase().includes(search.toLowerCase()),
        );

  const liveNow = upcoming.filter(
    (lc) => getStatus(lc.scheduledAt, lc.duration) === 'live',
  ).length;
  const upcomingCount = upcoming.filter(
    (lc) => getStatus(lc.scheduledAt, lc.duration) === 'upcoming',
  ).length;

  return (
    <>
      <LiveClassesView
        tab={tab}
        onTabChange={setTab}
        filters={filters}
        onFiltersChange={updateFilters}
        onGoToPage={goToPage}
        search={search}
        onSearchChange={setSearch}
        loading={loading}
        filtered={filtered}
        total={total}
        totalPages={totalPages}
        recordings={recordings}
        upcoming={upcoming}
        liveNow={liveNow}
        upcomingCount={upcomingCount}
        onOpen={(id) => router.push(`/live/${id}`)}
        onCreateNew={() => router.push('/live/create')}
        onViewRecording={setViewRecording}
        onDelete={deleteClass}
      />

      {/* ── Modals ── */}
      {viewRecording && (
        <RecordingModal
          lc={viewRecording}
          onClose={() => setViewRecording(null)}
        />
      )}
      {toast && (
        <Toast
          msg={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
