// components/courses-learn/LessonExtras.tsx
// Tudo o que acompanha uma lição além do conteúdo principal: actividades (os
// 13 tipos, cada um aberto no próprio ecrã quando possível), recursos da aula
// e materiais do módulo. Ficheiros guardados como data URL abrem por object
// URL (ver fileSrc.ts).

'use client';

import type { ReactNode } from 'react';
import {
  Download,
  ExternalLink,
  FileQuestion,
  FileText,
  Image as ImageIcon,
  Link2,
  MessageSquare,
  Music,
  Paperclip,
  Video as VideoIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { PdfViewer } from '@/components/viewers/PdfViewer';
import { embeddableVideoUrl, fileKind, openFile, useBlobSrc } from './fileSrc';
import type { LessonActivity, LessonResource, ModuleMaterial } from './types';

const ACTIVITY_ICON: Record<LessonActivity['type'], typeof FileText> = {
  TEXT: FileText,
  VIDEO: VideoIcon,
  DOCUMENT: FileText,
  IMAGE: ImageIcon,
  AUDIO: Music,
  QUIZ: FileQuestion,
  OPEN_QUESTION: FileQuestion,
  EXERCISE: FileQuestion,
  TASK: FileQuestion,
  SURVEY: FileQuestion,
  DISCUSSION: MessageSquare,
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

/** Botão-link que abre um ficheiro/URL (data URL incluído) noutro separador. */
export function OpenButton({
  url,
  children,
}: {
  url: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => openFile(url)}
      className="mt-2 inline-flex items-center gap-1.5 rounded-control border border-brand-line bg-white px-3 py-1.5 font-body text-xs font-semibold text-brand hover:bg-brand-soft"
    >
      <ExternalLink size={14} strokeWidth={1.75} />
      {children}
    </button>
  );
}

/** Conteúdo de uma actividade, aberto no ecrã conforme o tipo. */
function ActivityBody({ activity }: { activity: LessonActivity }) {
  const url = activity.contentUrl;
  const src = useBlobSrc(url);
  const kind = url ? fileKind(url) : 'other';
  const embed = url && /^https?:/.test(url) ? embeddableVideoUrl(url) : null;

  return (
    <>
      {activity.description && (
        <p className="mt-2 whitespace-pre-wrap font-body text-sm leading-relaxed text-ink-muted">
          {activity.description}
        </p>
      )}

      {url && src && activity.type === 'IMAGE' && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          loading="lazy"
          decoding="async"
          src={src}
          alt={activity.title}
          className="mt-3 max-h-[480px] max-w-full rounded-control border border-border object-contain"
        />
      )}

      {url && src && activity.type === 'AUDIO' && (
        <audio controls className="mt-3 w-full" src={src} />
      )}

      {url && src && activity.type === 'VIDEO' && (
        <div className="mt-3 aspect-video max-h-[420px] w-full overflow-hidden rounded-control bg-black">
          {embed ? (
            <iframe
              src={embed}
              title={activity.title}
              allowFullScreen
              className="h-full w-full border-0"
            />
          ) : (
            <video controls src={src} className="h-full w-full" />
          )}
        </div>
      )}

      {url && src && activity.type === 'DOCUMENT' && kind === 'pdf' && (
        <div className="mt-3 h-[520px] overflow-hidden rounded-control border border-border bg-brand-soft">
          <PdfViewer src={src} title={activity.title} />
        </div>
      )}

      {url && src && activity.type === 'DOCUMENT' && kind === 'image' && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          loading="lazy"
          decoding="async"
          src={src}
          alt={activity.title}
          className="mt-3 max-h-[480px] max-w-full rounded-control border border-border object-contain"
        />
      )}

      {url && (
        <OpenButton url={url}>
          {activity.type === 'DOWNLOAD'
            ? 'Descarregar ficheiro'
            : activity.type === 'EXTERNAL_LINK'
              ? 'Abrir ligação'
              : 'Abrir'}
        </OpenButton>
      )}
    </>
  );
}

export function ActivityList({ activities }: { activities: LessonActivity[] }) {
  if (activities.length === 0) return null;
  return (
    <div className="space-y-3">
      {activities.map((activity) => {
        const Icon = ACTIVITY_ICON[activity.type] ?? FileText;
        return (
          <div
            key={activity.id}
            className="flex items-start gap-3 rounded-panel border border-brand-line bg-white p-4"
          >
            <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-line text-brand">
              <Icon size={16} strokeWidth={1.75} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-body text-sm font-semibold text-ink">
                  {activity.title}
                </span>
                <Badge intent="neutral">
                  {ACTIVITY_LABEL[activity.type] ?? activity.type}
                </Badge>
              </div>
              <ActivityBody activity={activity} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface FileItem {
  id: number;
  title: string;
  url: string;
  fileType: string | null;
  fileSizeKb: number | null;
}

/** Lista de ficheiros para abrir/descarregar (recursos da aula, materiais do módulo). */
export function FileList({ files }: { files: Array<FileItem> }) {
  if (files.length === 0) return null;
  return (
    <div className="space-y-2">
      {files.map((f) => (
        <button
          key={f.id}
          type="button"
          onClick={() => openFile(f.url)}
          className="flex w-full items-center gap-3 rounded-panel border border-brand-line bg-white p-3 text-left hover:bg-brand-soft"
        >
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-line text-brand">
            <Paperclip size={16} strokeWidth={1.75} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-body text-sm font-medium text-ink">
              {f.title}
            </span>
            {(f.fileType || f.fileSizeKb) && (
              <span className="block font-body text-xs text-ink-faint">
                {[f.fileType, f.fileSizeKb ? `${f.fileSizeKb} KB` : null]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            )}
          </span>
          <ExternalLink
            size={16}
            strokeWidth={1.75}
            className="flex-shrink-0 text-ink-muted"
          />
        </button>
      ))}
    </div>
  );
}

export type { LessonResource, ModuleMaterial };
