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
//  4. Adicionar ao .env do BACKEND (nunca ao frontend — a chave nunca deve
//     ter o prefixo NEXT_PUBLIC_, senão fica embutida no bundle do browser
//     e qualquer visitante consegue lê-la e gastar a quota da conta):
//       ELEVENLABS_API_KEY=sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
//       ELEVENLABS_VOICE_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
//     O backend expõe GET /lessons/:id/audio (JwtAuthGuard + verificação de
//     matrícula) que faz a chamada à ElevenLabs por nós — ver
//     CourseModulesService.getLessonAudio.
//
//  5. Usar o componente na página de aula (só para contentType === 'TEXT'):
//       import { CourseAvatarReader } from '@/components/CourseAvatarReader';
//       {lesson.contentType === 'TEXT' && lesson.textContent && (
//         <CourseAvatarReader
//           lessonId={lesson.id}
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
// Toda a lógica (fetch/cache/estado do player) vive em
// hooks/useCourseAvatarReader.ts — este ficheiro é só apresentação.
//
// =============================================================================

'use client';

import Image from 'next/image';
import { useCourseAvatarReader } from '@/hooks/useCourseAvatarReader';

interface CourseAvatarReaderProps {
  lessonId: number;
  text: string;
  avatarSrc: string;
  avatarName?: string;
  lang?: string;
}

export function CourseAvatarReader({
  lessonId,
  text,
  avatarSrc,
  avatarName = 'Assistente INNOVA',
}: CourseAvatarReaderProps) {
  const {
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
  } = useCourseAvatarReader(lessonId, text);

  const isPlaying = state === 'playing';
  const isLoading = state === 'loading';

  return (
    <>
      {/* ── Botão flutuante ─────────────────────────────────────────────── */}
      {!visible && (
        <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
          {tooltip && (
            <div className="relative bg-surface text-ink text-xs px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap mb-1">
              Ouvir esta aula
              <div
                className="absolute w-2 h-2 bg-surface rotate-45"
                style={{ bottom: -4, right: 20 }}
              />
            </div>
          )}

          <button
            onClick={() => setVisible(true)}
            onMouseEnter={() => setTooltip(true)}
            onMouseLeave={() => setTooltip(false)}
            className="group flex items-center gap-2.5 bg-surface border border-border shadow-lg rounded-full pl-1 pr-4 py-1 hover:shadow-xl hover:border-primary transition-all duration-200 relative"
          >
            {/* Avatar miniatura */}
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary flex-shrink-0 relative">
              <Image
                src={avatarSrc}
                alt={avatarName}
                fill
                className="object-cover"
              />
            </div>
            <span className="text-xs font-semibold text-ink group-hover:text-primary transition-colors">
              Ouvir aula
            </span>

            {/* Pulse badge */}
            <span className="absolute -top-1 -right-1 flex">
              <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-info opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-info" />
            </span>
          </button>
        </div>
      )}

      {/* ── Player ──────────────────────────────────────────────────────── */}
      {visible && (
        <div className="fixed bottom-6 right-6 z-40" style={{ width: 220 }}>
          <div
            className="bg-surface rounded-2xl overflow-hidden border border-border"
            style={{
              boxShadow:
                '0 8px 32px rgba(0,0,0,0.13), 0 2px 8px rgba(0,0,0,0.07)',
            }}
          >
            {/* Topo */}
            <div className="flex items-center justify-between px-3.5 pt-3">
              <span
                className="text-xs font-bold text-ink-faint tracking-widest uppercase"
                style={{ fontSize: 9 }}
              >
                INNOVA · Leitura
              </span>
              <button
                onClick={handleClose}
                className="w-5 h-5 rounded-full bg-surface-sunken hover:bg-danger-subtle flex items-center justify-center text-ink-faint hover:text-danger-ink transition-colors leading-none"
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
                      className="absolute -inset-3 rounded-full border-2 border-info opacity-50 animate-ping"
                      style={{ animationDuration: '1.6s' }}
                    />
                    <div
                      className="absolute -inset-5 rounded-full border border-info-subtle opacity-25 animate-ping"
                      style={{ animationDuration: '2.2s' }}
                    />
                  </>
                )}

                {/* Foto */}
                <div
                  className="w-20 h-20 rounded-full overflow-hidden relative z-10"
                  style={{
                    border: '3px solid white',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  }}
                >
                  <Image
                    src={avatarSrc}
                    alt={avatarName}
                    fill
                    className="object-cover"
                    style={{
                      filter: isPlaying
                        ? 'brightness(1.06) saturate(1.1)'
                        : 'brightness(1)',
                      transition: 'filter 0.4s ease',
                    }}
                  />
                </div>

                {/* Status badge */}
                <div
                  className={`absolute -bottom-1 left-1/2 -translate-x-1/2 z-20 px-2 py-0.5 rounded-full text-canvas font-semibold whitespace-nowrap transition-colors ${
                    isLoading
                      ? 'bg-warning'
                      : isPlaying
                        ? 'bg-info'
                        : state === 'paused'
                          ? 'bg-warning'
                          : state === 'error'
                            ? 'bg-danger'
                            : 'bg-ink-muted'
                  }`}
                  style={{ fontSize: 9 }}
                >
                  {isLoading
                    ? '⏳ A gerar…'
                    : isPlaying
                      ? '● A ler…'
                      : state === 'paused'
                        ? '⏸ Pausado'
                        : state === 'error'
                          ? '⚠ Erro'
                          : '● Pronto'}
                </div>
              </div>

              {/* Nome do avatar */}
              <div className="mt-4 text-xs font-bold text-ink text-center leading-tight">
                {avatarName}
              </div>
              <div
                className="text-xs text-ink-faint mt-0.5"
                style={{ fontSize: 9 }}
              >
                Voz IA · ElevenLabs
              </div>

              {/* Ondas de voz (só quando a tocar) */}
              {isPlaying ? (
                <div
                  className="flex items-end gap-0.5 mt-2"
                  style={{ height: 22 }}
                >
                  {Array.from({ length: 11 }, (_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-info rounded-full"
                      style={{
                        height: '100%',
                        animation: `innova_wave ${0.45 + i * 0.06}s ease-in-out infinite alternate`,
                        animationDelay: `${i * 0.055}s`,
                        transformOrigin: 'bottom',
                        minHeight: 3,
                      }}
                    />
                  ))}
                </div>
              ) : isLoading ? (
                <div
                  className="flex items-center gap-1 mt-2"
                  style={{ height: 22 }}
                >
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 bg-warning rounded-full animate-bounce"
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
              <div
                className="flex justify-between mb-1"
                style={{ fontSize: 9 }}
              >
                <span className="text-ink-faint">Progresso</span>
                <span className="text-ink-muted font-mono">{progress}%</span>
              </div>
              <div className="h-1.5 bg-surface-sunken rounded-full overflow-hidden">
                <div
                  className="h-full bg-info rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Mensagem de erro */}
            {state === 'error' && (
              <div
                className="mx-3 mb-2 px-2.5 py-2 bg-danger-subtle border border-danger rounded-lg text-danger-ink text-center leading-tight"
                style={{ fontSize: 10 }}
              >
                {errorMsg || 'Erro ao gerar áudio. Tenta novamente mais tarde.'}
              </div>
            )}

            {/* Controlos */}
            <div className="flex items-center justify-center gap-2 px-4 pb-4 pt-1">
              {/* Reiniciar */}
              <button
                onClick={handleRestart}
                disabled={isLoading || state === 'idle'}
                className="w-8 h-8 rounded-full bg-surface-sunken hover:bg-surface flex items-center justify-center text-ink-muted hover:text-ink transition-colors disabled:opacity-30"
                style={{ fontSize: 12 }}
                title="Reiniciar"
              >
                ⏮
              </button>

              {/* Play / Pause principal */}
              {isPlaying ? (
                <button
                  onClick={handlePause}
                  className="w-12 h-12 rounded-full bg-info hover:bg-info-ink flex items-center justify-center text-canvas shadow-md transition-all hover:scale-105 text-lg"
                  title="Pausar"
                >
                  ⏸
                </button>
              ) : (
                <button
                  onClick={handlePlay}
                  disabled={isLoading}
                  className="w-12 h-12 rounded-full bg-info hover:bg-info-ink flex items-center justify-center text-canvas shadow-md transition-all hover:scale-105 text-lg disabled:opacity-60 disabled:cursor-wait"
                  title={state === 'paused' ? 'Retomar' : 'Ouvir aula'}
                >
                  {isLoading ? (
                    <svg
                      className="animate-spin h-5 w-5 text-canvas"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8z"
                      />
                    </svg>
                  ) : (
                    '▶'
                  )}
                </button>
              )}

              {/* Stop */}
              <button
                onClick={handleStop}
                disabled={isLoading || state === 'idle'}
                className="w-8 h-8 rounded-full bg-surface-sunken hover:bg-surface flex items-center justify-center text-ink-muted hover:text-ink transition-colors disabled:opacity-30"
                style={{ fontSize: 12 }}
                title="Parar"
              >
                ⏹
              </button>
            </div>

            {/* Nota de quota */}
            <div
              className="text-center text-ink-faint pb-2.5 px-3 leading-tight"
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
          from {
            transform: scaleY(0.12);
            opacity: 0.45;
          }
          to {
            transform: scaleY(1);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}

export default CourseAvatarReader;
