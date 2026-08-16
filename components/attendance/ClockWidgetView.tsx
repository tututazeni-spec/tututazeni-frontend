// components/attendance/ClockWidgetView.tsx
// Vista apresentacional do widget de picagem de ponto — sem fetch, sem
// mutações. O relógio ao vivo (`time`, actualizado a cada segundo) é
// estado puramente de UI, por isso fica aqui em vez do container
// (hooks/useClockInOut.ts). Ver memory
// project_innova_component_separation_audit, item 3.5.

'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, LogIn, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { ClockStatus } from '@/hooks/useClockInOut';

export interface ClockWidgetViewProps {
  status: ClockStatus;
  clockInTime: string | null;
  error: string;
  notes: string;
  onNotesChange: (notes: string) => void;
  loading: boolean;
  onClockIn: () => void;
  onClockOut: () => void;
}

export function ClockWidgetView({
  status,
  clockInTime,
  error,
  notes,
  onNotesChange,
  loading,
  onClockIn,
  onClockOut,
}: ClockWidgetViewProps) {
  const [time, setTime] = useState(new Date());

  // Relógio ao vivo (sem rede).
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const timeStr = time.toLocaleTimeString('pt-PT', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const dateStr = time.toLocaleDateString('pt-PT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className="bg-primary rounded-panel p-6 text-canvas shadow-elevated">
      <div className="text-center mb-6">
        <p className="text-primary-ink text-sm capitalize opacity-75">{dateStr}</p>
        <p className="text-5xl font-bold mt-1 font-data tracking-tight">
          {timeStr}
        </p>
      </div>

      {status === 'idle' && (
        <div className="space-y-3">
          <textarea
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Notas (opcional)..."
            rows={2}
            className="w-full px-3 py-2 text-sm bg-primary-subtle border border-primary-ink/20 rounded-control text-canvas placeholder-primary-ink/60 focus:outline-none focus:ring-2 focus:ring-primary-ink/30 resize-none"
          />
          <Button
            intent="secondary"
            onClick={onClockIn}
            disabled={loading}
            loading={loading}
            className="w-full flex items-center justify-center gap-2"
          >
            <LogIn size={18} />
            Check-in
          </Button>
        </div>
      )}

      {status === 'checked-in' && (
        <div className="space-y-3">
          <div className="bg-primary-subtle rounded-control p-3 text-center">
            <p className="text-primary-ink/75 text-xs">Entrada registada</p>
            <p className="text-2xl font-bold font-data mt-0.5">{clockInTime}</p>
          </div>
          <Button
            intent="danger"
            onClick={onClockOut}
            disabled={loading}
            loading={loading}
            className="w-full flex items-center justify-center gap-2"
          >
            <LogOut size={18} />
            Check-out
          </Button>
        </div>
      )}

      {status === 'checked-out' && (
        <div className="bg-primary-subtle rounded-control p-4 text-center">
          <CheckCircle2 size={28} className="mx-auto mb-2 text-success" />
          <p className="text-sm text-canvas">Dia registado com sucesso</p>
          <p className="text-xs text-primary-ink/75 mt-0.5">Entrada: {clockInTime}</p>
        </div>
      )}

      {error && (
        <div className="mt-3 p-2.5 bg-danger-subtle border border-danger-ink/30 rounded-control text-xs text-danger-ink text-center">
          {error}
        </div>
      )}
    </div>
  );
}
