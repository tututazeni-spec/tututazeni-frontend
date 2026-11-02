// components/live-classes/room/RecordingPanel.tsx
// Painel de gravação de ecrã + guardar URL da gravação publicada.
// Extraído de app/(platform)/live-classes/[id]/page.tsx.

'use client';

import { useState } from 'react';
import {
  Clapperboard,
  AlertTriangle,
  Timer,
  HardDrive,
  Download,
  RefreshCw,
  Save,
  CircleHelp,
} from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { useToast } from '@/providers/ToastProvider';
import { apiClient } from '@/lib/apiClient';
import { formatBytes } from '@/lib/format';
import { fmtDuration } from './utils';
import { useRecording } from './useRecording';
import type { LiveClass } from './types';
import { safeHref } from '@/lib/safeHref';

const ICON_PROPS = { width: 16, height: 16, 'aria-hidden': true } as const;

function GoogleDriveIcon() {
  return (
    <svg {...ICON_PROPS} viewBox="0 0 87.3 78">
      <path
        d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z"
        fill="#0066da"
      />
      <path
        d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0-1.2 4.5h27.5z"
        fill="#00ac47"
      />
      <path
        d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z"
        fill="#ea4335"
      />
      <path
        d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z"
        fill="#00832d"
      />
      <path
        d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z"
        fill="#2684fc"
      />
      <path
        d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z"
        fill="#ffba00"
      />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg {...ICON_PROPS} viewBox="0 0 24 24">
      <path
        d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8z"
        fill="#ff0000"
      />
      <path d="M9.6 15.6V8.4l6.2 3.6z" fill="#fff" />
    </svg>
  );
}

function VimeoIcon() {
  return (
    <svg {...ICON_PROPS} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="12" fill="#1ab7ea" />
      <path
        d="M19.4 8.6c-.07 1.5-1.1 3.5-3.1 6.1-2.1 2.7-3.8 4-5.2 4-.9 0-1.6-.8-2.2-2.4l-1.2-4.4C7.2 10.3 6.7 9.5 6.2 9.5c-.1 0-.5.2-1.2.7L4.300 9.300c.8-.7 1.500-1.300 2.300-2 1-.9 1.800-1.300 2.300-1.400 1.200-.1 1.900.7 2.100 2.400.3 1.900.5 3 .6 3.500.3 1.500.7 2.300 1.100 2.300.3 0 .8-.5 1.400-1.500.6-1 1-1.800 1-2.300.1-.9-.2-1.300-1-1.300-.4 0-.7.1-1.100.2.700-2.400 2.100-3.600 4.200-3.600 1.600.1 2.300 1.100 2.200 3z"
        fill="#fff"
      />
    </svg>
  );
}

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
    <div className="flex flex-col gap-4 text-slate-900">
      <div className="flex items-center justify-between">
        <h3 className="m-0 inline-flex items-center gap-2 text-base font-bold text-slate-900">
          <Clapperboard
            size={20}
            strokeWidth={1.75}
            className="text-[#1e3a8a]"
          />{' '}
          Gravação
        </h3>
        <button
          onClick={() => setShowHelp((h) => !h)}
          className="bg-transparent border-none p-0 cursor-pointer text-[#1d4ed8] text-xs font-medium inline-flex items-center gap-1"
        >
          {showHelp ? 'Ocultar ajuda' : 'Como funciona?'}
          <CircleHelp size={15} strokeWidth={1.75} />
        </button>
      </div>

      {showHelp && (
        <div className="bg-slate-50 rounded-[10px] p-3.5 text-xs text-slate-600">
          <p className="m-0 mb-1.5 text-slate-900 font-semibold">
            Passos para gravar:
          </p>
          <ol className="m-0 pl-4 flex flex-col gap-1">
            <li>
              Clica em <strong className="text-danger">Iniciar Gravação</strong>
            </li>
            <li>Selecciona este separador: só o player da aula é gravado</li>
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
          <div className="inline-flex items-center gap-1.5 bg-danger-subtle border border-danger-subtle rounded-control py-2 px-3 text-xs text-danger-ink mb-2.5">
            <AlertTriangle size={13} strokeWidth={1.75} /> {rec.error}
          </div>
        )}

        {rec.state === 'idle' && (
          <button
            onClick={() => void rec.start()}
            className="w-full py-3 rounded-xl bg-[#1d5fd6] hover:bg-[#1a52b8] border-none text-white text-sm font-bold cursor-pointer inline-flex items-center justify-center gap-2.5"
          >
            <span className="w-3 h-3 rounded-full bg-white inline-block" />
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
              <span className="text-base font-black text-slate-900 font-mono">
                {fmtDuration(rec.elapsed)}
              </span>
            </div>
            <button
              onClick={rec.stop}
              className="w-full py-2.5 rounded-[10px] bg-white/10 border border-white/20 text-slate-900 text-sm font-semibold cursor-pointer flex items-center justify-center gap-2"
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

            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                <Timer size={12} strokeWidth={1.75} />{' '}
                {fmtDuration(rec.data.duration)}
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                <HardDrive size={12} strokeWidth={1.75} />{' '}
                {formatBytes(rec.data.size)}
              </span>
              <span>·</span>
              <span>WebM</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => rec.download(filename)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.25 rounded-control bg-success border-none text-canvas text-xs font-bold cursor-pointer"
              >
                <Download size={13} strokeWidth={1.75} /> Download (.webm)
              </button>
              <button
                onClick={rec.reset}
                className="inline-flex items-center gap-1 py-2.25 px-3.5 rounded-control bg-white/8 border border-white/15 text-slate-500 text-xs cursor-pointer"
              >
                <RefreshCw size={12} strokeWidth={1.75} /> Nova
              </button>
            </div>

            <p className="m-0 text-xs text-slate-500">
              Após fazer download, carrega o vídeo para Google Drive, YouTube ou
              outro serviço e cola o link abaixo.
            </p>
          </div>
        )}
      </div>

      {/* Save URL */}
      <div>
        <p className="m-0 mb-2 text-sm font-extrabold text-slate-900 uppercase tracking-wide">
          URL da Gravação
        </p>

        {liveClass.recordingUrl && !urlSaved && (
          <div className="py-2 px-3 bg-success-subtle border border-success-subtle rounded-control text-xs text-success-ink mb-2">
            ✓ Gravação anterior disponível
          </div>
        )}

        {urlSaved && (
          <div className="py-2 px-3 bg-success-subtle border border-success-subtle rounded-control text-xs text-success-ink mb-2">
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
            placeholder="https://drive.google.com/..."
            className="flex-1 min-w-0 py-2.5 px-3 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 outline-none focus:border-[#1d5fd6]"
          />
          <button
            onClick={() => saveUrl(customUrl)}
            disabled={!customUrl || savingUrl}
            className={`inline-flex items-center gap-1.5 py-2.5 px-4 rounded-xl bg-[#1d5fd6] border-none text-white text-sm font-bold cursor-pointer whitespace-nowrap ${
              !customUrl ? 'opacity-50' : ''
            }`}
          >
            <Save size={16} strokeWidth={1.75} />
            {savingUrl ? '...' : 'Guardar'}
          </button>
        </div>

        <div className="mt-3 flex flex-col gap-1.5">
          <p className="m-0 text-xs text-slate-700 font-semibold">
            Serviços gratuitos sugeridos:
          </p>
          {[
            {
              name: 'Google Drive',
              url: 'https://drive.google.com',
              icon: GoogleDriveIcon,
            },
            {
              name: 'YouTube (não listado)',
              url: 'https://studio.youtube.com',
              icon: YouTubeIcon,
            },
            {
              name: 'Vimeo (free)',
              url: 'https://vimeo.com',
              icon: VimeoIcon,
            },
          ].map((s: { name: string; url: string; icon: () => JSX.Element }) => (
            <a
              key={s.name}
              href={safeHref(s.url)}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-slate-500 no-underline flex items-center gap-1.5"
            >
              <s.icon /> {s.name} ↗
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
