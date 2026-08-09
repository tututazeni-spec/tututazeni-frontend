// components/attendance/ClockWidgetView.tsx
// Vista apresentacional do widget de picagem de ponto — sem fetch, sem
// mutações. O relógio ao vivo (`time`, actualizado a cada segundo) é
// estado puramente de UI, por isso fica aqui em vez do container
// (hooks/useClockInOut.ts). Ver memory
// project_innova_component_separation_audit, item 3.5.

'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, LogIn, LogOut, Loader2 } from 'lucide-react';
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
    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-lg">
      <div className="text-center mb-6">
        <p className="text-blue-200 text-sm capitalize">{dateStr}</p>
        <p className="text-5xl font-bold mt-1 tabular-nums tracking-tight">
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
            className="w-full px-3 py-2 text-sm bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/30 resize-none"
          />
          <button
            onClick={onClockIn}
            disabled={loading}
            className="w-full py-3 bg-white text-blue-700 font-bold rounded-2xl hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <LogIn size={18} />
            )}
            Check-in
          </button>
        </div>
      )}

      {status === 'checked-in' && (
        <div className="space-y-3">
          <div className="bg-white/10 rounded-2xl p-3 text-center">
            <p className="text-blue-200 text-xs">Entrada registada</p>
            <p className="text-2xl font-bold mt-0.5">{clockInTime}</p>
          </div>
          <button
            onClick={onClockOut}
            disabled={loading}
            className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <LogOut size={18} />
            )}
            Check-out
          </button>
        </div>
      )}

      {status === 'checked-out' && (
        <div className="bg-white/10 rounded-2xl p-4 text-center">
          <CheckCircle2 size={28} className="mx-auto mb-2 text-emerald-300" />
          <p className="text-sm text-blue-100">Dia registado com sucesso</p>
          <p className="text-xs text-blue-200 mt-0.5">Entrada: {clockInTime}</p>
        </div>
      )}

      {error && (
        <div className="mt-3 p-2.5 bg-red-500/20 border border-red-400/30 rounded-xl text-xs text-red-200 text-center">
          {error}
        </div>
      )}
    </div>
  );
}
