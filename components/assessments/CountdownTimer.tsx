// components/assessments/CountdownTimer.tsx
// Cronómetro decrescente do player de avaliação. Extraído de
// app/(platform)/assessments/page.tsx.

'use client';

import { useEffect, useState } from 'react';

export interface CountdownTimerProps {
  totalMinutes: number;
  onExpire: () => void;
}

export function CountdownTimer({
  totalMinutes,
  onExpire,
}: CountdownTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(totalMinutes * 60);

  useEffect(() => {
    if (secondsLeft <= 0) {
      onExpire();
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft, onExpire]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const isUrgent = secondsLeft <= 60;

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono font-semibold text-sm ${
        isUrgent
          ? 'bg-red-50 text-red-700 animate-pulse'
          : 'bg-gray-100 text-gray-700'
      }`}
    >
      ⏱ {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
    </div>
  );
}
