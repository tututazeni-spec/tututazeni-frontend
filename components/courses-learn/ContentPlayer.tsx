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

'use client';

import { Component, useState, type ReactNode } from 'react';
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

/** Mensagem centrada para os estados sem conteúdo / com falha. */
function StageNotice({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof FileText;
  title: string;
  children?: ReactNode;
}) {
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
  const fileSrc = useBlobSrc(lesson.contentUrl);
  const [showTranscript, setShowTranscript] = useState(false);
  const embed =
    lesson.contentUrl && /^https?:/.test(lesson.contentUrl)
      ? embeddableVideoUrl(lesson.contentUrl)
      : null;
  const isVideo = lesson.type === 'VIDEO';
  const materials = currentModule?.materials ?? [];

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
            isVideo ? 'bg-ink' : 'bg-[#E9EDF4]'
          }`}
        >
          <StageBoundary resetKey={lesson.id} title={lesson.title}>
            {lesson.type === 'VIDEO' ? (
              lesson.contentUrl ? (
                <div className="w-full h-full flex flex-col">
                  <div className="flex-1 aspect-video max-h-[70vh] mx-auto w-full">
                    {embed ? (
                      <iframe
                        src={embed}
                        title={lesson.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full border-0"
                      />
                    ) : (
                      <video
                        controls
                        className="w-full h-full bg-black"
                        src={fileSrc ?? lesson.contentUrl}
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
            ) : lesson.type === 'PDF' ? (
              fileSrc ? (
                <PdfViewer src={fileSrc} title={lesson.title} />
              ) : (
                <StageNotice icon={FileText} title={lesson.title}>
                  Esta aula ainda não tem ficheiro PDF carregado.
                </StageNotice>
              )
            ) : lesson.type === 'SLIDE' ? (
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
            ) : lesson.type === 'AUDIO' ? (
              <div className="w-full max-w-lg px-8 py-10 text-center text-ink">
                <Music
                  size={56}
                  strokeWidth={1.5}
                  className="mx-auto mb-4 text-ink-muted"
                />
                <div className="font-body text-base font-semibold mb-4">
                  {lesson.title}
                </div>
                {fileSrc ? (
                  <audio controls className="w-full" src={fileSrc} />
                ) : (
                  <p className="font-body text-sm text-ink-muted">
                    Esta aula ainda não tem ficheiro de áudio carregado.
                  </p>
                )}
              </div>
            ) : lesson.type === 'LIVE' ? (
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
                    className="inline-block mt-4 rounded-lg bg-[#0F1F3D] px-4 py-2 font-body text-sm font-semibold text-white hover:bg-[#1B2F57]"
                  >
                    Entrar na sessão
                  </a>
                ) : (
                  <p className="font-body text-sm text-ink-muted mt-4">
                    O link da sessão ainda não está disponível.
                  </p>
                )}
              </div>
            ) : lesson.type === 'TEXT' ? (
              <article className="my-6 w-full max-w-2xl rounded-3xl border border-[#E4E9F2] bg-white p-8 text-ink shadow-[0_8px_24px_rgba(15,31,61,0.08)]">
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
            ) : lesson.type === 'LINK' ? (
              <StageNotice icon={Link2} title={lesson.title}>
                {lesson.contentUrl ? (
                  <>
                    Esta aula é uma ligação externa.
                    <div>
                      <OpenButton url={lesson.contentUrl}>
                        Abrir ligação
                      </OpenButton>
                    </div>
                  </>
                ) : (
                  'Esta aula ainda não tem ligação associada.'
                )}
              </StageNotice>
            ) : lesson.type === 'SCORM' ? (
              lesson.contentUrl && fileSrc ? (
                <div className="flex h-[70vh] w-full flex-col bg-white">
                  <iframe
                    src={fileSrc}
                    title={lesson.title}
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                    className="h-full w-full flex-1 border-0"
                  />
                  <div className="border-t border-border px-6 py-2 text-center">
                    <OpenButton url={lesson.contentUrl}>
                      Abrir em ecrã inteiro
                    </OpenButton>
                  </div>
                </div>
              ) : (
                <StageNotice icon={Package} title={lesson.title}>
                  Esta aula ainda não tem pacote SCORM associado.
                </StageNotice>
              )
            ) : lesson.type === 'QUIZ' ? (
              <StageNotice icon={lessonIcon('QUIZ')} title={lesson.title}>
                {lesson.quizId
                  ? 'Esta aula é uma avaliação. Responda ao quiz abaixo.'
                  : 'Esta aula ainda não tem quiz associado.'}
              </StageNotice>
            ) : (
              <StageNotice
                icon={lessonIcon(lesson.type)}
                title={lesson.title}
              />
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
          lesson.type === 'PDF' && lesson.allowDownload && fileSrc ? (
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
