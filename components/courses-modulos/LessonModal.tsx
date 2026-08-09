// components/courses-modulos/LessonModal.tsx
// Modal de criação/edição de lição. Extraído de
// app/(platform)/courses/modulos/page.tsx.

'use client';

import { useState } from 'react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { CONTENT_TYPE } from './constants';
import { card, inputStyle, labelStyle, btnPrimary, btnGhost } from './styles';
import type { Lesson } from './types';

interface LessonModalProps {
  moduleId: number;
  editing: Lesson | null;
  onClose: () => void;
  onSaved: () => void;
}

export function LessonModal({
  moduleId,
  editing,
  onClose,
  onSaved,
}: LessonModalProps) {
  const [form, setForm] = useState({
    title: editing?.title ?? '',
    contentType: editing?.contentType ?? 'VIDEO',
    videoUrl: editing?.videoUrl ?? '',
    pdfUrl: editing?.pdfUrl ?? '',
    seq: editing?.seq ?? 1,
  });
  function set(k: string, v: string | number) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const saveLesson = useApiMutation(
    () => {
      const payload = {
        moduleId,
        title: form.title,
        contentType: form.contentType,
        seq: +form.seq,
        videoUrl: form.videoUrl || undefined,
        pdfUrl: form.pdfUrl || undefined,
      };
      return editing
        ? apiClient.put(`/lessons/${editing.id}`, payload)
        : apiClient.post('/lessons', payload);
    },
    {
      onSuccess: () => {
        onSaved();
        onClose();
      },
      onError: (e) => alert(e.message),
    },
  );
  const saving = saveLesson.isPending;
  function submit(e: React.FormEvent) {
    e.preventDefault();
    saveLesson.mutate(undefined);
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 600,
        background: 'rgba(15,23,42,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          ...card,
          width: '100%',
          maxWidth: 480,
          boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 17,
              fontWeight: 700,
              color: '#1e293b',
            }}
          >
            {editing ? '✏️ Editar Lição' : '📖 Nova Lição'}
          </h2>
          <button
            onClick={onClose}
            aria-label="Fechar"
            style={{
              background: 'none',
              border: 'none',
              fontSize: 20,
              cursor: 'pointer',
              color: '#94a3b8',
            }}
          >
            ×
          </button>
        </div>
        <form onSubmit={submit}>
          <div style={{ marginBottom: 14 }}>
            <span style={labelStyle}>Título *</span>
            <input
              style={inputStyle}
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              required
            />
          </div>
          <div style={{ marginBottom: 14 }}>
            <span style={labelStyle}>Tipo de Conteúdo *</span>
            <div style={{ display: 'flex', gap: 8 }}>
              {Object.entries(CONTENT_TYPE).map(([k, v]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => set('contentType', k)}
                  style={{
                    flex: 1,
                    padding: '8px 0',
                    border: `2px solid ${form.contentType === k ? v.color : '#e2e8f0'}`,
                    borderRadius: 8,
                    background: form.contentType === k ? v.bg : '#fff',
                    cursor: 'pointer',
                    fontSize: 18,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2,
                  }}
                >
                  <span>{v.icon}</span>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: form.contentType === k ? v.color : '#94a3b8',
                    }}
                  >
                    {v.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
          {(form.contentType === 'VIDEO' || form.contentType === 'AVATAR') && (
            <div style={{ marginBottom: 14 }}>
              <span style={labelStyle}>URL do Vídeo</span>
              <input
                style={inputStyle}
                value={form.videoUrl}
                onChange={(e) => set('videoUrl', e.target.value)}
                placeholder="https://..."
              />
            </div>
          )}
          {form.contentType === 'PDF' && (
            <div style={{ marginBottom: 14 }}>
              <span style={labelStyle}>URL do PDF</span>
              <input
                style={inputStyle}
                value={form.pdfUrl}
                onChange={(e) => set('pdfUrl', e.target.value)}
                placeholder="https://..."
              />
            </div>
          )}
          <div style={{ marginBottom: 20 }}>
            <span style={labelStyle}>Sequência</span>
            <input
              style={inputStyle}
              type="number"
              min={1}
              value={form.seq}
              onChange={(e) => set('seq', +e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={btnGhost}>
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}
            >
              {saving ? 'A guardar...' : editing ? 'Guardar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
