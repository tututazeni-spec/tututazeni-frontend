'use client';

// hooks/useLessonAudio.ts
// "Ouvir a aula" — reproduz o texto da lição em voz alta. O áudio é gerado
// pelo backend (GET /lessons/:id/audio, proxy da ElevenLabs — a chave nunca
// chega ao browser). Versão enxuta do antigo useCourseAvatarReader (apagado
// em #419 com o CourseAvatarReaderExample), sem o widget de avatar.
//
// Cache: por lessonId em sessionStorage (o frontend já não recebe o
// textContent no payload de /module-progress, por isso não dá para chavear
// por hash do texto como a versão anterior). Áudio de uma aula é estável
// dentro de uma sessão; se o texto for editado, o próprio backend emite
// Cache-Control: private, max-age=86400.

import { useState, useEffect, useRef, useCallback } from 'react';
import { API_URL } from '@/lib/api';
import { reportError } from '@/lib/errorReporting';

export type LessonAudioState =
  | 'idle'
  | 'loading'
  | 'playing'
  | 'paused'
  | 'error';

// Acima disto não vale a pena encher o sessionStorage (quota ~5 MB e é
// partilhada com o resto da app).
const MAX_CACHE_BYTES = 2 * 1024 * 1024;

class LessonAudioError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'LessonAudioError';
    this.status = status;
  }
}

function cacheKey(lessonId: number): string {
  return `innova_lesson_audio_${lessonId}`;
}

function loadCachedAudio(lessonId: number): string | null {
  try {
    return sessionStorage.getItem(cacheKey(lessonId));
  } catch {
    return null;
  }
}

function saveCachedAudio(lessonId: number, blob: Blob): void {
  if (blob.size > MAX_CACHE_BYTES) return;
  try {
    const reader = new FileReader();
    reader.onloadend = () => {
      try {
        sessionStorage.setItem(cacheKey(lessonId), reader.result as string);
      } catch {
        /* quota excedida — ignorar */
      }
    };
    reader.readAsDataURL(blob);
  } catch {
    /* ignorar */
  }
}

async function fetchLessonAudio(lessonId: number): Promise<Blob> {
  const res = await fetch(`${API_URL}/lessons/${lessonId}/audio`, {
    method: 'GET',
    credentials: 'include',
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new LessonAudioError(
      body?.message ?? `Erro ${res.status} ao gerar áudio`,
      res.status,
    );
  }
  return res.blob();
}

export interface UseLessonAudio {
  state: LessonAudioState;
  /** 0–100 */
  progress: number;
  error: string;
  play: () => Promise<void>;
  pause: () => void;
  stop: () => void;
}

export function useLessonAudio(lessonId: number): UseLessonAudio {
  const [state, setState] = useState<LessonAudioState>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string>('');

  const teardown = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = '';
    }
  }, []);

  // Limpar ao desmontar.
  useEffect(() => teardown, [teardown]);

  // Recomeçar do zero se a aula activa mudar.
  useEffect(() => {
    teardown();
    setState('idle');
    setProgress(0);
    setError('');
  }, [lessonId, teardown]);

  const attach = useCallback((src: string): HTMLAudioElement => {
    const audio = new Audio(src);
    audioRef.current = audio;
    audio.ontimeupdate = () => {
      if (audio.duration > 0) {
        setProgress(Math.round((audio.currentTime / audio.duration) * 100));
      }
    };
    audio.onended = () => {
      setState('idle');
      setProgress(100);
    };
    audio.onerror = () => {
      setState('error');
      setError('Erro ao reproduzir o áudio');
    };
    return audio;
  }, []);

  const play = useCallback(async () => {
    // Retomar de pausa.
    if (state === 'paused' && audioRef.current) {
      await audioRef.current.play();
      setState('playing');
      return;
    }
    // Repetir depois de terminar (áudio ainda montado).
    if (state === 'idle' && audioRef.current) {
      audioRef.current.currentTime = 0;
      setProgress(0);
      await audioRef.current.play();
      setState('playing');
      return;
    }

    setState('loading');
    setError('');
    try {
      let src = loadCachedAudio(lessonId);
      if (!src) {
        const blob = await fetchLessonAudio(lessonId);
        saveCachedAudio(lessonId, blob);
        objectUrlRef.current = URL.createObjectURL(blob);
        src = objectUrlRef.current;
      }
      const audio = attach(src);
      await audio.play();
      setState('playing');
    } catch (e) {
      // 503 = "leitura por voz não configurada" (ElevenLabs sem chaves) — é
      // um estado de configuração esperado, não um erro a reportar. O resto
      // (rede, 500, etc.) vai para o reporter — ver PR #283.
      if (!(e instanceof LessonAudioError) || e.status !== 503) {
        reportError(e, { source: 'useLessonAudio.play' });
      }
      setState('error');
      setError(
        e instanceof Error ? e.message : 'Erro desconhecido ao gerar áudio',
      );
    }
  }, [state, lessonId, attach]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setState('paused');
  }, []);

  const stop = useCallback(() => {
    audioRef.current?.pause();
    if (audioRef.current) audioRef.current.currentTime = 0;
    setState('idle');
    setProgress(0);
  }, []);

  return { state, progress, error, play, pause, stop };
}
