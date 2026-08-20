// hooks/useCourseAvatarReader.ts
// Extraído de components/CourseAvatarReader.tsx — o "leitor de avatar" era
// um widget suposto reutilizável/apresentacional mas tinha ~450 linhas com
// fetch ao backend, cache em sessionStorage e controlo completo do elemento
// <audio> misturados com o JSX do player.

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { API_URL } from '@/lib/api';
import { reportError } from '@/lib/errorReporting';
import {
  sanitizeText,
  cacheKey,
  saveAudioCache,
  loadAudioCache,
} from '@/lib/audioCache';

export type PlayerState = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

// Chamada ao backend (proxy da ElevenLabs — a chave nunca chega ao browser).
async function fetchLessonAudio(lessonId: number): Promise<Blob> {
  const response = await fetch(`${API_URL}/lessons/${lessonId}/audio`, {
    method: 'GET',
    credentials: 'include', // cookie httpOnly, mesmo padrão do resto da app
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.message ?? `Erro ${response.status} ao gerar áudio`);
  }

  return response.blob();
}

export function useCourseAvatarReader(lessonId: number, text: string) {
  const [visible, setVisible] = useState(false);
  const [state, setState] = useState<PlayerState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [progress, setProgress] = useState(0);
  const [tooltip, setTooltip] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string>('');

  // Limpar URL de objeto ao desmontar
  useEffect(() => {
    return () => {
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      audioRef.current?.pause();
    };
  }, []);

  // Reset ao fechar
  useEffect(() => {
    if (!visible) {
      audioRef.current?.pause();
      setState('idle');
      setProgress(0);
    }
  }, [visible]);

  const loadAndPlay = useCallback(async () => {
    setState('loading');
    setErrorMsg('');

    const cleanText = sanitizeText(text);
    const key = cacheKey(cleanText);

    try {
      let audioSrc: string;

      // 1. Verificar cache para não gastar quota
      const cached = loadAudioCache(key);
      if (cached) {
        audioSrc = cached;
      } else {
        // 2. Gerar áudio via backend (proxy da ElevenLabs)
        const blob = await fetchLessonAudio(lessonId);
        saveAudioCache(key, blob);

        // Liberar URL anterior
        if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = URL.createObjectURL(blob);
        audioSrc = audioUrlRef.current;
      }

      // 3. Criar elemento de áudio
      const audio = new Audio(audioSrc);
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
        setErrorMsg('Erro ao reproduzir áudio');
      };

      await audio.play();
      setState('playing');
    } catch (e) {
      reportError(e, { source: 'useCourseAvatarReader.play' });
      setState('error');
      setErrorMsg(e instanceof Error ? e.message : 'Erro desconhecido');
    }
  }, [text, lessonId]);

  const handlePlay = async () => {
    if (state === 'paused' && audioRef.current) {
      await audioRef.current.play();
      setState('playing');
    } else if (state === 'idle' || state === 'error') {
      await loadAndPlay();
    }
  };

  const handlePause = () => {
    audioRef.current?.pause();
    setState('paused');
  };

  const handleStop = () => {
    audioRef.current?.pause();
    if (audioRef.current) audioRef.current.currentTime = 0;
    setState('idle');
    setProgress(0);
  };

  const handleRestart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setState('playing');
      setProgress(0);
    } else {
      loadAndPlay();
    }
  };

  const handleClose = () => {
    audioRef.current?.pause();
    if (audioRef.current) audioRef.current.currentTime = 0;
    setState('idle');
    setProgress(0);
    setVisible(false);
  };

  return {
    visible,
    setVisible,
    state,
    errorMsg,
    progress,
    tooltip,
    setTooltip,
    handlePlay,
    handlePause,
    handleStop,
    handleRestart,
    handleClose,
  };
}
