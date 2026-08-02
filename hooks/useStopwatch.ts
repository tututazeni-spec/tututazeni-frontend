// hooks/useStopwatch.ts
// Cronómetro em segundos desde `start()`. Extraído de duas implementações
// manuais idênticas (setInterval + Date.now()) em live-classes/[id]/page.tsx.
// `elapsedNow()` lê o tempo decorrido via ref (sempre actual), útil para
// closures antigas (ex: handlers de MediaRecorder) que não podem depender
// do valor mais recente de `seconds` no state.

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export function useStopwatch() {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef(0);

  const elapsedNow = useCallback(() => Math.round((Date.now() - startRef.current) / 1000), []);

  const start = useCallback(() => {
    startRef.current = Date.now();
    setSeconds(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => setSeconds(elapsedNow()), 1000);
  }, [elapsedNow]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    stop();
    setSeconds(0);
  }, [stop]);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  return { seconds, start, stop, reset, elapsedNow };
}
