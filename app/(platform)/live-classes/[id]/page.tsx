'use client';
// Container: gere o carregamento da aula, o estado de sessão (joined/
// sidebar/timer) e compõe a sala Jitsi + painel de gravação. Ver memory
// project_innova_component_separation_audit.

import { useCallback, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useStopwatch } from '@/hooks/useStopwatch';
import { apiClient } from '@/lib/apiClient';
import { reportError } from '@/lib/errorReporting';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate as fmtDate, formatTime as fmtTime } from '@/lib/format';
import { JitsiRoom } from '@/components/live-classes/room/JitsiRoom';
import { RecordingPanel } from '@/components/live-classes/room/RecordingPanel';
import { fmtDuration } from '@/components/live-classes/room/utils';
import type { LiveClass } from '@/components/live-classes/room/types';

export default function LiveRoomPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const classId = parseInt(params.id);

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
    router.push('/live');
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
        <p className="text-danger-ink text-base">
          ❌ {queryError?.message || 'Aula não encontrada'}
        </p>
        <button
          onClick={() => router.push('/live')}
          className="py-2.25 px-5 bg-danger border-none rounded-[9px] text-canvas cursor-pointer text-sm font-bold"
        >
          ← Voltar
        </button>
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
          <div className="flex items-center gap-3.5 py-2.5 px-4.5 bg-white/3 border-b border-white/7 flex-shrink-0">
            {/* Back */}
            <button
              onClick={() => router.push('/live')}
              className="bg-white/8 border-none rounded-lg py-1.5 px-3 text-ink-muted text-xs cursor-pointer flex items-center gap-1.5"
            >
              ← Sair
            </button>

            {/* Live indicator */}
            {isRunning && joined && (
              <div className="flex items-center gap-1.5 py-1 px-2.5 bg-danger-subtle border border-danger-subtle rounded-full">
                <span
                  className="w-2 h-2 rounded-full bg-danger inline-block"
                  style={{ animation: 'lc-ping 1.2s ease-in-out infinite' }}
                />
                <span className="text-xs font-black text-danger">AO VIVO</span>
              </div>
            )}

            {/* Title */}
            <div className="flex-1 min-w-0">
              <p className="m-0 text-sm font-bold text-ink overflow-hidden text-ellipsis whitespace-nowrap">
                {liveClass.topic}
              </p>
              {liveClass.course && (
                <p className="m-0 text-xs text-ink-muted">
                  📚 {liveClass.course.title} · {fmtDate(liveClass.scheduledAt)}{' '}
                  {fmtTime(liveClass.scheduledAt)}
                </p>
              )}
            </div>

            {/* Session timer */}
            {joined && (
              <div className="text-center bg-white/6 rounded-[9px] py-1.5 px-3">
                <p className="m-0 text-xs text-ink-muted uppercase tracking-wider">
                  Sessão
                </p>
                <p className="m-0 text-base font-black text-ink font-mono">
                  {fmtDuration(sessionTime)}
                </p>
              </div>
            )}

            {/* Toggle sidebar */}
            <button
              onClick={() => setShowSidebar((s) => !s)}
              className="bg-white/8 border-none rounded-lg py-1.75 px-3 text-ink-muted text-xs cursor-pointer"
            >
              {showSidebar ? 'Ocultar ▶' : '◀ Painel'}
            </button>
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
          <div className="w-80 border-l border-white/7 flex flex-col overflow-y-auto bg-surface-sunken gap-0 flex-shrink-0">
            {/* Class info */}
            <div className="py-4 px-4.5 border-b border-white/7">
              <p className="m-0 mb-2.5 text-xs font-bold text-ink-muted uppercase tracking-wider">
                Informações da Aula
              </p>
              {[
                { label: 'Data', value: fmtDate(liveClass.scheduledAt) },
                { label: 'Início', value: fmtTime(liveClass.scheduledAt) },
                { label: 'Duração', value: `${liveClass.duration} min` },
                { label: 'Sala Jitsi', value: `innova-live-${liveClass.id}` },
              ].map((f) => (
                <div
                  key={f.label}
                  className="flex justify-between py-1.25 border-b border-white/4"
                >
                  <span className="text-xs text-ink-muted">{f.label}</span>
                  <span
                    className={`text-xs text-ink-muted ${
                      f.label === 'Sala Jitsi' ? 'font-mono' : ''
                    }`}
                  >
                    {f.value}
                  </span>
                </div>
              ))}

              {/* Existing recording link */}
              {liveClass.recordingUrl && (
                <a
                  href={liveClass.recordingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 mt-2.5 py-1.75 px-3 bg-accent-subtle border border-accent-subtle rounded-lg text-accent text-xs no-underline font-semibold"
                >
                  🎬 Ver Gravação Anterior ↗
                </a>
              )}
            </div>

            {/* Recording panel */}
            <div className="p-4 flex-1">
              <RecordingPanel
                liveClass={liveClass}
                onUrlSaved={(url) =>
                  queryClient.setQueryData<LiveClass>(
                    queryKeys.liveClasses.detail(classId),
                    (lc) => (lc ? { ...lc, recordingUrl: url } : lc),
                  )
                }
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
