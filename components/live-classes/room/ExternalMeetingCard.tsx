// components/live-classes/room/ExternalMeetingCard.tsx
// Sala de uma aula em Zoom ou Teams: estas plataformas não se embebem num
// iframe, por isso a aula abre no separador da própria plataforma e aqui só se
// regista a presença (entrar/sair).

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface ExternalMeetingCardProps {
  provider: 'ZOOM' | 'TEAMS';
  joinUrl: string;
  passcode: string | null;
  topic: string;
  onJoined: () => void;
  onLeft: () => void;
}

const PROVIDER_LABEL = { ZOOM: 'Zoom', TEAMS: 'Microsoft Teams' } as const;

export function ExternalMeetingCard({
  provider,
  joinUrl,
  passcode,
  topic,
  onJoined,
  onLeft,
}: ExternalMeetingCardProps) {
  const [entered, setEntered] = useState(false);
  const [copied, setCopied] = useState(false);
  const label = PROVIDER_LABEL[provider];

  const join = () => {
    window.open(joinUrl, '_blank', 'noopener,noreferrer');
    if (!entered) {
      setEntered(true);
      onJoined();
    }
  };

  const copyPasscode = async () => {
    if (!passcode) return;
    try {
      await navigator.clipboard.writeText(passcode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* sem permissão de área de transferência: o código continua visível */
    }
  };

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 rounded-[14px] bg-slate-900 px-6 text-center">
      {/* fundo escuro intencional: contentor da sala, igual ao da sala Jitsi */}
      <p className="m-0 text-xs uppercase tracking-wide text-canvas opacity-60">
        Esta aula decorre em {label}
      </p>
      <h2 className="m-0 text-lg font-bold text-canvas">{topic}</h2>
      <Button onClick={join}>
        {entered ? `Abrir ${label} novamente` : `Entrar no ${label}`}
      </Button>
      {passcode && (
        <p className="m-0 flex items-center gap-2 text-sm text-canvas">
          Código de acesso: <strong className="font-mono">{passcode}</strong>
          <button
            type="button"
            onClick={copyPasscode}
            className="cursor-pointer rounded border border-white/30 bg-transparent px-2 py-0.5 text-xs text-canvas"
          >
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        </p>
      )}
      {entered && (
        <Button size="sm" onClick={onLeft}>
          Já saí da aula
        </Button>
      )}
      <p className="m-0 max-w-sm text-xs text-canvas opacity-50">
        A reunião abre noutro separador. A sua presença fica registada quando
        entra aqui.
      </p>
    </div>
  );
}
