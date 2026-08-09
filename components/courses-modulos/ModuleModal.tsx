// components/courses-modulos/ModuleModal.tsx
// Modal de criação/edição de módulo. Extraído de
// app/(platform)/courses/modulos/page.tsx.

'use client';

import { useState } from 'react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { card, inputStyle, labelStyle, btnPrimary, btnGhost } from './styles';
import type { CourseModule } from './types';

interface ModuleModalProps {
  courseId: number;
  editing: CourseModule | null;
  onClose: () => void;
  onSaved: () => void;
}

export function ModuleModal({
  courseId,
  editing,
  onClose,
  onSaved,
}: ModuleModalProps) {
  const [form, setForm] = useState({
    title: editing?.title ?? '',
    seq: editing?.seq ?? 1,
  });

  const saveModule = useApiMutation(
    () =>
      editing
        ? apiClient.put(`/modules/${editing.id}`, {
            title: form.title,
            seq: +form.seq,
          })
        : apiClient.post('/modules', {
            courseId,
            title: form.title,
            seq: +form.seq,
          }),
    {
      onSuccess: () => {
        onSaved();
        onClose();
      },
      onError: (e) => alert(e.message),
    },
  );
  const saving = saveModule.isPending;
  function submit(e: React.FormEvent) {
    e.preventDefault();
    saveModule.mutate(undefined);
  }
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 500,
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
          maxWidth: 420,
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
            {editing ? '✏️ Editar Módulo' : '📦 Novo Módulo'}
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
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
              required
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <span style={labelStyle}>Sequência</span>
            <input
              style={inputStyle}
              type="number"
              min={1}
              value={form.seq}
              onChange={(e) => setForm((f) => ({ ...f, seq: +e.target.value }))}
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
