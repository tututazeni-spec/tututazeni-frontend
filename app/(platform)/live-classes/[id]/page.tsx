'use client';
// Container: gere o carregamento da aula, o estado de sessão (joined/
// sidebar/timer) e compõe a sala Jitsi + painel de gravação. Ver memory
// project_innova_component_separation_audit.

import { useCallback, useState } from 'react';
import {
  XCircle,
  ArrowLeft,
  BookOpen,
  Clapperboard,
  Video,
  CalendarDays,
  Clock,
  Hourglass,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useHasRole } from '@/hooks/useCurrentRole';
import { useStopwatch } from '@/hooks/useStopwatch';
import { apiClient } from '@/lib/apiClient';
import { reportError } from '@/lib/errorReporting';
import { notify } from '@/lib/errorToastBridge';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate as fmtDate, formatTime as fmtTime } from '@/lib/format';
import { ADMIN_ROLES } from '@/lib/roles';
import { JitsiRoom } from '@/components/live-classes/room/JitsiRoom';
import { RecordingPanel } from '@/components/live-classes/room/RecordingPanel';
import { fmtDuration } from '@/components/live-classes/room/utils';
import type { LiveClass } from '@/components/live-classes/room/types';
import { safeHref } from '@/lib/safeHref';
import { Button } from '@/components/ui/Button';

export default function LiveRoomPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const classId = parseInt(params.id);
  // PUT /live-classes/:id (usado para guardar a URL da gravação) é
  // @Roles(ADMIN, RH) no backend — colaborador só encontra/entra em aulas,
  // não gere a gravação.
  const canManageRecording = useHasRole(ADMIN_ROLES);

  const queryClient = useQueryClient();
  const {
    data: liveClass,
    isLoading: loading,
    isError,
    error: queryError,
  } = useApiQuery<LiveClass>(
    queryKeys.liveClasses.detail(classId),
    `/live-classes/${classId}`,
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const [joined, setJoined] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const {
    seconds: sessionTime,
    start: startSessionTimer,
    stop: stopSessionTimer,
  } = useStopwatch();

  // `handleJoined`/`handleLeft` estabilizados com useCallback: são passados a
  // JitsiRoom, cujo initJitsi (também useCallback) depende deles — sem
  // identidade estável aqui, o Jitsi seria reinicializado a cada render.
  const handleJoined = useCallback(async () => {
    setJoined(true);
    try {
      await apiClient.post(`/live-classes/${classId}/join`, {});
    } catch (e) {
      reportError(e, { source: 'LiveRoomPage.handleJoined' });
      notify({
        title: 'A sua presença pode não ter sido registada',
        description: 'Continua na aula. Se necessário, volte a entrar.',
        intent: 'danger',
      });
    }
    startSessionTimer();
  }, [classId, startSessionTimer]);

  const handleLeft = useCallback(async () => {
    stopSessionTimer();
    try {
      await apiClient.post(`/live-classes/${classId}/leave`, {});
    } catch (e) {
      reportError(e, { source: 'LiveRoomPage.handleLeft' });
    }
    router.push('/live-classes');
  }, [classId, stopSessionTimer, router]);

  // Loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen flex-col gap-4 bg-slate-900">
        {/* fundo escuro intencional: overlay de carregamento da sala Jitsi */}
        <style>{`@keyframes lc-spin{to{transform:rotate(360deg)}}@keyframes lc-ping{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(1.5)}}`}</style>
        <div
          className="w-9 h-9 rounded-full border-3 border-white/10"
          style={{
            borderTopColor: 'var(--color-danger)',
            animation: 'lc-spin 0.8s linear infinite',
          }}
        />
        <p className="text-canvas m-0 text-sm opacity-50">
          A preparar a sala...
        </p>
      </div>
    );
  }

  if (isError || !liveClass) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 flex-col gap-3">
        {/* fundo escuro intencional: overlay de carregamento da sala Jitsi */}
        <p className="inline-flex items-center gap-1.5 text-danger-ink text-base">
          <XCircle size={18} strokeWidth={1.75} />{' '}
          {queryError?.message || 'Aula não encontrada'}
        </p>
        <Button intent="danger" onClick={() => router.push('/live-classes')}>
          ← Voltar
        </Button>
      </div>
    );
  }

  const scheduledEnd =
    new Date(liveClass.scheduledAt).getTime() + liveClass.duration * 60_000;
  const isRunning = Date.now() <= scheduledEnd;

  return (
    <>
      <style>{`
        @keyframes lc-spin { to { transform: rotate(360deg); } }
        @keyframes lc-ping { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.5)} }
        body { margin:0; padding:0; background:#0f172a; }
      `}</style>

      <div className="flex h-screen bg-slate-900 overflow-hidden">
        {/* fundo escuro intencional: container da sala Jitsi */}
        {/* ── Main area ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top bar */}
          <div className="flex-shrink-0 px-3.5 pt-3.5">
            <div className="relative flex items-stretch overflow-hidden rounded-2xl bg-white shadow-lg">
              {/* Back — bloco azul com corte diagonal */}
              <div
                className="flex items-center bg-gradient-to-r from-[#1d5fd6] to-[#2563eb] py-3 pl-3.5 pr-9"
                style={{
                  clipPath:
                    'polygon(0 0, 100% 0, calc(100% - 22px) 100%, 0 100%)',
                }}
              >
                <button
                  onClick={() => router.push('/live-classes')}
                  className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/40 bg-white/10 px-3.5 py-1.5 text-sm font-semibold text-white"
                >
                  <ArrowLeft size={16} strokeWidth={2} /> Sair
                </button>
              </div>

              {/* Title */}
              <div className="flex min-w-0 flex-1 items-center gap-3 px-4">
                <BookOpen
                  size={26}
                  strokeWidth={1.75}
                  className="flex-shrink-0 text-[#0f1f3d]"
                  fill="currentColor"
                />
                <div className="min-w-0">
                  <p className="m-0 overflow-hidden text-ellipsis whitespace-nowrap text-base font-bold text-[#0f1f3d]">
                    {liveClass.course?.title ?? liveClass.topic}
                    <span className="mx-2 text-slate-400">•</span>
                    <span className="font-medium text-slate-500">
                      {fmtDate(liveClass.scheduledAt)}{' '}
                      {fmtTime(liveClass.scheduledAt)}
                    </span>
                  </p>
                  {liveClass.course && (
                    <p className="m-0 overflow-hidden text-ellipsis whitespace-nowrap text-xs text-slate-500">
                      {liveClass.topic}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 pr-3.5">
                {/* Live indicator */}
                {isRunning && joined && (
                  <div className="flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1">
                    <span
                      className="inline-block h-2 w-2 rounded-full bg-red-600"
                      style={{ animation: 'lc-ping 1.2s ease-in-out infinite' }}
                    />
                    <span className="text-xs font-black text-red-600">
                      AO VIVO
                    </span>
                  </div>
                )}

                {/* Session timer */}
                {joined && (
                  <div className="rounded-[9px] bg-slate-100 px-3 py-1.5 text-center">
                    <p className="m-0 text-xs uppercase tracking-wider text-slate-500">
                      Sessão
                    </p>
                    <p className="m-0 font-mono text-base font-black text-[#0f1f3d]">
                      {fmtDuration(sessionTime)}
                    </p>
                  </div>
                )}

                {/* Toggle sidebar */}
                <button
                  onClick={() => setShowSidebar((s) => !s)}
                  className="cursor-pointer rounded-lg border-none bg-slate-100 px-3 py-1.75 text-xs font-medium text-slate-600"
                >
                  {showSidebar ? 'Ocultar ▶' : '◀ Painel'}
                </button>
              </div>
            </div>
          </div>

          {/* Jitsi room */}
          <div className="flex-1 p-3.5 overflow-hidden">
            <JitsiRoom
              liveClass={liveClass}
              onJoined={handleJoined}
              onLeft={handleLeft}
            />
          </div>
        </div>

        {/* ── Sidebar ── */}
        {showSidebar && (
          <div className="w-80 border-l border-white/7 flex flex-col overflow-y-auto bg-surface-sunken flex-shrink-0 p-3">
            {/* Cartão Informações da Aula (+ gravação para ADMIN/RH) */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-lg text-slate-900">
              <div className="flex items-center gap-3 py-3.5 px-4 bg-gradient-to-r from-[#1e3a8a] to-[#2563eb] text-white">
                <Video size={22} strokeWidth={2} />
                <p className="m-0 text-sm font-extrabold uppercase tracking-wide">
                  Informações da Aula
                </p>
              </div>

              <div className="p-4 flex flex-col gap-4">
                <div className="flex flex-col gap-3">
                  {[
                    {
                      label: 'Data',
                      value: fmtDate(liveClass.scheduledAt),
                      icon: CalendarDays,
                    },
                    {
                      label: 'Início',
                      value: fmtTime(liveClass.scheduledAt),
                      icon: Clock,
                    },
                    {
                      label: 'Duração',
                      value: `${liveClass.duration} min`,
                      icon: Hourglass,
                    },
                  ].map((f) => (
                    <div key={f.label} className="flex items-center gap-3">
                      <f.icon
                        size={20}
                        strokeWidth={1.75}
                        className="text-[#1e3a8a] flex-shrink-0"
                      />
                      <span className="flex-1 text-sm text-slate-700">
                        {f.label}
                      </span>
                      <span className="text-sm font-medium text-slate-800">
                        {f.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Existing recording link */}
                {liveClass.recordingUrl && (
                  <a
                    href={safeHref(liveClass.recordingUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 py-2 px-3 bg-blue-50 border border-blue-200 rounded-lg text-[#1d4ed8] text-xs no-underline font-semibold"
                  >
                    <Clapperboard size={13} strokeWidth={1.75} /> Ver Gravação
                    Anterior ↗
                  </a>
                )}

                {/* Recording panel — ADMIN/RH apenas (PUT /live-classes/:id) */}
                {canManageRecording && (
                  <>
                    <div className="border-t border-slate-200" />
                    <RecordingPanel
                      liveClass={liveClass}
                      onUrlSaved={(url) =>
                        queryClient.setQueryData<LiveClass>(
                          queryKeys.liveClasses.detail(classId),
                          (lc) => (lc ? { ...lc, recordingUrl: url } : lc),
                        )
                      }
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
