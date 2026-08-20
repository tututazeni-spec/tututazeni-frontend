// components/live-classes/room/RecordingPanel.tsx
// Painel de gravação de ecrã + guardar URL da gravação publicada.
// Extraído de app/(platform)/live-classes/[id]/page.tsx.

'use client';

import { useState } from 'react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { useToast } from '@/providers/ToastProvider';
import { apiClient } from '@/lib/apiClient';
import { fmtBytes, fmtDuration } from './utils';
import { useRecording } from './useRecording';
import type { LiveClass } from './types';

interface RecordingPanelProps {
  liveClass: LiveClass;
  onUrlSaved: (url: string) => void;
}

export function RecordingPanel({ liveClass, onUrlSaved }: RecordingPanelProps) {
  const notify = useToast();
  const rec = useRecording();
  const [customUrl, setCustomUrl] = useState(liveClass.recordingUrl ?? '');
  const [urlSaved, setUrlSaved] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const filename = `innova-aula-${liveClass.id}-${Date.now()}.webm`;

  const saveUrlMutation = useApiMutation(
    (url: string) =>
      apiClient.put(`/live-classes/${liveClass.id}`, {
        courseId: liveClass.course?.id,
        topic: liveClass.topic,
        scheduledAt: liveClass.scheduledAt,
        duration: liveClass.duration,
        recordingUrl: url,
      }),
    {
      onSuccess: (_data, url) => {
        setUrlSaved(true);
        onUrlSaved(url);
      },
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );
  const savingUrl = saveUrlMutation.isPending;
  function saveUrl(url: string) {
    if (!url) return;
    saveUrlMutation.mutate(url);
  }

  return (
    <div className="bg-surface-sunken rounded-[14px] p-5 flex flex-col gap-4 text-ink">
      <div className="flex items-center justify-between">
        <h3 className="m-0 text-sm font-bold text-ink">🎬 Gravação</h3>
        <button
          onClick={() => setShowHelp((h) => !h)}
          className="bg-white/8 border-none rounded py-0.75 px-2 cursor-pointer text-ink-faint text-xs"
        >
          {showHelp ? 'Ocultar ajuda' : 'Como funciona?'}
        </button>
      </div>

      {showHelp && (
        <div className="bg-surface rounded-[10px] p-3.5 text-xs text-ink-faint">
          <p className="m-0 mb-1.5 text-ink font-semibold">
            Passos para gravar:
          </p>
          <ol className="m-0 pl-4 flex flex-col gap-1">
            <li>
              Clica em <strong className="text-danger">Iniciar Gravação</strong>
            </li>
            <li>Selecciona a janela/ecrã com a aula Jitsi</li>
            <li>
              Quando terminar, clica{' '}
              <strong className="text-danger">Parar</strong>
            </li>
            <li>Faz download do vídeo (.webm)</li>
            <li>
              Carrega o ficheiro para Google Drive, YouTube (não listado) ou
              outro serviço
            </li>
            <li>
              Cola o link público abaixo e clica <strong>Guardar URL</strong>
            </li>
          </ol>
        </div>
      )}

      {/* Recording controls */}
      <div>
        {rec.error && (
          <div className="bg-danger-subtle border border-danger-subtle rounded-lg py-2 px-3 text-xs text-danger-ink mb-2.5">
            ⚠️ {rec.error}
          </div>
        )}

        {rec.state === 'idle' && (
          <button
            onClick={rec.start}
            className="w-full py-2.75 rounded-[10px] bg-danger border-none text-canvas text-sm font-bold cursor-pointer flex items-center justify-center gap-2"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-canvas inline-block" />
            Iniciar Gravação do Ecrã
          </button>
        )}

        {rec.state === 'recording' && (
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2.5 py-2.5 px-3.5 bg-danger-subtle border border-danger-subtle rounded-[10px]">
              <span
                className="w-2.5 h-2.5 rounded-full bg-danger inline-block"
                style={{ animation: 'lc-ping 1.2s ease-in-out infinite' }}
              />
              <span className="flex-1 text-sm font-bold text-danger-ink">
                A gravar...
              </span>
              <span className="text-base font-black text-ink font-mono">
                {fmtDuration(rec.elapsed)}
              </span>
            </div>
            <button
              onClick={rec.stop}
              className="w-full py-2.5 rounded-[10px] bg-white/10 border border-white/20 text-ink text-sm font-semibold cursor-pointer flex items-center justify-center gap-2"
            >
              <span className="w-3 h-3 bg-canvas inline-block rounded-sm" />
              Parar Gravação
            </button>
          </div>
        )}

        {rec.state === 'stopped' && rec.data && (
          <div className="flex flex-col gap-2.5">
            {/* Preview */}
            <video
              src={rec.data.url}
              controls
              className="w-full rounded-[10px] bg-black max-h-40"
            />
            {/* fundo escuro intencional: player de vídeo */}

            <div className="flex gap-1.5 text-xs text-ink-muted">
              <span>⏱️ {fmtDuration(rec.data.duration)}</span>
              <span>·</span>
              <span>💾 {fmtBytes(rec.data.size)}</span>
              <span>·</span>
              <span>WebM</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => rec.download(filename)}
                className="flex-1 py-2.25 rounded-lg bg-success border-none text-canvas text-xs font-bold cursor-pointer"
              >
                📥 Download (.webm)
              </button>
              <button
                onClick={rec.reset}
                className="py-2.25 px-3.5 rounded-lg bg-white/8 border border-white/15 text-ink-faint text-xs cursor-pointer"
              >
                🔄 Nova
              </button>
            </div>

            <p className="m-0 text-xs text-ink-faint">
              Após fazer download, carrega o vídeo para Google Drive, YouTube ou
              outro serviço e cola o link abaixo.
            </p>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-white/8" />

      {/* Save URL */}
      <div>
        <p className="m-0 mb-2 text-xs font-bold text-ink-faint uppercase tracking-wide">
          URL da Gravação
        </p>

        {liveClass.recordingUrl && !urlSaved && (
          <div className="py-2 px-3 bg-success-subtle border border-success-subtle rounded-lg text-xs text-success-ink mb-2">
            ✓ Gravação anterior disponível
          </div>
        )}

        {urlSaved && (
          <div className="py-2 px-3 bg-success-subtle border border-success-subtle rounded-lg text-xs text-success-ink mb-2">
            ✓ URL guardada com sucesso!
          </div>
        )}

        <div className="flex gap-2">
          <input
            value={customUrl}
            onChange={(e) => {
              setCustomUrl(e.target.value);
              setUrlSaved(false);
            }}
            placeholder="https://drive.google.com/... ou https://youtu.be/..."
            className="flex-1 py-2 px-2.5 rounded-lg border border-white/12 bg-white/6 text-ink text-xs outline-none"
          />
          <button
            onClick={() => saveUrl(customUrl)}
            disabled={!customUrl || savingUrl}
            className={`py-2 px-3.5 rounded-lg bg-accent border-none text-canvas text-xs font-bold cursor-pointer whitespace-nowrap ${
              !customUrl ? 'opacity-50' : ''
            }`}
          >
            {savingUrl ? '...' : 'Guardar'}
          </button>
        </div>

        <div className="mt-2.5 flex flex-col gap-1">
          <p className="m-0 text-xs text-ink-muted font-semibold">
            Serviços gratuitos sugeridos:
          </p>
          {[
            {
              name: 'Google Drive',
              url: 'https://drive.google.com',
              icon: '📁',
            },
            {
              name: 'YouTube (não listado)',
              url: 'https://studio.youtube.com',
              icon: '▶',
            },
            { name: 'Vimeo (free)', url: 'https://vimeo.com', icon: '🎬' },
          ].map((s) => (
            <a
              key={s.name}
              href={s.url}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-ink-muted no-underline flex items-center gap-1.25"
            >
              {s.icon} {s.name} ↗
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
