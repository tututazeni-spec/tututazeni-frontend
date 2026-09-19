'use client';

// Container: gere dados (useApiQuery/useApiMutation), estado de UI
// (separador/filtros/pesquisa/modais) e liga tudo à vista apresentacional
// em components/live-classes/LiveClassesView.tsx (mesmo padrão que
// components/evaluation360/page.tsx usa para a Evaluation360View). Ver
// memory project_innova_component_separation_audit.
//
// Separador de topo (Visão Geral/Aulas/Calendário/Sessões) adicionado para
// docs/aulas-ao-vivo.md secções 1/2/4/5 — mesmo padrão de
// app/(platform)/trainings/page.tsx (estado local `nav`, sem rota própria
// por separador).

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { apiClient } from '@/lib/apiClient';
import { reportError } from '@/lib/errorReporting';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { ADMIN_ROLES } from '@/lib/roles';
import { useConfirm } from '@/providers/ConfirmProvider';
import { AttendanceView } from '@/components/live-classes/AttendanceView';
import { CalendarView } from '@/components/live-classes/CalendarView';
import { CAN_VIEW_LIVE_CLASSES_REPORTS_ROLES, NAV, type NavId } from '@/components/live-classes/constants';
import { DashboardView } from '@/components/live-classes/DashboardView';
import { EvaluationsView } from '@/components/live-classes/EvaluationsView';
import { InstructorsView } from '@/components/live-classes/InstructorsView';
import { LiveClassesView } from '@/components/live-classes/LiveClassesView';
import { MaterialsView } from '@/components/live-classes/MaterialsView';
import { ParticipantsView } from '@/components/live-classes/ParticipantsView';
import { PostponeModal } from '@/components/live-classes/PostponeModal';
import { RecordingModal } from '@/components/live-classes/RecordingModal';
import { RecordingsView } from '@/components/live-classes/RecordingsView';
import { ReportsView } from '@/components/live-classes/ReportsView';
import { RoomsView } from '@/components/live-classes/RoomsView';
import { SessionsView } from '@/components/live-classes/SessionsView';
import { SettingsView } from '@/components/live-classes/SettingsView';
import { Toast } from '@/components/live-classes/Toast';
import { getStatus } from '@/components/live-classes/utils';
import { CreateLiveClassWizard } from '@/components/live-classes/wizard/CreateLiveClassWizard';
import type { Filters } from '@/components/live-classes/LiveClassesView';
import type { LiveClass, PaginatedClasses } from '@/components/live-classes/types';

const INITIAL_FILTERS: Filters = { page: 1, courseId: '', type: '', status: '', modality: '' };

export default function LivePage() {
  const router = useRouter();
  const role = useCurrentRole();
  const canCreate = !!role && ADMIN_ROLES.includes(role);
  const canViewReports = !!role && CAN_VIEW_LIVE_CLASSES_REPORTS_ROLES.includes(role);
  const visibleNav = NAV.filter(
    (n) => (n.id !== 'settings' || canCreate) && (n.id !== 'reports' && n.id !== 'evaluations' ? true : canViewReports),
  );

  const [nav, setNav] = useState<NavId>('list');
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [viewRecording, setViewRecording] = useState<LiveClass | null>(null);
  const [postponing, setPostponing] = useState<LiveClass | null>(null);
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
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.modality ? { modality: filters.modality } : {}),
  };
  const { data: classesData, isLoading: loading } =
    useApiQuery<PaginatedClasses>(
      queryKeys.liveClasses.list(listParams),
      '/live-classes',
      {
        params: listParams,
        staleTime: STALE_TIME.DYNAMIC,
        placeholderData: keepPreviousData,
        enabled: nav === 'list',
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
  const invalidateKeys = [queryKeys.liveClasses.all];

  const deleteMutation = useApiMutation<void, number>(
    (id) => apiClient.delete(`/live-classes/${id}`),
    { invalidateKeys },
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

  const startMutation = useApiMutation<unknown, number>(
    (id) => apiClient.post(`/live-classes/${id}/start`, {}),
    { invalidateKeys },
  );
  async function startClass(lc: LiveClass) {
    try {
      await startMutation.mutateAsync(lc.id);
      showToast('Aula iniciada.', 'success');
    } catch (e) {
      reportError(e, { source: 'LiveClassesPage.startClass' });
      showToast(e instanceof Error ? e.message : String(e), 'error');
    }
  }

  const cancelMutation = useApiMutation<unknown, number>(
    (id) => apiClient.post(`/live-classes/${id}/cancel`, {}),
    { invalidateKeys },
  );
  async function cancelClass(lc: LiveClass) {
    if (
      !(await confirm({
        title: `Cancelar "${lc.topic}"?`,
        confirmLabel: 'Cancelar aula',
        destructive: true,
      }))
    )
      return;
    try {
      await cancelMutation.mutateAsync(lc.id);
      showToast('Aula cancelada.', 'info');
    } catch (e) {
      reportError(e, { source: 'LiveClassesPage.cancelClass' });
      showToast(e instanceof Error ? e.message : String(e), 'error');
    }
  }

  const duplicateMutation = useApiMutation<unknown, number>(
    (id) => apiClient.post(`/live-classes/${id}/duplicate`, {}),
    { invalidateKeys },
  );
  async function duplicateClass(lc: LiveClass) {
    try {
      await duplicateMutation.mutateAsync(lc.id);
      showToast('Aula duplicada.', 'success');
    } catch (e) {
      reportError(e, { source: 'LiveClassesPage.duplicateClass' });
      showToast(e instanceof Error ? e.message : String(e), 'error');
    }
  }

  // ── Filters ────────────────────────────────────────────────────────────────

  const filtered = classes.filter(
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
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex w-fit flex-wrap gap-1 rounded-xl bg-surface-sunken p-1">
        {visibleNav.map((n) => (
          <button
            key={n.id}
            onClick={() => setNav(n.id)}
            className={`rounded-lg px-4 py-2 font-body text-sm font-medium transition-colors ${
              nav === n.id ? 'bg-surface text-ink shadow-resting' : 'text-ink-muted hover:text-ink'
            }`}
          >
            {n.label}
          </button>
        ))}
      </div>

      {nav === 'dashboard' && <DashboardView />}
      {nav === 'calendar' && <CalendarView />}
      {nav === 'sessions' && <SessionsView canManage={canCreate} />}
      {nav === 'participants' && <ParticipantsView canManage={canCreate} />}
      {nav === 'instructors' && <InstructorsView />}
      {nav === 'rooms' && <RoomsView canManage={canCreate} />}
      {nav === 'recordings' && <RecordingsView canManage={canCreate} />}
      {nav === 'attendance' && <AttendanceView canManage={canCreate} />}
      {nav === 'materials' && <MaterialsView canManage={canCreate} />}
      {nav === 'evaluations' && canViewReports && <EvaluationsView />}
      {nav === 'reports' && canViewReports && <ReportsView />}
      {nav === 'settings' && canCreate && <SettingsView />}
      {nav === 'list' && (
        <>
          <LiveClassesView
            filters={filters}
            onFiltersChange={updateFilters}
            onGoToPage={goToPage}
            search={search}
            onSearchChange={setSearch}
            loading={loading}
            filtered={filtered}
            total={total}
            totalPages={totalPages}
            recordingsCount={recordings.length}
            upcoming={upcoming}
            liveNow={liveNow}
            upcomingCount={upcomingCount}
            canCreate={canCreate}
            onOpen={(id) => router.push(`/live-classes/${id}`)}
            onCreateNew={() => setShowCreate(true)}
            onViewRecording={setViewRecording}
            onDelete={deleteClass}
            onStart={startClass}
            onPostpone={setPostponing}
            onCancel={cancelClass}
            onDuplicate={duplicateClass}
          />

          {/* ── Modals ── */}
          {showCreate && <CreateLiveClassWizard onClose={() => setShowCreate(false)} />}
          {viewRecording && (
            <RecordingModal lc={viewRecording} onClose={() => setViewRecording(null)} />
          )}
          {postponing && <PostponeModal lc={postponing} onClose={() => setPostponing(null)} />}
          {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
        </>
      )}
    </div>
  );
}
