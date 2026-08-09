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
    } catch {
      /* silent */
    }
    startSessionTimer();
  }, [classId, startSessionTimer]);

  const handleLeft = useCallback(async () => {
    stopSessionTimer();
    try {
      await apiClient.post(`/live-classes/${classId}/leave`, {});
    } catch {
      /* silent */
    }
    router.push('/live');
  }, [classId, stopSessionTimer, router]);

  // Loading
  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          flexDirection: 'column',
          gap: 16,
          background: '#0f172a',
        }}
      >
        <style>{`@keyframes lc-spin{to{transform:rotate(360deg)}}@keyframes lc-ping{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(1.5)}}`}</style>
        <div
          style={{
            width: 36,
            height: 36,
            border: '3px solid rgba(255,255,255,0.1)',
            borderTopColor: '#dc2626',
            borderRadius: '50%',
            animation: 'lc-spin 0.8s linear infinite',
          }}
        />
        <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0, fontSize: 14 }}>
          A preparar a sala...
        </p>
      </div>
    );
  }

  if (isError || !liveClass) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: '#0f172a',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <p style={{ color: '#fca5a5', fontSize: 16 }}>
          ❌ {queryError?.message || 'Aula não encontrada'}
        </p>
        <button
          onClick={() => router.push('/live')}
          style={{
            padding: '9px 20px',
            background: '#dc2626',
            border: 'none',
            borderRadius: 9,
            color: '#fff',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 700,
          }}
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

      <div
        style={{
          display: 'flex',
          height: '100vh',
          background: '#0f172a',
          overflow: 'hidden',
        }}
      >
        {/* ── Main area ── */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Top bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '10px 18px',
              background: 'rgba(255,255,255,0.03)',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
              flexShrink: 0,
            }}
          >
            {/* Back */}
            <button
              onClick={() => router.push('/live')}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: 'none',
                borderRadius: 8,
                padding: '6px 12px',
                color: '#94a3b8',
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              ← Sair
            </button>

            {/* Live indicator */}
            {isRunning && joined && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  background: 'rgba(220,38,38,0.15)',
                  border: '1px solid rgba(220,38,38,0.3)',
                  borderRadius: 20,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#dc2626',
                    display: 'inline-block',
                    animation: 'lc-ping 1.2s ease-in-out infinite',
                  }}
                />
                <span
                  style={{ fontSize: 11, fontWeight: 800, color: '#dc2626' }}
                >
                  AO VIVO
                </span>
              </div>
            )}

            {/* Title */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#f1f5f9',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {liveClass.topic}
              </p>
              {liveClass.course && (
                <p style={{ margin: 0, fontSize: 11.5, color: '#64748b' }}>
                  📚 {liveClass.course.title} · {fmtDate(liveClass.scheduledAt)}{' '}
                  {fmtTime(liveClass.scheduledAt)}
                </p>
              )}
            </div>

            {/* Session timer */}
            {joined && (
              <div
                style={{
                  textAlign: 'center',
                  background: 'rgba(255,255,255,0.06)',
                  borderRadius: 9,
                  padding: '6px 12px',
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: 10,
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: 0.7,
                  }}
                >
                  Sessão
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: 15,
                    fontWeight: 800,
                    color: '#f1f5f9',
                    fontFamily: 'monospace',
                  }}
                >
                  {fmtDuration(sessionTime)}
                </p>
              </div>
            )}

            {/* Toggle sidebar */}
            <button
              onClick={() => setShowSidebar((s) => !s)}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: 'none',
                borderRadius: 8,
                padding: '7px 12px',
                color: '#94a3b8',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              {showSidebar ? 'Ocultar ▶' : '◀ Painel'}
            </button>
          </div>

          {/* Jitsi room */}
          <div style={{ flex: 1, padding: 14, overflow: 'hidden' }}>
            <JitsiRoom
              liveClass={liveClass}
              onJoined={handleJoined}
              onLeft={handleLeft}
            />
          </div>
        </div>

        {/* ── Sidebar ── */}
        {showSidebar && (
          <div
            style={{
              width: 320,
              borderLeft: '1px solid rgba(255,255,255,0.07)',
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
              background: '#0f172a',
              gap: 0,
              flexShrink: 0,
            }}
          >
            {/* Class info */}
            <div
              style={{
                padding: '16px 18px',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <p
                style={{
                  margin: '0 0 10px',
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: 0.7,
                }}
              >
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
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '5px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                  }}
                >
                  <span style={{ fontSize: 11.5, color: '#475569' }}>
                    {f.label}
                  </span>
                  <span
                    style={{
                      fontSize: f.label === 'Sala Jitsi' ? 10 : 11.5,
                      color: '#94a3b8',
                      fontFamily:
                        f.label === 'Sala Jitsi' ? 'monospace' : undefined,
                    }}
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
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginTop: 10,
                    padding: '7px 12px',
                    background: 'rgba(124,58,237,0.15)',
                    border: '1px solid rgba(124,58,237,0.3)',
                    borderRadius: 8,
                    color: '#a78bfa',
                    fontSize: 12,
                    textDecoration: 'none',
                    fontWeight: 600,
                  }}
                >
                  🎬 Ver Gravação Anterior ↗
                </a>
              )}
            </div>

            {/* Recording panel */}
            <div style={{ padding: 16, flex: 1 }}>
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
