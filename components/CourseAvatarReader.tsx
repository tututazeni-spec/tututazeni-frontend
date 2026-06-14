// src/components/CourseAvatarReader.tsx
// Avatar de leitura com voz ElevenLabs — INNOVA Academy
//
// ─── SETUP (fazer uma vez) ────────────────────────────────────────────────────
//
//  1. Criar conta gratuita em: https://elevenlabs.io
//
//  2. Clonar a tua voz:
//     → Perfil → "Voice Lab" → "Add Voice" → "Voice Cloning"
//     → Gravar ou fazer upload de 1–5 minutos de áudio
//     → Guardar o Voice ID (ex: "abc123xyz...")
//
//  3. Obter API Key:
//     → Perfil → "API Key" → copiar
//
//  4. Adicionar ao .env.local do projecto Next.js:
//       NEXT_PUBLIC_ELEVENLABS_API_KEY=sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
//       NEXT_PUBLIC_ELEVENLABS_VOICE_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
//
//  5. Usar o componente na página de aula (só para contentType === 'TEXT'):
//       import { CourseAvatarReader } from '@/components/CourseAvatarReader';
//       {lesson.contentType === 'TEXT' && lesson.textContent && (
//         <CourseAvatarReader
//           text={lesson.textContent}
//           avatarSrc="/images/avatar.png"
//           avatarName="Ana — INNOVA Academy"
//         />
//       )}
//
// ─── QUOTA GRÁTIS ─────────────────────────────────────────────────────────────
//  • 10.000 chars/mês → ~20–30 aulas médias
//  • O componente guarda o áudio em cache (sessionStorage) para não gastar
//    quota ao reler a mesma aula na mesma sessão
//  • Para quota maior: plano Starter ($5/mês) = 30.000 chars
//
// =============================================================================

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// ─── Configuração ─────────────────────────────────────────────────────────────

const ELEVENLABS_API_KEY  = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY  ?? '';
const ELEVENLABS_VOICE_ID = process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID ?? '';
const ELEVENLABS_MODEL    = 'eleven_multilingual_v2'; // suporta PT nativamente

// ─── Props ────────────────────────────────────────────────────────────────────

interface CourseAvatarReaderProps {
  text: string;
  avatarSrc: string;
  avatarName?: string;
  lang?: string;
}

type PlayerState = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sanitizeText(raw: string): string {
  return raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*|__|\*|_/g, '')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// Chave de cache baseada num hash simples do texto
function cacheKey(text: string): string {
  let hash = 0;
  for (let i = 0; i < Math.min(text.length, 200); i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash |= 0;
  }
  return `innova_audio_${Math.abs(hash)}`;
}

// Guardar blob de áudio em sessionStorage (base64)
function saveAudioCache(key: string, blob: Blob): void {
  try {
    const reader = new FileReader();
    reader.onloadend = () => {
      try {
        sessionStorage.setItem(key, reader.result as string);
      } catch { /* quota excedida — ignorar */ }
    };
    reader.readAsDataURL(blob);
  } catch { /* ignorar */ }
}

// Recuperar áudio de cache
function loadAudioCache(key: string): string | null {
  try { return sessionStorage.getItem(key); } catch { return null; }
}

// ─── Chamada ElevenLabs ───────────────────────────────────────────────────────

async function fetchElevenLabsAudio(text: string): Promise<Blob> {
  if (!ELEVENLABS_API_KEY || !ELEVENLABS_VOICE_ID) {
    throw new Error('ELEVENLABS_API_KEY ou ELEVENLABS_VOICE_ID não configurados em .env.local');
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
    {
      method: 'POST',
      headers: {
        'Accept':       'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key':   ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text,
        model_id: ELEVENLABS_MODEL,
        voice_settings: {
          stability:        0.50,  // 0.0–1.0 (mais alto = mais consistente)
          similarity_boost: 0.80,  // 0.0–1.0 (mais alto = mais parecido com a voz clonada)
          style:            0.20,  // expressividade
          use_speaker_boost:true,
        },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.detail?.message ?? `ElevenLabs erro ${response.status}`);
  }

  return response.blob();
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function CourseAvatarReader({
  text,
  avatarSrc,
  avatarName = 'Assistente INNOVA',
}: CourseAvatarReaderProps) {
  const [visible, setVisible]   = useState(false);
  const [state, setState]       = useState<PlayerState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [progress, setProgress] = useState(0);
  const [tooltip, setTooltip]   = useState(false);

  const audioRef   = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef= useRef<string>('');

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

  // ─── Carregar e tocar áudio ───────────────────────────────────────────────

  const loadAndPlay = useCallback(async () => {
    setState('loading');
    setErrorMsg('');

    const cleanText = sanitizeText(text);
    const key       = cacheKey(cleanText);

    try {
      let audioSrc: string;

      // 1. Verificar cache para não gastar quota
      const cached = loadAudioCache(key);
      if (cached) {
        audioSrc = cached;
      } else {
        // 2. Gerar áudio via ElevenLabs
        const blob = await fetchElevenLabsAudio(
          cleanText.length > 5000
            ? cleanText.slice(0, 5000) + '...'  // segurança: limita a 5k chars por chamada
            : cleanText
        );
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

    } catch (e: any) {
      setState('error');
      setErrorMsg(e.message ?? 'Erro desconhecido');
    }
  }, [text]);

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

  // ─── UI ────────────────────────────────────────────────────────────────────

  const isPlaying = state === 'playing';
  const isLoading = state === 'loading';

  return (
    <>
      {/* ── Botão flutuante ─────────────────────────────────────────────── */}
      {!visible && (
        <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
          {tooltip && (
            <div className="relative bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap mb-1">
              Ouvir esta aula
              <div
                className="absolute w-2 h-2 bg-gray-900 rotate-45"
                style={{ bottom: -4, right: 20 }}
              />
            </div>
          )}

          <button
            onClick={() => setVisible(true)}
            onMouseEnter={() => setTooltip(true)}
            onMouseLeave={() => setTooltip(false)}
            className="group flex items-center gap-2.5 bg-white border border-gray-200 shadow-lg rounded-full pl-1 pr-4 py-1 hover:shadow-xl hover:border-blue-300 transition-all duration-200 relative"
          >
            {/* Avatar miniatura */}
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-blue-500 flex-shrink-0">
              <img src={avatarSrc} alt={avatarName} className="w-full h-full object-cover" />
            </div>
            <span className="text-xs font-semibold text-gray-700 group-hover:text-blue-700 transition-colors">
              Ouvir aula
            </span>

            {/* Pulse badge */}
            <span className="absolute -top-1 -right-1 flex">
              <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500" />
            </span>
          </button>
        </div>
      )}

      {/* ── Player ──────────────────────────────────────────────────────── */}
      {visible && (
        <div className="fixed bottom-6 right-6 z-40" style={{ width: 220 }}>
          <div
            className="bg-white rounded-2xl overflow-hidden border border-gray-200"
            style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.13), 0 2px 8px rgba(0,0,0,0.07)' }}
          >
            {/* Topo */}
            <div className="flex items-center justify-between px-3.5 pt-3">
              <span className="text-xs font-bold text-gray-400 tracking-widest uppercase" style={{ fontSize: 9 }}>
                INNOVA · Leitura
              </span>
              <button
                onClick={handleClose}
                className="w-5 h-5 rounded-full bg-gray-100 hover:bg-red-100 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors leading-none"
                style={{ fontSize: 10 }}
              >
                ✕
              </button>
            </div>

            {/* Avatar */}
            <div className="flex flex-col items-center px-4 pt-3 pb-2">
              <div className="relative">
                {/* Anel animado quando a tocar */}
                {isPlaying && (
                  <>
                    <div
                      className="absolute -inset-3 rounded-full border-2 border-blue-400 opacity-50 animate-ping"
                      style={{ animationDuration: '1.6s' }}
                    />
                    <div
                      className="absolute -inset-5 rounded-full border border-blue-200 opacity-25 animate-ping"
                      style={{ animationDuration: '2.2s' }}
                    />
                  </>
                )}

                {/* Foto */}
                <div
                  className="w-20 h-20 rounded-full overflow-hidden relative z-10"
                  style={{ border: '3px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                >
                  <img
                    src={avatarSrc}
                    alt={avatarName}
                    className="w-full h-full object-cover"
                    style={{
                      filter:     isPlaying ? 'brightness(1.06) saturate(1.1)' : 'brightness(1)',
                      transition: 'filter 0.4s ease',
                    }}
                  />
                </div>

                {/* Status badge */}
                <div
                  className={`absolute -bottom-1 left-1/2 -translate-x-1/2 z-20 px-2 py-0.5 rounded-full text-white font-semibold whitespace-nowrap transition-colors ${
                    isLoading ? 'bg-amber-500' :
                    isPlaying ? 'bg-blue-500'  :
                    state === 'paused' ? 'bg-amber-500' :
                    state === 'error'  ? 'bg-red-500'   :
                    'bg-gray-400'
                  }`}
                  style={{ fontSize: 9 }}
                >
                  {isLoading ? '⏳ A gerar…' :
                   isPlaying ? '● A ler…'   :
                   state === 'paused' ? '⏸ Pausado' :
                   state === 'error'  ? '⚠ Erro'    :
                   '● Pronto'}
                </div>
              </div>

              {/* Nome do avatar */}
              <div className="mt-4 text-xs font-bold text-gray-800 text-center leading-tight">{avatarName}</div>
              <div className="text-xs text-gray-400 mt-0.5" style={{ fontSize: 9 }}>Voz IA · ElevenLabs</div>

              {/* Ondas de voz (só quando a tocar) */}
              {isPlaying ? (
                <div className="flex items-end gap-0.5 mt-2" style={{ height: 22 }}>
                  {Array.from({ length: 11 }, (_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-blue-400 rounded-full"
                      style={{
                        height:           '100%',
                        animation:        `innova_wave ${0.45 + i * 0.06}s ease-in-out infinite alternate`,
                        animationDelay:   `${i * 0.055}s`,
                        transformOrigin:  'bottom',
                        minHeight:        3,
                      }}
                    />
                  ))}
                </div>
              ) : isLoading ? (
                <div className="flex items-center gap-1 mt-2" style={{ height: 22 }}>
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              ) : (
                <div style={{ height: 22, marginTop: 8 }} />
              )}
            </div>

            {/* Barra de progresso */}
            <div className="px-4 pb-1.5">
              <div className="flex justify-between mb-1" style={{ fontSize: 9 }}>
                <span className="text-gray-400">Progresso</span>
                <span className="text-gray-500 font-mono">{progress}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Mensagem de erro */}
            {state === 'error' && (
              <div className="mx-3 mb-2 px-2.5 py-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-center leading-tight" style={{ fontSize: 10 }}>
                {errorMsg || 'Erro ao gerar áudio. Verifica a API Key.'}
              </div>
            )}

            {/* Controlos */}
            <div className="flex items-center justify-center gap-2 px-4 pb-4 pt-1">
              {/* Reiniciar */}
              <button
                onClick={handleRestart}
                disabled={isLoading || state === 'idle'}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-30"
                style={{ fontSize: 12 }}
                title="Reiniciar"
              >
                ⏮
              </button>

              {/* Play / Pause principal */}
              {isPlaying ? (
                <button
                  onClick={handlePause}
                  className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center text-white shadow-md transition-all hover:scale-105 text-lg"
                  title="Pausar"
                >
                  ⏸
                </button>
              ) : (
                <button
                  onClick={handlePlay}
                  disabled={isLoading}
                  className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center text-white shadow-md transition-all hover:scale-105 text-lg disabled:opacity-60 disabled:cursor-wait"
                  title={state === 'paused' ? 'Retomar' : 'Ouvir aula'}
                >
                  {isLoading ? (
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  ) : '▶'}
                </button>
              )}

              {/* Stop */}
              <button
                onClick={handleStop}
                disabled={isLoading || state === 'idle'}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-30"
                style={{ fontSize: 12 }}
                title="Parar"
              >
                ⏹
              </button>
            </div>

            {/* Nota de quota */}
            <div
              className="text-center text-gray-300 pb-2.5 px-3 leading-tight"
              style={{ fontSize: 8 }}
            >
              Áudio gerado por ElevenLabs · guardado em cache por sessão
            </div>
          </div>
        </div>
      )}

      {/* ── Animação CSS ──────────────────────────────────────────────────── */}
      <style jsx global>{`
        @keyframes innova_wave {
          from { transform: scaleY(0.12); opacity: 0.45; }
          to   { transform: scaleY(1);    opacity: 1; }
        }
      `}</style>
    </>
  );
}

export default CourseAvatarReader;
