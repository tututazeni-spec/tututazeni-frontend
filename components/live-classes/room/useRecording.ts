// components/live-classes/room/useRecording.ts
// Hook de gravação de ecrã (MediaRecorder) para a sala Jitsi. Extraído de
// app/(platform)/live-classes/[id]/page.tsx.

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { reportError } from '@/lib/errorReporting';
import { useStopwatch } from '@/hooks/useStopwatch';
import type { RecordingData, RecordingState } from './types';

/** id do elemento do player da aula: é só esta área que se grava. */
export const LIVE_PLAYER_ELEMENT_ID = 'live-class-player';

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
      // Ask user to share screen (includes audio if available).
      // `preferCurrentTab` sugere o separador actual, o único que permite
      // recortar a gravação ao player (Region Capture).
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 },
        audio: true,
        preferCurrentTab: true,
      } as DisplayMediaStreamOptions);
      streamRef.current = stream;

      // Limita a gravação à área do player (Chrome/Edge). Se o utilizador
      // escolheu outra janela/ecrã ou o browser não suporta, grava tudo.
      try {
        const player = document.getElementById(LIVE_PLAYER_ELEMENT_ID);
        const CropTargetApi = (
          window as unknown as {
            CropTarget?: { fromElement: (el: Element) => Promise<unknown> };
          }
        ).CropTarget;
        const track = stream.getVideoTracks()[0] as MediaStreamTrack & {
          cropTo?: (target: unknown) => Promise<void>;
        };
        if (player && CropTargetApi && track.cropTo) {
          await track.cropTo(await CropTargetApi.fromElement(player));
        }
      } catch {
        // Sem recorte: segue com a captura completa.
      }

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
        // Utilizador recusou o pedido de partilha de ecrã — acção normal,
        // não um erro da aplicação, por isso não é reportado.
        setError('Permissão de partilha de ecrã negada.');
      } else {
        reportError(e, { source: 'useRecording.start' });
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
