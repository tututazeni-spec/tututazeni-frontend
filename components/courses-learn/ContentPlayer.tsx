// components/courses-learn/ContentPlayer.tsx
// Área de reprodução da lição activa — abre todos os tipos de conteúdo
// (vídeo, PDF, PPTX, texto, áudio, ligação, SCORM, quiz e aula ao vivo) — e,
// por baixo, as actividades, os recursos, os materiais do módulo e a avaliação,
// mais a barra de conclusão e navegação. Extraído de
// app/(platform)/courses/[courseId]/learn/page.tsx.
//
// A área de conteúdo é clara (e escura só para vídeo): antes era sempre escura
// e qualquer estado sem leitor ou com falha parecia um ecrã preto. Cada
// lição fica ainda dentro de um StageBoundary — uma falha ao desenhar o
// conteúdo mostra uma mensagem em vez de deixar o ecrã vazio.
//
// Correcções desta versão:
//  - Áudio por URL do Spotify (embed do Spotify em vez de <audio>).
//  - Vídeo por URL do YouTube/Vimeo convertido sempre para embed.
//  - O tipo da lição é normalizado e, se o tipo gravado não bater certo com o
//    conteúdo (ex.: link do YouTube gravado como LINK), deduz-se pela URL.
//  - URLs externas (YouTube/Spotify) já não passam pelo useBlobSrc.
//  - Tipo desconhecido mostra o valor recebido (útil para diagnosticar).
//  - Em desenvolvimento, regista no Console o que a lição trouxe.

'use client';

import { Component, useEffect, useState, type ReactNode } from 'react';
import {
  Play,
  FileText,
  BarChart3,
  Calendar,
  Link2,
  Package,
  FileWarning,
  Music,
} from 'lucide-react';
import { PdfViewer } from '@/components/viewers/PdfViewer';
import { PptxViewer } from '@/components/viewers/PptxViewer';
import { LessonAudioBar } from './LessonAudioBar';
import { QuizPlayer } from './QuizPlayer';
import { ActivityList, FileList, OpenButton } from './LessonExtras';
import { embeddableVideoUrl, useBlobSrc } from './fileSrc';
import { lessonIcon } from './utils';
import { LessonFooter } from './LessonFooter';
import type { LessonProgress, ModuleProgress } from './types';
import { safeHref } from '@/lib/safeHref';

// ─── Embeds externos (YouTube, Vimeo, Spotify) ──────────────────────────────

function parseHttpUrl(raw?: string | null): URL | null {
  if (!raw) return null;
  try {
    const url = new URL(raw.trim());
    return url.protocol === 'http:' || url.protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
}

/** YouTube / Vimeo → URL de embed. Devolve null se não for nenhum dos dois. */
function videoEmbedUrl(raw?: string | null): string | null {
  const url = parseHttpUrl(raw);
  if (!url) return null;
  const host = url.hostname.replace(/^(www|m)\./, '');

  let id: string | null = null;
  if (host === 'youtu.be') {
    id = url.pathname.split('/')[1] ?? null;
  } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    id =
      url.searchParams.get('v') ??
      url.pathname.match(/^\/(?:embed|shorts|live|v)\/([\w-]{11})/)?.[1] ??
      null;
  }
  if (id && /^[\w-]{11}$/.test(id)) {
    return `https://www.youtube-nocookie.com/embed/${id}`;
  }

  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const match = url.pathname.match(/\/(?:video\/)?(\d+)/);
    if (match) return `https://player.vimeo.com/video/${match[1]}`;
  }
  return null;
}

/** open.spotify.com/(episode|track|show|playlist|album)/ID → embed do Spotify. */
function spotifyEmbed(
  raw?: string | null,
): { src: string; height: number } | null {
  const url = parseHttpUrl(raw);
  if (!url || url.hostname !== 'open.spotify.com') return null;
  // aceita também /intl-pt/episode/ID
  const match = url.pathname.match(
    /\/(episode|track|show|playlist|album)\/([A-Za-z0-9]+)/,
  );
  if (!match) return null;
  const [, kind, id] = match;
  return {
    src: `https://open.spotify.com/embed/${kind}/${id}`,
    height: kind === 'episode' || kind === 'track' ? 152 : 352,
  };
}

// ─── Tipo efectivo da lição ─────────────────────────────────────────────────

type Kind =
  | 'VIDEO'
  | 'PDF'
  | 'SLIDE'
  | 'AUDIO'
  | 'LIVE'
  | 'TEXT'
  | 'LINK'
  | 'SCORM'
  | 'QUIZ'
  | 'UNKNOWN';

const TYPE_ALIASES: Record<string, Kind> = {
  VIDEO: 'VIDEO',
  VIDEO_URL: 'VIDEO',
  YOUTUBE: 'VIDEO',
  VIMEO: 'VIDEO',
  PDF: 'PDF',
  SLIDE: 'SLIDE',
  SLIDES: 'SLIDE',
  PPT: 'SLIDE',
  PPTX: 'SLIDE',
  PRESENTATION: 'SLIDE',
  AUDIO: 'AUDIO',
  AUDIO_URL: 'AUDIO',
  PODCAST: 'AUDIO',
  SPOTIFY: 'AUDIO',
  LIVE: 'LIVE',
  TEXT: 'TEXT',
  ARTICLE: 'TEXT',
  RICHTEXT: 'TEXT',
  LINK: 'LINK',
  URL: 'LINK',
  SCORM: 'SCORM',
  QUIZ: 'QUIZ',
};

const EXTENSION_KIND: Record<string, Kind> = {
  pdf: 'PDF',
  ppt: 'SLIDE',
  pptx: 'SLIDE',
  mp3: 'AUDIO',
  m4a: 'AUDIO',
  wav: 'AUDIO',
  ogg: 'AUDIO',
  mp4: 'VIDEO',
  webm: 'VIDEO',
  mov: 'VIDEO',
};

function resolveKind(lesson: LessonProgress): Kind {
  const base: Kind =
    TYPE_ALIASES[String(lesson.type).trim().toUpperCase()] ?? 'UNKNOWN';

  // Link do YouTube/Vimeo/Spotify gravado como LINK (ou tipo desconhecido)
  // abre como vídeo/áudio embebido.
  if (
    base === 'VIDEO' ||
    base === 'AUDIO' ||
    base === 'LINK' ||
    base === 'UNKNOWN'
  ) {
    if (videoEmbedUrl(lesson.contentUrl)) return 'VIDEO';
    if (spotifyEmbed(lesson.contentUrl)) return 'AUDIO';
  }
  if (base !== 'UNKNOWN') return base;

  // Tipo desconhecido: deduz pela extensão do ficheiro ou pela presença de texto.
  const extension = lesson.contentUrl
    ? (lesson.contentUrl.split(/[?#]/)[0].split('.').pop()?.toLowerCase() ?? '')
    : '';
  if (EXTENSION_KIND[extension]) return EXTENSION_KIND[extension];
  if (lesson.textContent) return 'TEXT';
  return 'UNKNOWN';
}

// ─── Componentes auxiliares ─────────────────────────────────────────────────

interface ContentPlayerProps {
  lesson: LessonProgress;
  onComplete: () => void;
  completing: boolean;
  currentModule: ModuleProgress | null;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
}

interface StageNoticeProps {
  icon: typeof FileText;
  title: string;
  children?: ReactNode;
}

/** Mensagem centrada para os estados sem conteúdo / com falha. */
function StageNotice({ icon: Icon, title, children }: StageNoticeProps) {
  return (
    <div className="px-8 py-10 text-center text-ink">
      <Icon
        size={56}
        strokeWidth={1.5}
        className="mx-auto mb-4 text-ink-muted"
      />
      <div className="font-body text-base font-semibold">{title}</div>
      {children && (
        <div className="mx-auto mt-2 max-w-md font-body text-sm text-ink-muted">
          {children}
        </div>
      )}
    </div>
  );
}

/** Falha ao desenhar o conteúdo → mensagem, nunca um ecrã vazio. Repõe-se ao mudar de lição. */
class StageBoundary extends Component<
  { resetKey: number; title: string; children: ReactNode },
  { failedKey: number | null }
> {
  state = { failedKey: null as number | null };

  static getDerivedStateFromError() {
    return { failedKey: -1 };
  }

  componentDidCatch() {
    this.setState({ failedKey: this.props.resetKey });
  }

  componentDidUpdate(prev: { resetKey: number }) {
    if (
      prev.resetKey !== this.props.resetKey &&
      this.state.failedKey !== null
    ) {
      this.setState({ failedKey: null });
    }
  }

  render() {
    if (this.state.failedKey !== null) {
      return (
        <StageNotice icon={FileWarning} title={this.props.title}>
          Não foi possível mostrar o conteúdo desta aula. Tente de novo ou
          avance para outra aula.
        </StageNotice>
      );
    }
    return this.props.children;
  }
}

// ─── ContentPlayer ──────────────────────────────────────────────────────────

export function ContentPlayer({
  lesson,
  onComplete,
  completing,
  currentModule,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
}: ContentPlayerProps) {
  const contentUrl = lesson.contentUrl;
  const kind = resolveKind(lesson);

  const videoEmbed =
    kind === 'VIDEO' && contentUrl
      ? (videoEmbedUrl(contentUrl) ??
        (/^https?:/.test(contentUrl) ? embeddableVideoUrl(contentUrl) : null))
      : null;
  const audioEmbed = kind === 'AUDIO' ? spotifyEmbed(contentUrl) : null;

  // URLs externas (YouTube/Spotify) não são ficheiros: não se descarregam.
  const fileSrc = useBlobSrc(videoEmbed || audioEmbed ? null : contentUrl);

  const [showTranscript, setShowTranscript] = useState(false);
  const isVideo = kind === 'VIDEO';
  const materials = currentModule?.materials ?? [];
  const audioSrc = fileSrc ?? contentUrl ?? undefined;

  // Diagnóstico (só em desenvolvimento): o que a lição realmente trouxe.
  // Pode apagar este bloco quando tudo estiver a funcionar.
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    console.debug('[ContentPlayer]', {
      id: lesson.id,
      type: lesson.type,
      kind,
      contentUrl,
      hasText: Boolean(lesson.textContent),
      fileSrc,
    });
  }, [lesson.id, lesson.type, lesson.textContent, kind, contentUrl, fileSrc]);

  return (
    <div className="flex flex-col h-full">
      {/* Module breadcrumb */}
      {currentModule && (
        <div className="px-6 py-2 border-b border-border bg-surface-sunken font-body text-xs text-ink-muted flex items-center gap-2">
          <span className="font-medium">{currentModule.title}</span>
          <span className="text-ink-faint">›</span>
          <span>{lesson.title}</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {/* Área do conteúdo */}
        <div
          className={`min-h-[50vh] flex items-center justify-center ${
            isVideo ? 'bg-ink' : 'bg-brand-soft'
          }`}
        >
          <StageBoundary resetKey={lesson.id} title={lesson.title}>
            {kind === 'VIDEO' ? (
              contentUrl ? (
                <div className="w-full h-full flex flex-col">
                  <div className="flex-1 aspect-video max-h-[70vh] mx-auto w-full">
                    {videoEmbed ? (
                      <iframe
                        src={videoEmbed}
                        title={lesson.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full border-0"
                      />
                    ) : (
                      <video
                        controls
                        className="w-full h-full bg-black"
                        src={fileSrc ?? contentUrl}
                      >
                        {lesson.captionsUrl && (
                          <track
                            kind="captions"
                            src={lesson.captionsUrl}
                            default
                          />
                        )}
                      </video>
                    )}
                  </div>
                  {lesson.transcript && (
                    <div className="px-6 py-3 bg-ink border-t border-canvas/10">
                      <button
                        type="button"
                        onClick={() => setShowTranscript((v) => !v)}
                        className="font-body text-xs text-canvas/70 hover:text-canvas underline"
                      >
                        {showTranscript
                          ? 'Ocultar transcrição'
                          : 'Ver transcrição'}
                      </button>
                      {showTranscript && (
                        <p className="mt-2 font-body text-sm text-canvas/80 whitespace-pre-wrap leading-relaxed">
                          {lesson.transcript}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="px-8 py-10 text-center text-canvas">
                  <Play size={56} strokeWidth={1.5} className="mx-auto mb-4" />
                  <div className="font-body text-base font-medium">
                    {lesson.title}
                  </div>
                  <div className="font-body text-sm text-canvas/70 mt-2">
                    Esta aula ainda não tem vídeo associado.
                  </div>
                </div>
              )
            ) : kind === 'PDF' ? (
              fileSrc ? (
                <PdfViewer src={fileSrc} title={lesson.title} />
              ) : (
                <StageNotice icon={FileText} title={lesson.title}>
                  Esta aula ainda não tem ficheiro PDF carregado.
                </StageNotice>
              )
            ) : kind === 'SLIDE' ? (
              fileSrc ? (
                <div className="w-full h-full flex flex-col">
                  <div className="flex-1 min-h-0">
                    <PptxViewer src={fileSrc} title={lesson.title} />
                  </div>
                  <div className="px-6 py-3 border-t border-border text-center">
                    <a
                      href={fileSrc}
                      download={`${lesson.title}.pptx`}
                      className="font-body text-xs text-ink-muted hover:text-ink underline"
                    >
                      Descarregar apresentação
                    </a>
                  </div>
                </div>
              ) : (
                <StageNotice icon={BarChart3} title={lesson.title}>
                  Esta aula ainda não tem ficheiro PPTX carregado.
                </StageNotice>
              )
            ) : kind === 'AUDIO' ? (
              <div className="w-full max-w-lg px-8 py-10 text-center text-ink">
                <Music
                  size={56}
                  strokeWidth={1.5}
                  className="mx-auto mb-4 text-ink-muted"
                />
                <div className="font-body text-base font-semibold mb-4">
                  {lesson.title}
                </div>
                {audioEmbed ? (
                  <iframe
                    src={audioEmbed.src}
                    title={lesson.title}
                    width="100%"
                    height={audioEmbed.height}
                    allow="encrypted-media; clipboard-write"
                    loading="lazy"
                    className="rounded-xl border-0"
                  />
                ) : audioSrc ? (
                  <audio controls className="w-full" src={audioSrc} />
                ) : (
                  <p className="font-body text-sm text-ink-muted">
                    Esta aula ainda não tem áudio associado.
                  </p>
                )}
              </div>
            ) : kind === 'LIVE' ? (
              <div className="px-8 py-10 text-center text-ink">
                <Calendar
                  size={56}
                  strokeWidth={1.5}
                  className="mx-auto mb-4 text-ink-muted"
                />
                <div className="font-body text-base font-semibold">
                  {lesson.title}
                </div>
                {lesson.liveDate ? (
                  <div className="font-body text-sm text-ink-muted mt-2">
                    {new Date(lesson.liveDate).toLocaleString('pt', {
                      dateStyle: 'long',
                      timeStyle: 'short',
                    })}
                  </div>
                ) : (
                  <div className="font-body text-sm text-ink-muted mt-2">
                    Data ainda por confirmar
                  </div>
                )}
                {lesson.liveInstructor && (
                  <div className="font-body text-sm text-ink-muted mt-1">
                    Com {lesson.liveInstructor.fullName}
                  </div>
                )}
                {lesson.liveSessionUrl ? (
                  <a
                    href={safeHref(lesson.liveSessionUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-4 rounded-control bg-brand px-4 py-2 font-body text-sm font-semibold text-white hover:bg-[#1B2F57]"
                  >
                    Entrar na sessão
                  </a>
                ) : (
                  <p className="font-body text-sm text-ink-muted mt-4">
                    O link da sessão ainda não está disponível.
                  </p>
                )}
              </div>
            ) : kind === 'TEXT' ? (
              <article className="my-6 w-full max-w-2xl rounded-panel border border-brand-line bg-surface p-8 text-ink shadow-[0_8px_24px_rgba(15,31,61,0.08)]">
                <h2 className="font-display text-xl font-semibold mb-4">
                  {lesson.title}
                </h2>
                {lesson.textContent ? (
                  <p className="font-body text-ink leading-relaxed whitespace-pre-wrap">
                    {lesson.textContent}
                  </p>
                ) : (
                  <p className="font-body text-ink-muted leading-relaxed italic">
                    Esta aula ainda não tem conteúdo escrito.
                  </p>
                )}
                <LessonAudioBar lessonId={lesson.id} />
              </article>
            ) : kind === 'LINK' ? (
              <StageNotice icon={Link2} title={lesson.title}>
                {contentUrl ? (
                  <>
                    Esta aula é uma ligação externa.
                    <div>
                      <OpenButton url={contentUrl}>Abrir ligação</OpenButton>
                    </div>
                  </>
                ) : (
                  'Esta aula ainda não tem ligação associada.'
                )}
              </StageNotice>
            ) : kind === 'SCORM' ? (
              contentUrl && fileSrc ? (
                <div className="flex h-[70vh] w-full flex-col bg-surface">
                  <iframe
                    src={fileSrc}
                    title={lesson.title}
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                    className="h-full w-full flex-1 border-0"
                  />
                  <div className="border-t border-border px-6 py-2 text-center">
                    <OpenButton url={contentUrl}>
                      Abrir em ecrã inteiro
                    </OpenButton>
                  </div>
                </div>
              ) : (
                <StageNotice icon={Package} title={lesson.title}>
                  Esta aula ainda não tem pacote SCORM associado.
                </StageNotice>
              )
            ) : kind === 'QUIZ' ? (
              <StageNotice icon={lessonIcon('QUIZ')} title={lesson.title}>
                {lesson.quizId
                  ? 'Esta aula é uma avaliação. Responda ao quiz abaixo.'
                  : 'Esta aula ainda não tem quiz associado.'}
              </StageNotice>
            ) : (
              <StageNotice icon={lessonIcon(lesson.type)} title={lesson.title}>
                Tipo de aula não reconhecido: {String(lesson.type)}
              </StageNotice>
            )}
          </StageBoundary>
        </div>

        {/* Actividades da aula */}
        {lesson.activities.length > 0 && (
          <div className="px-6 py-5 border-t border-border">
            <h3 className="font-body text-sm font-semibold text-ink mb-3">
              Actividades
            </h3>
            <ActivityList activities={lesson.activities} />
          </div>
        )}

        {/* Recursos da aula */}
        {lesson.resources.length > 0 && (
          <div className="px-6 py-5 border-t border-border">
            <h3 className="font-body text-sm font-semibold text-ink mb-3">
              Recursos
            </h3>
            <FileList files={lesson.resources} />
          </div>
        )}

        {/* Materiais do módulo */}
        {materials.length > 0 && (
          <div className="px-6 py-5 border-t border-border">
            <h3 className="font-body text-sm font-semibold text-ink mb-3">
              Materiais do módulo
            </h3>
            <FileList files={materials} />
          </div>
        )}

        {/* Avaliação (quiz) — docs/06-modulo-courses.md secção 8 */}
        {lesson.quizId && (
          <div className="px-6 py-5 border-t border-border">
            <h3 className="font-body text-sm font-semibold text-ink mb-3">
              Avaliação
            </h3>
            <QuizPlayer quizId={lesson.quizId} />
          </div>
        )}
      </div>

      <LessonFooter
        title={lesson.title}
        durationMinutes={lesson.durationMinutes}
        completed={lesson.completed}
        completing={completing}
        onComplete={onComplete}
        onPrevious={onPrevious}
        onNext={onNext}
        hasPrevious={hasPrevious}
        hasNext={hasNext}
        extra={
          kind === 'PDF' && lesson.allowDownload && fileSrc ? (
            <a
              href={fileSrc}
              download={`${lesson.title}.pdf`}
              className="font-body text-xs text-accent hover:text-accent-hover"
            >
              Descarregar PDF
            </a>
          ) : null
        }
      />
    </div>
  );
}