// components/avatar-training/room/AvatarHeader.tsx
// Cabeçalho da sala: instrutor virtual, etapa e tempo (apresentação).

import { BarChart2, Bot } from 'lucide-react';
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
    <div className="flex items-center gap-5 border-b border-border pb-4">
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
            decoding="async"
            src={avatar.imageUrl}
            alt={`Instrutor virtual ${avatar.name}`}
            className="h-24 w-24 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-surface-sunken">
            <Bot size={28} className="text-ink-muted" aria-hidden />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-display text-xl font-bold text-brand">
          {avatar?.name ?? 'Instrutor virtual'}
        </div>
        <div className="font-body text-sm text-ink-muted">
          Instrutor virtual (IA)
          {speakingSuffix(voice.speaking, voice.engine)}
        </div>
      </div>
      <div className="flex items-center gap-3 border-l border-border pl-5 text-right font-body text-sm text-ink-muted">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft text-brand-ink">
          <BarChart2 size={18} aria-hidden />
        </span>
        <div>
          <div className="font-semibold text-brand">
            Etapa{' '}
            {currentStepNumber(room.attempt.currentStep, room.steps.length)} de{' '}
            {room.steps.length}
          </div>
          <div className="font-mono" aria-label={`Tempo de sessão ${elapsed}`}>
            {elapsed}
          </div>
        </div>
      </div>
    </div>
  );
}
