// components/live-classes/room/JitsiRoom.tsx
// Embed da sala Jitsi Meet via External API. Extraído de
// app/(platform)/live-classes/[id]/page.tsx.

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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
    // Load Jitsi External API script dynamically
    const existing = document.getElementById('jitsi-api-script');
    if (existing) {
      initJitsi();
      return;
    }
    const script = document.createElement('script');
    script.id = 'jitsi-api-script';
    script.src = 'https://meet.jit.si/external_api.js';
    script.async = true;
    script.onload = initJitsi;
    script.onerror = () =>
      console.error('Falha ao carregar Jitsi External API');
    document.head.appendChild(script);

    return () => {
      apiRef.current?.dispose();
    };
  }, [initJitsi]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: '#0f172a',
        borderRadius: 14,
        overflow: 'hidden',
      }}
    >
      {!loaded && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            zIndex: 10,
            background: '#0f172a',
          }}
        >
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
          <p
            style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, margin: 0 }}
          >
            A conectar à sala Jitsi...
          </p>
          <p
            style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, margin: 0 }}
          >
            Sala: {roomName}
          </p>
        </div>
      )}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      {loaded && participants > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: 'rgba(0,0,0,0.6)',
            borderRadius: 8,
            padding: '4px 10px',
            fontSize: 12,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            pointerEvents: 'none',
            zIndex: 20,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#22c55e',
              display: 'inline-block',
            }}
          />
          {participants} participante{participants !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
