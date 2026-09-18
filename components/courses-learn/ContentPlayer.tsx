// components/courses-learn/ContentPlayer.tsx
// Área de reprodução da lição activa (vídeo/PDF/texto/áudio/ao vivo) +
// actividades/recursos + barra de conclusão e navegação. Extraído de
// app/(platform)/courses/[courseId]/learn/page.tsx.

'use client';

import { useEffect, useState } from 'react';
import {
  Check,
  Play,
  FileText,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Video as VideoIcon,
  Download,
  Link2,
  FileQuestion,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LessonAudioBar } from './LessonAudioBar';
import { lessonIcon, fmtDuration } from './utils';
import type { LessonActivity, LessonProgress, ModuleProgress } from './types';

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

/** Descodifica um data URL base64 num Blob (sem depender de fetch()). */
function dataUrlToBlob(dataUrl: string): Blob {
  const comma = dataUrl.indexOf(',');
  const meta = dataUrl.slice(0, comma);
  const b64 = dataUrl.slice(comma + 1);
  const mime = /:(.*?);/.exec(meta)?.[1] ?? 'application/pdf';
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

/**
 * Fonte utilizável no <iframe>/link para o ficheiro da lição (PDF ou PPTX).
 * Um data URL grande em `src`/`href` é bloqueado/truncado por alguns
 * browsers, por isso convertemo-lo num object URL (revogado ao desmontar).
 * URLs http(s) passam directas.
 */
function useFileSrc(lesson: LessonProgress): string | null {
  const contentUrl =
    lesson.type === 'PDF' || lesson.type === 'SLIDE' ? lesson.contentUrl : null;
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!contentUrl) {
      setSrc(null);
      return;
    }
    if (!contentUrl.startsWith('data:')) {
      setSrc(contentUrl);
      return;
    }
    const objectUrl = URL.createObjectURL(dataUrlToBlob(contentUrl));
    setSrc(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [contentUrl]);

  return src;
}

/** URL de embed para YouTube/Vimeo; `null` se não reconhecido (usa <video> nativo). */
function embeddableVideoUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com') || u.hostname === 'youtu.be') {
      const id = u.hostname === 'youtu.be' ? u.pathname.slice(1) : u.searchParams.get('v');
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.hostname.includes('vimeo.com')) {
      const id = u.pathname.split('/').filter(Boolean).pop();
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
  } catch {
    return null;
  }
  return null;
}

const ACTIVITY_ICON: Record<LessonActivity['type'], typeof FileText> = {
  TEXT: FileText,
  VIDEO: VideoIcon,
  DOCUMENT: FileText,
  IMAGE: FileText,
  AUDIO: FileText,
  QUIZ: FileQuestion,
  OPEN_QUESTION: FileQuestion,
  EXERCISE: FileQuestion,
  TASK: FileQuestion,
  SURVEY: FileQuestion,
  DISCUSSION: FileText,
  DOWNLOAD: Download,
  EXTERNAL_LINK: Link2,
};

const ACTIVITY_LABEL: Record<LessonActivity['type'], string> = {
  TEXT: 'Texto',
  VIDEO: 'Vídeo',
  DOCUMENT: 'Documento',
  IMAGE: 'Imagem',
  AUDIO: 'Áudio',
  QUIZ: 'Quiz',
  OPEN_QUESTION: 'Pergunta aberta',
  EXERCISE: 'Exercício',
  TASK: 'Tarefa',
  SURVEY: 'Inquérito',
  DISCUSSION: 'Discussão',
  DOWNLOAD: 'Ficheiro para download',
  EXTERNAL_LINK: 'Link externo',
};

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
  const fileSrc = useFileSrc(lesson);
  const [showTranscript, setShowTranscript] = useState(false);

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
        {/* Player/stage area */}
        <div className="min-h-[50vh] bg-ink flex items-center justify-center">
          {lesson.type === 'VIDEO' ? (
            lesson.contentUrl ? (
              <div className="w-full h-full flex flex-col">
                <div className="flex-1 aspect-video max-h-[70vh] mx-auto w-full">
                  {embeddableVideoUrl(lesson.contentUrl) ? (
                    <iframe
                      src={embeddableVideoUrl(lesson.contentUrl) ?? undefined}
                      title={lesson.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full border-0"
                    />
                  ) : (
                    <video controls className="w-full h-full bg-black" src={lesson.contentUrl}>
                      {lesson.captionsUrl && (
                        <track kind="captions" src={lesson.captionsUrl} default />
                      )}
                    </video>
                  )}
                </div>
                {lesson.transcript && (
                  <div className="px-6 py-3 bg-ink border-t border-canvas/10">
                    <button
                      type="button"
                      onClick={() => setShowTranscript(v => !v)}
                      className="font-body text-xs text-canvas/70 hover:text-canvas underline"
                    >
                      {showTranscript ? 'Ocultar transcrição' : 'Ver transcrição'}
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
              <div className="text-canvas text-center">
                <Play size={56} strokeWidth={1.5} className="mx-auto mb-4" />
                <div className="font-body text-base font-medium">{lesson.title}</div>
                <div className="font-body text-sm text-canvas/70 mt-2">
                  Esta aula ainda não tem vídeo associado.
                </div>
              </div>
            )
          ) : lesson.type === 'PDF' ? (
            fileSrc ? (
              <iframe
                src={fileSrc}
                title={lesson.title}
                className="w-full h-full border-0 bg-canvas"
              />
            ) : (
              <div className="text-canvas text-center px-8">
                <FileText size={56} strokeWidth={1.5} className="mx-auto mb-4" />
                <div className="font-body text-base font-medium">
                  {lesson.title}
                </div>
                <p className="font-body text-sm text-canvas/70 mt-2">
                  Esta aula ainda não tem ficheiro PDF carregado.
                </p>
              </div>
            )
          ) : lesson.type === 'SLIDE' ? (
            <div className="text-canvas text-center px-8">
              <BarChart3 size={56} strokeWidth={1.5} className="mx-auto mb-4" />
              <div className="font-body text-base font-medium">
                {lesson.title}
              </div>
              {fileSrc ? (
                <>
                  <p className="font-body text-sm text-canvas/70 mt-2">
                    Apresentação PowerPoint — descarrega para veres nos teus
                    slides.
                  </p>
                  <a
                    href={fileSrc}
                    download={`${lesson.title}.pptx`}
                    className="inline-block mt-4 rounded-lg bg-canvas px-4 py-2 font-body text-sm font-semibold text-ink hover:bg-canvas/90"
                  >
                    Descarregar apresentação
                  </a>
                </>
              ) : (
                <p className="font-body text-sm text-canvas/70 mt-2">
                  Esta aula ainda não tem ficheiro PPTX carregado.
                </p>
              )}
            </div>
          ) : lesson.type === 'AUDIO' ? (
            <div className="text-canvas text-center px-8 w-full max-w-lg">
              <div className="font-body text-base font-medium mb-4">
                {lesson.title}
              </div>
              {lesson.contentUrl ? (
                <audio controls className="w-full" src={lesson.contentUrl} />
              ) : (
                <p className="font-body text-sm text-canvas/70">
                  Esta aula ainda não tem ficheiro de áudio carregado.
                </p>
              )}
            </div>
          ) : lesson.type === 'LIVE' ? (
            <div className="text-canvas text-center px-8">
              <Calendar size={56} strokeWidth={1.5} className="mx-auto mb-4" />
              <div className="font-body text-base font-medium">{lesson.title}</div>
              {lesson.liveDate ? (
                <div className="font-body text-sm text-canvas/70 mt-2">
                  {new Date(lesson.liveDate).toLocaleString('pt', {
                    dateStyle: 'long',
                    timeStyle: 'short',
                  })}
                </div>
              ) : (
                <div className="font-body text-sm text-canvas/70 mt-2">
                  Data ainda por confirmar
                </div>
              )}
              {lesson.liveInstructor && (
                <div className="font-body text-sm text-canvas/70 mt-1">
                  Com {lesson.liveInstructor.fullName}
                </div>
              )}
              {lesson.liveSessionUrl ? (
                <a
                  href={lesson.liveSessionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-4 rounded-lg bg-canvas px-4 py-2 font-body text-sm font-semibold text-ink hover:bg-canvas/90"
                >
                  Entrar na sessão
                </a>
              ) : (
                <p className="font-body text-sm text-canvas/70 mt-4">
                  O link da sessão ainda não está disponível.
                </p>
              )}
            </div>
          ) : lesson.type === 'TEXT' ? (
            <div className="max-w-2xl mx-auto text-canvas p-8">
              <h2 className="font-display text-xl font-semibold mb-4">
                {lesson.title}
              </h2>
              {lesson.textContent ? (
                <p className="font-body text-canvas/80 leading-relaxed whitespace-pre-wrap">
                  {lesson.textContent}
                </p>
              ) : (
                <p className="font-body text-canvas/60 leading-relaxed italic">
                  Esta aula ainda não tem conteúdo escrito.
                </p>
              )}
              <LessonAudioBar lessonId={lesson.id} />
            </div>
          ) : (
            <div className="text-canvas text-center">
              {(() => {
                const FallbackIcon = lessonIcon(lesson.type);
                return (
                  <FallbackIcon
                    size={56}
                    strokeWidth={1.5}
                    className="mx-auto mb-4"
                  />
                );
              })()}
              <div className="font-body text-base font-medium">
                {lesson.title}
              </div>
            </div>
          )}
        </div>

        {/* Actividades da aula */}
        {lesson.activities.length > 0 && (
          <div className="px-6 py-5 border-t border-border">
            <h3 className="font-body text-sm font-semibold text-ink mb-3">
              Actividades
            </h3>
            <div className="space-y-2">
              {lesson.activities.map(activity => {
                const Icon = ACTIVITY_ICON[activity.type];
                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 rounded-lg border border-border p-3"
                  >
                    <Icon size={18} strokeWidth={1.75} className="text-ink-muted mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-body text-sm font-medium text-ink">
                          {activity.title}
                        </span>
                        <Badge intent="neutral">{ACTIVITY_LABEL[activity.type]}</Badge>
                      </div>
                      {activity.description && (
                        <p className="font-body text-xs text-ink-muted mt-1">
                          {activity.description}
                        </p>
                      )}
                      {activity.contentUrl && (
                        <a
                          href={activity.contentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-body text-xs text-accent hover:text-accent-hover mt-1 inline-block"
                        >
                          Abrir
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recursos da aula */}
        {lesson.resources.length > 0 && (
          <div className="px-6 py-5 border-t border-border">
            <h3 className="font-body text-sm font-semibold text-ink mb-3">
              Recursos
            </h3>
            <div className="space-y-2">
              {lesson.resources.map(resource => (
                <a
                  key={resource.id}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-surface-sunken"
                >
                  <Download size={18} strokeWidth={1.75} className="text-ink-muted flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-body text-sm font-medium text-ink truncate">
                      {resource.title}
                    </div>
                    {(resource.fileType || resource.fileSizeKb) && (
                      <div className="font-body text-xs text-ink-faint">
                        {[resource.fileType, resource.fileSizeKb ? `${resource.fileSizeKb} KB` : null]
                          .filter(Boolean)
                          .join(' · ')}
                      </div>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-border bg-surface flex-wrap">
        <div className="flex items-center gap-2">
          {onPrevious && (
            <Button intent="secondary" size="sm" disabled={!hasPrevious} onClick={onPrevious}>
              <ChevronLeft size={16} strokeWidth={1.75} />
              Anterior
            </Button>
          )}
          {onNext && (
            <Button intent="secondary" size="sm" disabled={!hasNext} onClick={onNext}>
              Próxima
              <ChevronRight size={16} strokeWidth={1.75} />
            </Button>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-body text-sm font-medium text-ink truncate">
            {lesson.title}
          </div>
          {lesson.durationMinutes && (
            <div className="font-body text-xs text-ink-faint">
              {fmtDuration(lesson.durationMinutes)}
            </div>
          )}
          {lesson.type === 'PDF' &&
            lesson.allowDownload &&
            lesson.contentUrl && (
              <a
                href={lesson.contentUrl}
                download
                className="font-body text-xs text-accent hover:text-accent-hover"
              >
                Descarregar PDF
              </a>
            )}
        </div>
        <Button
          onClick={onComplete}
          disabled={completing || lesson.completed}
          intent={lesson.completed ? 'secondary' : 'primary'}
        >
          {lesson.completed ? (
            <>
              <Check size={16} strokeWidth={1.75} /> Concluída
            </>
          ) : completing ? (
            'A marcar…'
          ) : (
            'Marcar como concluída →'
          )}
        </Button>
      </div>
    </div>
  );
}
