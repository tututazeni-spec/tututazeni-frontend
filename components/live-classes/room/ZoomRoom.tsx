// components/live-classes/room/ZoomRoom.tsx
// Reunião Zoom embebida na página através do Meeting SDK (vista de componente).
// Se o SDK falhar a arrancar, mostra o cartão que abre o Zoom noutro separador.

'use client';

import { useEffect, useRef, useState } from 'react';
import { reportError } from '@/lib/errorReporting';
import { Button } from '@/components/ui/Button';

// SDK carregado do CDN da Zoom (como o Jitsi): evita o peer-dep react@18.3.1 do
// pacote npm. Versão fixa; o domínio está permitido em lib/csp.ts.
const ZOOM_SDK_VERSION = '6.10.0';
const ZOOM_SDK_SRC = `https://source.zoom.us/${ZOOM_SDK_VERSION}/zoom-meeting-embedded-${ZOOM_SDK_VERSION}.min.js`;

interface ZoomEmbeddedClient {
  init: (opts: Record<string, unknown>) => Promise<unknown>;
  join: (opts: Record<string, unknown>) => Promise<unknown>;
  on: (event: string, cb: (p: { state?: string }) => void) => void;
  leaveMeeting?: () => Promise<unknown>;
}

declare global {
  interface Window {
    ZoomMtgEmbedded?: { createClient: () => ZoomEmbeddedClient };
  }
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const el = document.createElement('script');
    el.src = src;
    el.async = false;
    el.crossOrigin = 'anonymous';
    el.onload = () => resolve();
    el.onerror = () => reject(new Error(`Falha ao carregar ${src}`));
    document.head.appendChild(el);
  });
}

// O bundle do SDK é um UMD que lê window.React/window.ReactDOM (React 18). O
// próprio CDN da Zoom serve essas cópias; a app usa o React 19 via bundler e
// não depende destes globais.
async function loadZoomSdk(): Promise<NonNullable<Window['ZoomMtgEmbedded']>> {
  if (window.ZoomMtgEmbedded) return window.ZoomMtgEmbedded;
  const base = `https://source.zoom.us/${ZOOM_SDK_VERSION}`;
  await loadScript(`${base}/lib/vendor/react.min.js`);
  await loadScript(`${base}/lib/vendor/react-dom.min.js`);
  await loadScript(ZOOM_SDK_SRC);
  if (!window.ZoomMtgEmbedded) {
    throw new Error('Zoom SDK carregado sem ZoomMtgEmbedded');
  }
  return window.ZoomMtgEmbedded;
}

export interface ZoomSdkAccess {
  signature: string;
  sdkKey: string;
  meetingNumber: string;
  userName: string;
  userEmail: string;
}

interface ZoomRoomProps {
  joinUrl: string;
  passcode: string | null;
  topic?: string;
  sdk: ZoomSdkAccess;
  onJoined: () => void;
  onLeft: () => void;
}

// Os erros do SDK são objectos { type, reason, errorCode }, não Error.
function describeZoomError(e: unknown): string {
  if (e && typeof e === 'object') {
    const o = e as { reason?: string; message?: string; errorCode?: number };
    const text = o.reason || o.message;
    if (text) return o.errorCode ? `${text} (código ${o.errorCode})` : text;
  }
  return 'Erro desconhecido ao entrar na reunião.';
}

// O código de acesso real pode vir só dentro do link (?pwd=…); o campo guardado
// por vezes repete o ID da reunião, que o Zoom rejeita.
function resolvePassword(
  joinUrl: string,
  passcode: string | null,
  meetingNumber: string,
) {
  if (passcode && passcode !== meetingNumber) return passcode;
  try {
    return new URL(joinUrl).searchParams.get('pwd') ?? passcode ?? '';
  } catch {
    return passcode ?? '';
  }
}

export function ZoomRoom({
  joinUrl,
  passcode,
  sdk,
  onJoined,
  onLeft,
}: ZoomRoomProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [ready, setReady] = useState(false);
  // Os callbacks mudam a cada render; o SDK só arranca uma vez por reunião.
  const cb = useRef({ onJoined, onLeft });
  cb.current = { onJoined, onLeft };

  useEffect(() => {
    let cancelled = false;
    let client: ZoomEmbeddedClient | null = null;

    (async () => {
      try {
        const ZoomMtgEmbedded = await loadZoomSdk();
        if (cancelled || !rootRef.current) return;
        const c = ZoomMtgEmbedded.createClient();
        client = c;
        await c.init({
          zoomAppRoot: rootRef.current,
          language: 'pt-PT',
          patchJsMedia: true,
          customize: { video: { isResizable: false } },
        });
        c.on('connection-change', (p) => {
          if (p?.state === 'Closed') cb.current.onLeft();
        });
        await c.join({
          signature: sdk.signature,
          sdkKey: sdk.sdkKey,
          meetingNumber: sdk.meetingNumber,
          password: resolvePassword(joinUrl, passcode, sdk.meetingNumber),
          userName: sdk.userName,
          userEmail: sdk.userEmail,
        });
        if (cancelled) return;
        setReady(true);
        cb.current.onJoined();
      } catch (e) {
        if (cancelled) return;
        const msg = describeZoomError(e);
        reportError(new Error(msg), { source: 'ZoomRoom.join' });
        setError(msg);
      }
    })();

    return () => {
      cancelled = true;
      client?.leaveMeeting?.().catch(() => undefined);
    };
  }, [sdk, passcode, joinUrl, attempt]);

  if (error) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 rounded-[14px] bg-slate-900 px-6 text-center">
        <p className="m-0 text-sm font-semibold text-canvas">
          Não foi possível entrar na reunião Zoom
        </p>
        <p className="m-0 max-w-md text-xs text-canvas opacity-70">{error}</p>
        <Button
          onClick={() => {
            setError(null);
            setReady(false);
            setAttempt((n) => n + 1);
          }}
        >
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[14px] bg-slate-900">
      {!ready && (
        <p className="absolute inset-0 z-10 m-0 flex items-center justify-center text-sm text-canvas">
          A entrar na reunião Zoom…
        </p>
      )}
      <div ref={rootRef} className="h-full w-full" />
    </div>
  );
}
