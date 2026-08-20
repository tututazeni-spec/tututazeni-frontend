// components/live-classes/room/JitsiRoom.tsx
// Embed da sala Jitsi Meet via External API. Extraído de
// app/(platform)/live-classes/[id]/page.tsx.

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { reportError } from '@/lib/errorReporting';
import { Button } from '@/components/ui/Button';
import type { JitsiAPI, LiveClass } from './types';

interface JitsiRoomProps {
  liveClass: LiveClass;
  onJoined: () => void;
  onLeft: () => void;
}

export function JitsiRoom({ liveClass, onJoined, onLeft }: JitsiRoomProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<JitsiAPI | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [participants, setParticipants] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const [retryToken, setRetryToken] = useState(0);

  const roomName = `innova-live-${liveClass.id}-${liveClass.topic
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .slice(0, 30)}`;

  const initJitsi = useCallback(() => {
    if (!containerRef.current || !window.JitsiMeetExternalAPI) return;

    const jitsi = new window.JitsiMeetExternalAPI('meet.jit.si', {
      roomName,
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
  }, [roomName, liveClass.topic, onJoined, onLeft]);

  useEffect(() => {
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
    script.src = 'https://meet.jit.si/external_api.js';
    script.async = true;
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
  }, [initJitsi, retryToken]);

  const retry = useCallback(() => {
    setRetryToken((t) => t + 1);
  }, []);

  return (
    <div className="relative w-full h-full bg-slate-900 rounded-[14px] overflow-hidden">
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
      {!loaded && !loadError && (
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
      {loaded && participants > 0 && (
        <div className="absolute top-3 right-3 bg-black/60 rounded-lg py-1 px-2.5 text-xs text-canvas flex items-center gap-1.25 pointer-events-none z-20">
          <span className="w-2 h-2 rounded-full bg-success inline-block" />
          {participants} participante{participants !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
