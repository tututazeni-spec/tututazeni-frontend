// components/avatar-training/room/AvatarHeader.tsx
// Cabeçalho da sala: instrutor virtual, etapa e tempo (apresentação).

import { Bot } from 'lucide-react';
import { currentStepNumber, speakingSuffix } from './logic';
import type { RoomVoice } from '../useRoomVoice';
import type { Room } from '../types';

interface AvatarHeaderProps {
  room: Room;
  voice: RoomVoice;
  elapsed: string;
}

export function AvatarHeader({ room, voice, elapsed }: AvatarHeaderProps) {
  const avatar = room.session.avatar;
  return (
    <div className="flex items-center gap-3 rounded-card border border-border bg-surface p-3">
      {/* O anel pulsa enquanto o instrutor «fala» (animação sincronizada com a voz). */}
      <div
        className={`shrink-0 rounded-full p-1 ${
          voice.speaking
            ? 'animate-pulse ring-2 ring-primary'
            : 'ring-1 ring-border'
        }`}
      >
        {avatar?.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatar.imageUrl}
            alt={`Instrutor virtual ${avatar.name}`}
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-sunken">
            <Bot size={28} className="text-ink-muted" aria-hidden />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-display text-sm font-semibold text-ink">
          {avatar?.name ?? 'Instrutor virtual'}
        </div>
        <div className="font-body text-xs text-ink-muted">
          Instrutor virtual (IA)
          {speakingSuffix(voice.speaking, voice.engine)}
        </div>
      </div>
      <div className="text-right font-body text-xs text-ink-muted">
        <div>
          Etapa {currentStepNumber(room.attempt.currentStep, room.steps.length)}{' '}
          de {room.steps.length}
        </div>
        <div className="font-mono" aria-label={`Tempo de sessão ${elapsed}`}>
          {elapsed}
        </div>
      </div>
    </div>
  );
}
