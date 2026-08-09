// components/courses-modulos/ProgressModal.tsx
// Modal administrativo: consulta progresso por matrícula e marca lições
// como concluídas. Extraído de app/(platform)/courses/modulos/page.tsx.

'use client';

import { useState } from 'react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { CONTENT_TYPE } from './constants';
import { card, inputStyle, labelStyle, btnPrimary, btnGhost } from './styles';
import type { LessonProgress } from './types';

interface ProgressModalProps {
  onClose: () => void;
  onMarked: () => void;
}

export function ProgressModal({ onClose, onMarked }: ProgressModalProps) {
  const [enrollmentId, setEnrollmentId] = useState('');
  const [lessonId, setLessonId] = useState('');

  const progressQuery = useApiMutation(
    (enrId: string) =>
      apiClient.get<LessonProgress[]>(`/lessons/progress/${enrId}`),
    { onError: (e) => alert(e.message) },
  );
  const progress = progressQuery.data ?? [];
  const loading = progressQuery.isPending;
  const loadProgress = () => {
    if (enrollmentId) progressQuery.mutate(enrollmentId);
  };

  const markCompleteMutation = useApiMutation(
    () =>
      apiClient.post('/lessons/progress', {
        enrollmentId: +enrollmentId,
        lessonId: +lessonId,
      }),
    {
      onSuccess: () => {
        onMarked();
        loadProgress();
      },
      onError: (e) => alert(e.message),
    },
  );
  const marking = markCompleteMutation.isPending;
  const markComplete = () => {
    if (enrollmentId && lessonId) markCompleteMutation.mutate(undefined);
  };

  const completedCount = progress.filter((p) => p.completed).length;

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
          maxWidth: 540,
          maxHeight: '90vh',
          overflow: 'auto',
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
            📊 Progresso de Matrícula
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

        {/* Marcar como concluída */}
        <div
          style={{
            padding: '16px',
            background: '#f8fafc',
            borderRadius: 10,
            marginBottom: 20,
          }}
        >
          <h3
            style={{
              margin: '0 0 12px',
              fontSize: 13,
              fontWeight: 700,
              color: '#1e293b',
            }}
          >
            ✅ Marcar Lição como Concluída
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr auto',
              gap: 10,
              alignItems: 'flex-end',
            }}
          >
            <div>
              <span style={labelStyle}>ID Matrícula</span>
              <input
                style={inputStyle}
                type="number"
                value={enrollmentId}
                onChange={(e) => setEnrollmentId(e.target.value)}
                placeholder="Ex: 1"
              />
            </div>
            <div>
              <span style={labelStyle}>ID Lição</span>
              <input
                style={inputStyle}
                type="number"
                value={lessonId}
                onChange={(e) => setLessonId(e.target.value)}
                placeholder="Ex: 3"
              />
            </div>
            <button
              onClick={markComplete}
              disabled={marking || !enrollmentId || !lessonId}
              style={{
                ...btnPrimary,
                opacity: marking ? 0.7 : 1,
                whiteSpace: 'nowrap',
              }}
            >
              {marking ? '...' : '✅ Marcar'}
            </button>
          </div>
        </div>

        {/* Ver progresso */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <span style={labelStyle}>Ver Progresso (ID Matrícula)</span>
              <input
                style={inputStyle}
                type="number"
                value={enrollmentId}
                onChange={(e) => setEnrollmentId(e.target.value)}
                placeholder="Ex: 1"
              />
            </div>
            <button
              onClick={loadProgress}
              disabled={loading || !enrollmentId}
              style={{ ...btnGhost, opacity: !enrollmentId ? 0.5 : 1 }}
            >
              🔍 Ver
            </button>
          </div>
        </div>

        {progress.length > 0 && (
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                background: '#eff6ff',
                borderRadius: 8,
                marginBottom: 12,
                border: '1px solid #bfdbfe',
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#1e40af',
                }}
              >
                {completedCount} / {progress.length} lições concluídas
              </p>
              <div
                style={{
                  flex: 1,
                  height: 6,
                  background: '#bfdbfe',
                  borderRadius: 3,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${progress.length ? (completedCount / progress.length) * 100 : 0}%`,
                    background: '#1e40af',
                    borderRadius: 3,
                  }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {progress.map((p) => {
                const ct = CONTENT_TYPE[p.lesson.contentType] ?? {
                  icon: '📖',
                  color: '#64748b',
                  bg: '#f8fafc',
                  label: p.lesson.contentType,
                };
                return (
                  <div
                    key={p.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 14px',
                      borderRadius: 8,
                      background: p.completed ? '#ecfdf5' : '#f8fafc',
                      border: `1px solid ${p.completed ? '#bbf7d0' : '#e2e8f0'}`,
                    }}
                  >
                    <span style={{ fontSize: 18 }}>{ct.icon}</span>
                    <div style={{ flex: 1 }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 13,
                          fontWeight: 600,
                          color: '#1e293b',
                        }}
                      >
                        {p.lesson.title}
                      </p>
                      <p
                        style={{
                          margin: '2px 0 0',
                          fontSize: 11,
                          color: '#94a3b8',
                        }}
                      >
                        ID: {p.lessonId} · {ct.label}
                      </p>
                    </div>
                    {p.completed ? (
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: '#16a34a',
                        }}
                      >
                        ✅{' '}
                        {p.completedAt
                          ? new Date(p.completedAt).toLocaleDateString('pt-PT')
                          : 'Concluída'}
                      </span>
                    ) : (
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>
                        Pendente
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
