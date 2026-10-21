// components/ai-tutor/IsisSimliAvatar.tsx
// Avatar em tempo real da Ísis (Simli). Precisa de APIs do browser (WebRTC,
// <video>), por isso é um componente cliente. A chave do Simli nunca chega
// aqui: o backend devolve só um token temporário de sessão. Se o avatar não
// estiver configurado ou a ligação falhar, mostra o retrato estático (plano B).

'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import Image from 'next/image';
import { Loader2, Phone, PhoneOff } from 'lucide-react';
import type { SimliClient } from 'simli-client';
import { apiClient } from '@/lib/apiClient';
import { reportError } from '@/lib/errorReporting';
import { Button } from '@/components/ui/Button';

export type AvatarStatus =
  'idle' | 'connecting' | 'connected' | 'error' | 'ended';

export interface IsisSimliAvatarHandle {
  /** Envia áudio PCM16 mono a 16 kHz ao avatar. Devolve false se não ligado. */
  sendAudio: (pcm16: Uint8Array) => boolean;
  /** Cala o avatar de imediato. */
  interrupt: () => void;
}

interface IsisSimliAvatarProps {
  onStatusChange?: (status: AvatarStatus) => void;
  onSpeakingChange?: (speaking: boolean) => void;
  className?: string;
}

interface AvatarSession {
  sessionToken: string;
  maxSessionLength: number;
  maxIdleTime: number;
}

const STATUS_TEXT: Record<AvatarStatus, string> = {
  idle: 'Avatar desligado',
  connecting: 'A ligar a Ísis…',
  connected: 'Ísis ligada',
  error: 'Avatar indisponível — a Ísis continua por texto e voz',
  ended: 'Sessão do avatar terminada',
};

export const IsisSimliAvatar = forwardRef<
  IsisSimliAvatarHandle,
  IsisSimliAvatarProps
>(function IsisSimliAvatar(
  { onStatusChange, onSpeakingChange, className = '' },
  ref,
) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const clientRef = useRef<SimliClient | null>(null);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [status, setStatusState] = useState<AvatarStatus>('idle');

  const setStatus = useCallback(
    (s: AvatarStatus) => {
      setStatusState(s);
      onStatusChange?.(s);
    },
    [onStatusChange],
  );

  // O backend diz se o Simli está configurado; senão fica só o plano B.
  useEffect(() => {
    let cancelled = false;
    apiClient
      .get<{ enabled: boolean }>('/ai-tutor/avatar/status')
      .then((r) => !cancelled && setEnabled(r.enabled))
      .catch(() => !cancelled && setEnabled(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const disconnect = useCallback(
    async (next: AvatarStatus = 'ended') => {
      const client = clientRef.current;
      clientRef.current = null;
      onSpeakingChange?.(false);
      if (client) {
        try {
          await client.stop();
        } catch (e) {
          reportError(e, { source: 'IsisSimliAvatar.stop' });
        }
      }
      setStatus(next);
    },
    [onSpeakingChange, setStatus],
  );

  const connect = useCallback(async () => {
    if (clientRef.current || !videoRef.current || !audioRef.current) return;
    setStatus('connecting');
    try {
      const session = await apiClient.post<AvatarSession>(
        '/ai-tutor/avatar/session',
      );
      // Import dinâmico: o SDK usa APIs do browser e não deve correr no SSR.
      const { SimliClient, LogLevel } = await import('simli-client');
      const client = new SimliClient(
        session.sessionToken,
        videoRef.current,
        audioRef.current,
        null,
        LogLevel.INFO,
        'livekit',
      );
      client.on('start', () => setStatus('connected'));
      client.on('speaking', () => onSpeakingChange?.(true));
      client.on('silent', () => onSpeakingChange?.(false));
      // Fim por limite de duração ou inactividade (definidos no backend).
      client.on('stop', () => {
        if (clientRef.current === client) void disconnect('ended');
      });
      client.on('error', () => {
        if (clientRef.current === client) void disconnect('error');
      });
      client.on('startup_error', () => {
        if (clientRef.current === client) void disconnect('error');
      });
      clientRef.current = client;
      await client.start();
    } catch (e) {
      reportError(e, { source: 'IsisSimliAvatar.connect' });
      await disconnect('error');
    }
  }, [disconnect, onSpeakingChange, setStatus]);

  useImperativeHandle(
    ref,
    () => ({
      sendAudio: (pcm16) => {
        if (!clientRef.current || status !== 'connected') return false;
        clientRef.current.sendAudioData(pcm16);
        return true;
      },
      interrupt: () => clientRef.current?.ClearBuffer(),
    }),
    [status],
  );

  // Cobra por tempo de uso: fechar o separador ou sair da página termina a sessão.
  const disconnectRef = useRef(disconnect);
  useEffect(() => {
    disconnectRef.current = disconnect;
  }, [disconnect]);
  useEffect(() => {
    const onHide = () => void disconnectRef.current('ended');
    window.addEventListener('pagehide', onHide);
    return () => {
      window.removeEventListener('pagehide', onHide);
      void disconnectRef.current('ended');
    };
  }, []);

  const live = status === 'connected' || status === 'connecting';

  return (
    <div className={`relative ${className}`}>
      <Image
        src="/images/isis-avatar.png"
        alt="Ísis - Tutor IA"
        width={640}
        height={640}
        className={`w-full h-full object-cover ${
          status === 'connected' ? 'invisible' : ''
        }`}
      />
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`absolute inset-0 w-full h-full object-cover ${
          status === 'connected' ? '' : 'hidden'
        }`}
      />
      <audio ref={audioRef} autoPlay />

      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-black/55 px-3 py-2 text-xs text-white">
        <span role="status" aria-live="polite">
          {STATUS_TEXT[status]}
        </span>
        {status === 'connecting' && (
          <Loader2 size={16} className="animate-spin" />
        )}
        {enabled &&
          (live ? (
            <Button
              size="sm"
              intent="danger"
              onClick={() => void disconnect('ended')}
              aria-label="Terminar conversa com o avatar"
            >
              <PhoneOff size={14} /> Terminar
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => void connect()}
              aria-label="Iniciar conversa com o avatar"
            >
              <Phone size={14} /> Iniciar
            </Button>
          ))}
      </div>
    </div>
  );
});
