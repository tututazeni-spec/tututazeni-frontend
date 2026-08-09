// components/live-classes/room/useRecording.ts
// Hook de gravação de ecrã (MediaRecorder) para a sala Jitsi. Extraído de
// app/(platform)/live-classes/[id]/page.tsx.

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useStopwatch } from '@/hooks/useStopwatch';
import type { RecordingData, RecordingState } from './types';

export function useRecording() {
  const [state, setState] = useState<RecordingState>('idle');
  const [data, setData] = useState<RecordingData | null>(null);
  const [error, setError] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  // Ref sincronizado com `data`, lido no cleanup de unmount (ver useEffect
  // abaixo) — esse cleanup só corre uma vez e antes fechava sobre o `data`
  // inicial (sempre null), nunca revogando de facto o object URL da última
  // gravação ao desmontar o componente.
  const dataRef = useRef<RecordingData | null>(null);
  const {
    seconds: elapsed,
    start: startStopwatch,
    stop: stopStopwatch,
    reset: resetStopwatch,
    elapsedNow,
  } = useStopwatch();

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const start = useCallback(async () => {
    setError('');
    try {
      // Ask user to share screen (includes audio if available)
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 },
        audio: true,
      });
      streamRef.current = stream;

      // Choose best supported format
      const mimeType =
        [
          'video/webm;codecs=vp9,opus',
          'video/webm;codecs=vp8,opus',
          'video/webm',
          'video/mp4',
        ].find((t) => MediaRecorder.isTypeSupported(t)) ?? 'video/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const dur = elapsedNow();
        setData({ blob, url, duration: dur, size: blob.size });
        setState('stopped');
        // Cleanup stream tracks
        streamRef.current?.getTracks().forEach((t) => t.stop());
      };

      // If user stops share via browser UI, stop recording cleanly
      stream.getVideoTracks()[0].onended = () => {
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
        stopStopwatch();
      };

      recorder.start(1000); // chunk every second
      startStopwatch();
      setState('recording');
    } catch (e) {
      if (e instanceof DOMException && e.name === 'NotAllowedError') {
        setError('Permissão de partilha de ecrã negada.');
      } else {
        setError(e instanceof Error ? e.message : 'Erro ao iniciar gravação.');
      }
    }
  }, [startStopwatch, stopStopwatch, elapsedNow]);

  const stop = useCallback(() => {
    stopStopwatch();
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, [stopStopwatch]);

  const reset = useCallback(() => {
    if (data?.url) URL.revokeObjectURL(data.url);
    setData(null);
    resetStopwatch();
    setError('');
    setState('idle');
    chunksRef.current = [];
  }, [data, resetStopwatch]);

  const download = useCallback(
    (filename: string) => {
      if (!data) return;
      const a = document.createElement('a');
      a.href = data.url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    },
    [data],
  );

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (dataRef.current?.url) URL.revokeObjectURL(dataRef.current.url);
    };
  }, []);

  return { state, data, elapsed, error, start, stop, reset, download };
}
