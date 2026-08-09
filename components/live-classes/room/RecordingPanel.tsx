// components/live-classes/room/RecordingPanel.tsx
// Painel de gravação de ecrã + guardar URL da gravação publicada.
// Extraído de app/(platform)/live-classes/[id]/page.tsx.

'use client';

import { useState } from 'react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { fmtBytes, fmtDuration } from './utils';
import { useRecording } from './useRecording';
import type { LiveClass } from './types';

interface RecordingPanelProps {
  liveClass: LiveClass;
  onUrlSaved: (url: string) => void;
}

export function RecordingPanel({ liveClass, onUrlSaved }: RecordingPanelProps) {
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
      onError: (e) => alert(e.message),
    },
  );
  const savingUrl = saveUrlMutation.isPending;
  function saveUrl(url: string) {
    if (!url) return;
    saveUrlMutation.mutate(url);
  }

  return (
    <div
      style={{
        background: '#0f172a',
        borderRadius: 14,
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        color: '#fff',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h3
          style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}
        >
          🎬 Gravação
        </h3>
        <button
          onClick={() => setShowHelp((h) => !h)}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: 'none',
            borderRadius: 6,
            padding: '3px 8px',
            cursor: 'pointer',
            color: '#94a3b8',
            fontSize: 11,
          }}
        >
          {showHelp ? 'Ocultar ajuda' : 'Como funciona?'}
        </button>
      </div>

      {showHelp && (
        <div
          style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 10,
            padding: 14,
            fontSize: 12,
            color: '#94a3b8',
            lineHeight: 1.6,
          }}
        >
          <p style={{ margin: '0 0 6px', color: '#f1f5f9', fontWeight: 600 }}>
            Passos para gravar:
          </p>
          <ol
            style={{
              margin: 0,
              paddingLeft: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <li>
              Clica em{' '}
              <strong style={{ color: '#dc2626' }}>Iniciar Gravação</strong>
            </li>
            <li>Selecciona a janela/ecrã com a aula Jitsi</li>
            <li>
              Quando terminar, clica{' '}
              <strong style={{ color: '#dc2626' }}>Parar</strong>
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
          <div
            style={{
              background: 'rgba(220,38,38,0.15)',
              border: '1px solid rgba(220,38,38,0.3)',
              borderRadius: 8,
              padding: '8px 12px',
              fontSize: 12,
              color: '#fca5a5',
              marginBottom: 10,
            }}
          >
            ⚠️ {rec.error}
          </div>
        )}

        {rec.state === 'idle' && (
          <button
            onClick={rec.start}
            style={{
              width: '100%',
              padding: '11px',
              borderRadius: 10,
              background: '#dc2626',
              border: 'none',
              color: '#fff',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: '#fff',
                display: 'inline-block',
              }}
            />
            Iniciar Gravação do Ecrã
          </button>
        )}

        {rec.state === 'recording' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                background: 'rgba(220,38,38,0.15)',
                border: '1px solid rgba(220,38,38,0.3)',
                borderRadius: 10,
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: '#dc2626',
                  display: 'inline-block',
                  animation: 'lc-ping 1.2s ease-in-out infinite',
                }}
              />
              <span
                style={{
                  flex: 1,
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#fca5a5',
                }}
              >
                A gravar...
              </span>
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: '#fff',
                  fontFamily: 'monospace',
                }}
              >
                {fmtDuration(rec.elapsed)}
              </span>
            </div>
            <button
              onClick={rec.stop}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: 10,
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <span
                style={{
                  width: 12,
                  height: 12,
                  background: '#fff',
                  display: 'inline-block',
                  borderRadius: 2,
                }}
              />
              Parar Gravação
            </button>
          </div>
        )}

        {rec.state === 'stopped' && rec.data && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Preview */}
            <video
              src={rec.data.url}
              controls
              style={{
                width: '100%',
                borderRadius: 10,
                background: '#000',
                maxHeight: 160,
              }}
            />

            <div
              style={{
                display: 'flex',
                gap: 6,
                fontSize: 11,
                color: '#64748b',
              }}
            >
              <span>⏱️ {fmtDuration(rec.data.duration)}</span>
              <span>·</span>
              <span>💾 {fmtBytes(rec.data.size)}</span>
              <span>·</span>
              <span>WebM</span>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => rec.download(filename)}
                style={{
                  flex: 1,
                  padding: '9px',
                  borderRadius: 9,
                  background: '#16a34a',
                  border: 'none',
                  color: '#fff',
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                📥 Download (.webm)
              </button>
              <button
                onClick={rec.reset}
                style={{
                  padding: '9px 14px',
                  borderRadius: 9,
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#94a3b8',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                🔄 Nova
              </button>
            </div>

            <p
              style={{
                margin: 0,
                fontSize: 11,
                color: '#64748b',
                lineHeight: 1.5,
              }}
            >
              Após fazer download, carrega o vídeo para Google Drive, YouTube ou
              outro serviço e cola o link abaixo.
            </p>
          </div>
        )}
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }} />

      {/* Save URL */}
      <div>
        <p
          style={{
            margin: '0 0 8px',
            fontSize: 11,
            fontWeight: 700,
            color: '#94a3b8',
            textTransform: 'uppercase',
            letterSpacing: 0.7,
          }}
        >
          URL da Gravação
        </p>

        {liveClass.recordingUrl && !urlSaved && (
          <div
            style={{
              padding: '8px 12px',
              background: 'rgba(22,163,74,0.12)',
              border: '1px solid rgba(22,163,74,0.25)',
              borderRadius: 8,
              fontSize: 12,
              color: '#4ade80',
              marginBottom: 8,
            }}
          >
            ✓ Gravação anterior disponível
          </div>
        )}

        {urlSaved && (
          <div
            style={{
              padding: '8px 12px',
              background: 'rgba(22,163,74,0.12)',
              border: '1px solid rgba(22,163,74,0.25)',
              borderRadius: 8,
              fontSize: 12,
              color: '#4ade80',
              marginBottom: 8,
            }}
          >
            ✓ URL guardada com sucesso!
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={customUrl}
            onChange={(e) => {
              setCustomUrl(e.target.value);
              setUrlSaved(false);
            }}
            placeholder="https://drive.google.com/... ou https://youtu.be/..."
            style={{
              flex: 1,
              padding: '8px 10px',
              borderRadius: 9,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.06)',
              color: '#f1f5f9',
              fontSize: 12,
              outline: 'none',
            }}
          />
          <button
            onClick={() => saveUrl(customUrl)}
            disabled={!customUrl || savingUrl}
            style={{
              padding: '8px 14px',
              borderRadius: 9,
              background: '#7c3aed',
              border: 'none',
              color: '#fff',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              opacity: !customUrl ? 0.5 : 1,
            }}
          >
            {savingUrl ? '...' : 'Guardar'}
          </button>
        </div>

        <div
          style={{
            marginTop: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 10.5,
              color: '#475569',
              fontWeight: 600,
            }}
          >
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
              style={{
                fontSize: 11,
                color: '#64748b',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              {s.icon} {s.name} ↗
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
