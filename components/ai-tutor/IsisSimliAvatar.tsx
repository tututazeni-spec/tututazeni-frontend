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
  /** Carregou em Iniciar (o pai liga o microfone). */
  onStart?: () => void;
  /** Carregou em Terminar (o pai desliga o microfone). */
  onEnd?: () => void;
  className?: string;
}

interface AvatarSession {
  sessionToken: string;
  maxSessionLength: number;
  maxIdleTime: number;
}

const DEFAULT_POSTER = '/images/isis-avatar.png';
const POSTER_KEY = 'innova_isis_avatar_poster';
const POSTER_EVENT = 'innova:isis-poster';

/** Retrato actual da Ísis (o mesmo do quadrado do avatar), sempre sincronizado. */
export function useIsisPoster(): string {
  const [poster, setPoster] = useState(DEFAULT_POSTER);
  useEffect(() => {
    const read = () => {
      try {
        setPoster(localStorage.getItem(POSTER_KEY) || DEFAULT_POSTER);
      } catch {
        /* sem localStorage: fica a imagem por omissão */
      }
    };
    read();
    window.addEventListener(POSTER_EVENT, read);
    return () => window.removeEventListener(POSTER_EVENT, read);
  }, []);
  return poster;
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
  { onStatusChange, onSpeakingChange, onStart, onEnd, className = '' },
  ref,
) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const clientRef = useRef<SimliClient | null>(null);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [status, setStatusState] = useState<AvatarStatus>('idle');
  // Imagem de repouso = última imagem do próprio avatar (guardada ao ligar),
  // para o retrato inicial já ser o do avatar e não a foto original.
  const poster = useIsisPoster();

  const capturePoster = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0);
      const url = canvas.toDataURL('image/jpeg', 0.85);
      localStorage.setItem(POSTER_KEY, url);
      window.dispatchEvent(new Event(POSTER_EVENT));
    } catch {
      /* canvas/localStorage indisponível: mantém a imagem actual */
    }
  }, []);

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
    async (next: AvatarStatus = 'ended', serverClosed = false) => {
      const client = clientRef.current;
      clientRef.current = null;
      onSpeakingChange?.(false);
      // Quando foi o Simli a terminar (eventos stop/error) o SDK já fechou a
      // ligação; chamar stop() outra vez só gera "FAILED TO SEND FINAL MESSAGE".
      if (client && !serverClosed) {
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
        // Só CRITICAL: no encerramento o SDK regista como erro excepções já
        // tratadas ("FAILED TO SEND FINAL MESSAGE") e o overlay do Next mostra-as.
        // As falhas reais chegam pelos eventos error/startup_error abaixo.
        LogLevel.CRITICAL,
        'livekit',
      );
      client.on('start', () => {
        setStatus('connected');
        // Dá tempo ao vídeo para ter imagem antes de guardar o fotograma.
        setTimeout(capturePoster, 2000);
      });
      client.on('speaking', () => onSpeakingChange?.(true));
      client.on('silent', () => onSpeakingChange?.(false));
      // Fim por limite de duração ou inactividade (definidos no backend).
      client.on('stop', () => {
        if (clientRef.current === client) void disconnect('ended', true);
      });
      // O SDK dá o motivo no argumento; sem o registar, o erro final
      // ("Called Disconnect Before A Connection succeeded") esconde a causa.
      client.on('error', (message: string) => {
        reportError(new Error(`Simli error: ${message}`), {
          source: 'IsisSimliAvatar.error',
        });
        if (clientRef.current === client) void disconnect('error', true);
      });
      client.on('startup_error', (message: string) => {
        reportError(new Error(`Simli startup_error: ${message}`), {
          source: 'IsisSimliAvatar.startup_error',
        });
        if (clientRef.current === client) void disconnect('error', true);
      });
      clientRef.current = client;
      await client.start();
    } catch (e) {
      reportError(e, { source: 'IsisSimliAvatar.connect' });
      await disconnect('error', true);
    }
  }, [capturePoster, disconnect, onSpeakingChange, setStatus]);

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

  // Perfil sem acesso ao avatar (ou Simli não configurado): o botão liga só o
  // microfone e a Ísis responde por voz do browser.
  const [micOnly, setMicOnly] = useState(false);
  const live = status === 'connected' || status === 'connecting' || micOnly;

  return (
    <div className={`relative ${className}`}>
      <Image
        src={poster}
        alt="Ísis - Tutor IA"
        width={640}
        height={640}
        unoptimized={poster.startsWith('data:')}
        className="w-full h-full object-cover"
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
          {enabled === false
            ? micOnly
              ? 'Microfone ligado'
              : 'Avatar não disponível — fala com a Ísis por voz'
            : STATUS_TEXT[status]}
        </span>
        {status === 'connecting' && (
          <Loader2 size={16} className="animate-spin" />
        )}
        {enabled !== null &&
          (live ? (
            <Button
              size="sm"
              intent="danger"
              onClick={() => {
                setMicOnly(false);
                void disconnect('ended');
                onEnd?.();
              }}
              aria-label="Terminar conversa com o avatar"
            >
              <PhoneOff size={14} /> Terminar
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => {
                onStart?.();
                if (enabled) void connect();
                else setMicOnly(true);
              }}
              aria-label="Iniciar conversa com o avatar"
            >
              <Phone size={14} /> Iniciar
            </Button>
          ))}
      </div>
    </div>
  );
});
