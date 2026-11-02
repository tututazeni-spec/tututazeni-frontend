// components/live-classes/room/JitsiRoom.tsx
// Embed da sala Jitsi Meet via External API. Extraído de
// app/(platform)/live-classes/[id]/page.tsx.

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { reportError } from '@/lib/errorReporting';
import { apiClient } from '@/lib/apiClient';
import { Button } from '@/components/ui/Button';
import { useFullscreen } from '@/components/viewers/useFullscreen';
import { FullscreenControls } from '@/components/viewers/FullscreenControls';
import { ExternalMeetingCard } from './ExternalMeetingCard';
import { ZoomRoom, type ZoomSdkAccess } from './ZoomRoom';
import type { JitsiAPI, LiveClass } from './types';
import { LIVE_PLAYER_ELEMENT_ID } from './useRecording';

interface JitsiRoomProps {
  liveClass: LiveClass;
  onJoined: () => void;
  onLeft: () => void;
}

export function JitsiRoom({ liveClass, onJoined, onLeft }: JitsiRoomProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<JitsiAPI | null>(null);
  const stageFs = useFullscreen();
  const [loaded, setLoaded] = useState(false);
  // O iframe do Jitsi já carregou: a sobreposição "A conectar" sai de cima dele,
  // para se verem os ecrãs do próprio Jitsi (login, "à espera do anfitrião", erros).
  const [frameReady, setFrameReady] = useState(false);
  const [slow, setSlow] = useState(false);
  const [participants, setParticipants] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const [retryToken, setRetryToken] = useState(0);
  const [copied, setCopied] = useState(false);

  // Nome da sala emitido pelo backend (HMAC): o meet.jit.si público não tem
  // autenticação, por isso um nome previsível deixava entrar qualquer pessoa.
  const [access, setAccess] = useState<{
    roomName: string;
    domain: string;
    jwt?: string;
    appId?: string;
  } | null>(null);

  // Partilha o link cru da sala Jitsi.
  const copyLink = useCallback(() => {
    if (!access) return;
    navigator.clipboard
      ?.writeText(`https://${access.domain}/${access.roomName}`)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((e) => reportError(e, { source: 'JitsiRoom.copyLink' }));
  }, [access]);
  const roomName = access?.roomName ?? null;
  // Zoom/Teams: não se embebem num iframe; o backend devolve só o link.
  const [external, setExternal] = useState<{
    provider: 'ZOOM' | 'TEAMS';
    joinUrl: string;
    passcode: string | null;
    sdk?: ZoomSdkAccess;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get<
        | { roomName: string; domain: string; jwt?: string; appId?: string }
        | {
            provider: 'ZOOM' | 'TEAMS';
            joinUrl: string;
            passcode: string | null;
            sdk?: ZoomSdkAccess;
          }
      >(`/live-classes/${liveClass.id}/room`)
      .then((r) => {
        if (cancelled) return;
        if ('joinUrl' in r) setExternal(r);
        else setAccess(r);
      })
      .catch((e) => {
        reportError(e, { source: 'JitsiRoom.roomName' });
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [liveClass.id, retryToken]);

  const initJitsi = useCallback(() => {
    if (!access || !containerRef.current || !window.JitsiMeetExternalAPI)
      return;

    const jitsi = new window.JitsiMeetExternalAPI(access.domain, {
      roomName: access.roomName,
      ...(access.jwt && { jwt: access.jwt }),
      parentNode: containerRef.current,
      width: '100%',
      height: '100%',
      lang: 'pt',
      configOverwrite: {
        startWithAudioMuted: false,
        startWithVideoMuted: false,
        disableModeratorIndicator: false,
        enableEmailInStats: false,
        enableClosePage: false,
        prejoinPageEnabled: false, // Skip pre-join screen
        disableDeepLinking: true,
        disableLocalVideoFlip: false,
        defaultLanguage: 'pt',
        subject: liveClass.topic,
      },
      interfaceConfigOverwrite: {
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        SHOW_BRAND_WATERMARK: false,
        BRAND_WATERMARK_LINK: '',
        DEFAULT_REMOTE_DISPLAY_NAME: 'Participante',
        TOOLBAR_BUTTONS: [
          'microphone',
          'camera',
          'closedcaptions',
          'desktop',
          'fullscreen',
          'fodeviceselection',
          'hangup',
          'chat',
          'recording',
          'livestreaming',
          'etherpad',
          'sharedvideo',
          'settings',
          'raisehand',
          'videoquality',
          'filmstrip',
          'participants-pane',
          'feedback',
          'stats',
          'shortcuts',
          'tileview',
          'select-background',
          'download',
          'help',
          'mute-everyone',
          'security',
          'invite',
          'info',
        ],
        SETTINGS_SECTIONS: ['devices', 'language', 'moderator'],
        VIDEO_QUALITY_LABEL_DISABLED: false,
        HIDE_INVITE_MORE_HEADER: false,
        MOBILE_APP_PROMO: false,
        APP_NAME: 'Innova Academy',
        NATIVE_APP_NAME: 'Innova Academy',
      },
    });

    apiRef.current = jitsi;
    jitsi.getIFrame?.().addEventListener('load', () => setFrameReady(true));

    jitsi.addEventListeners({
      videoConferenceJoined: () => {
        setLoaded(true);
        setParticipants(jitsi.getNumberOfParticipants());
        onJoined();
      },
      videoConferenceLeft: () => {
        onLeft();
      },
      participantJoined: () => {
        setParticipants(jitsi.getNumberOfParticipants());
      },
      participantLeft: () => {
        setParticipants(jitsi.getNumberOfParticipants());
      },
    });
  }, [access, liveClass.topic, onJoined, onLeft]);

  useEffect(() => {
    if (!access) return;
    setLoadError(false);

    // Load Jitsi External API script dynamically
    const existing = document.getElementById('jitsi-api-script');
    if (existing && window.JitsiMeetExternalAPI) {
      initJitsi();
      return;
    }
    // Um retry remove o <script> anterior (falhado) antes de tentar de novo.
    existing?.remove();

    const script = document.createElement('script');
    script.id = 'jitsi-api-script';
    // JaaS (8x8.vc) serve o external_api.js sob o caminho do appId.
    script.src = access.appId
      ? `https://${access.domain}/${access.appId}/external_api.js`
      : `https://${access.domain}/external_api.js`;
    script.async = true;
    // Sem SRI de propósito: o external_api.js muda a cada release da Jitsi
    // (cache de 60 s), um hash fixo partia as aulas ao vivo. Em compensação não
    // enviamos cookies nem referrer ao terceiro (a CSP já o limita ao domínio Jitsi).
    script.crossOrigin = 'anonymous';
    script.referrerPolicy = 'no-referrer';
    script.onload = initJitsi;
    script.onerror = () => {
      script.remove();
      setLoadError(true);
      reportError(new Error('Falha ao carregar Jitsi External API'), {
        source: 'JitsiRoom.script.onerror',
      });
    };
    document.head.appendChild(script);

    return () => {
      apiRef.current?.dispose();
    };
  }, [access, initJitsi, retryToken]);

  // Passado algum tempo sem entrar na sala, oferece abri-la numa janela própria.
  useEffect(() => {
    if (!access || loaded) return;
    setSlow(false);
    const timer = setTimeout(() => setSlow(true), 20000);
    return () => clearTimeout(timer);
  }, [access, loaded, retryToken]);

  const retry = useCallback(() => {
    setFrameReady(false);
    setRetryToken((t) => t + 1);
  }, []);

  if (external?.provider === 'ZOOM' && external.sdk) {
    return (
      <ZoomRoom
        joinUrl={external.joinUrl}
        passcode={external.passcode}
        topic={liveClass.topic}
        sdk={external.sdk}
        onJoined={onJoined}
        onLeft={onLeft}
      />
    );
  }

  if (external) {
    return (
      <ExternalMeetingCard
        provider={external.provider}
        joinUrl={external.joinUrl}
        passcode={external.passcode}
        topic={liveClass.topic}
        onJoined={onJoined}
        onLeft={onLeft}
      />
    );
  }

  return (
    <div
      ref={stageFs.ref}
      id={LIVE_PLAYER_ELEMENT_ID}
      tabIndex={-1}
      className={`relative w-full h-full bg-slate-900 overflow-hidden outline-none ${
        stageFs.isFs ? '' : 'rounded-[14px]'
      } ${stageFs.isFs && !stageFs.controlsVisible ? 'cursor-none' : ''}`}
    >
      <FullscreenControls
        isFs={stageFs.isFs}
        visible={stageFs.controlsVisible}
        onToggle={stageFs.toggle}
      />
      {/* fundo escuro intencional: container da sala Jitsi */}
      {!loaded && loadError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 bg-slate-900 px-6 text-center">
          {/* fundo escuro intencional: overlay de erro */}
          <p className="text-canvas text-sm m-0">
            Não foi possível carregar a sala de videoconferência.
          </p>
          <p className="text-canvas text-xs m-0 opacity-50">
            Verifique a sua ligação à internet e tente novamente.
          </p>
          <Button size="sm" onClick={retry}>
            Tentar novamente
          </Button>
        </div>
      )}
      {!loaded && !loadError && !frameReady && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10 bg-slate-900">
          {/* fundo escuro intencional: overlay de carregamento */}
          <div
            className="w-9 h-9 rounded-full border-3 border-white/10"
            style={{
              borderTopColor: 'var(--color-danger)',
              animation: 'lc-spin 0.8s linear infinite',
            }}
          />
          <p className="text-canvas text-sm m-0 opacity-60">
            A conectar à sala Jitsi...
          </p>
          <p className="text-canvas text-xs m-0 opacity-30">Sala: {roomName}</p>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
      {!loaded && !loadError && slow && access && (
        <div className="absolute bottom-3 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3 rounded-control bg-black/70 px-3 py-2 text-xs text-canvas">
          <span>A sala demora a abrir.</span>
          <a
            href={`https://${access.domain}/${access.roomName}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline"
          >
            Abrir a sala numa nova janela
          </a>
        </div>
      )}
      {access && (
        <button
          type="button"
          onClick={copyLink}
          className="absolute top-3 left-3 z-20 rounded-control bg-black/60 px-2.5 py-1 text-xs text-canvas hover:bg-black/80"
        >
          {copied ? 'Link copiado' : 'Copiar link do Jitsi'}
        </button>
      )}
      {loaded && participants > 0 && (
        <div className="absolute top-12 right-3 bg-black/60 rounded-control py-1 px-2.5 text-xs text-canvas flex items-center gap-1.25 pointer-events-none z-20">
          <span className="w-2 h-2 rounded-full bg-success inline-block" />
          {participants} participante{participants !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
