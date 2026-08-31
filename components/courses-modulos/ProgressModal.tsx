// components/courses-modulos/ProgressModal.tsx
// Modal administrativo: consulta progresso por matrícula e marca lições
// como concluídas. Extraído de app/(platform)/courses/modulos/page.tsx.

'use client';

import { useState } from 'react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { CONTENT_TYPE } from './constants';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FormField } from '@/components/ui/FormField';
import { Card, CardBody } from '@/components/ui/Card';
import { useToast } from '@/providers/ToastProvider';
import type { LessonProgress } from './types';

interface ProgressModalProps {
  onClose: () => void;
  onMarked: () => void;
}

export function ProgressModal({ onClose, onMarked }: ProgressModalProps) {
  const notify = useToast();
  const [enrollmentId, setEnrollmentId] = useState('');
  const [lessonId, setLessonId] = useState('');

  const progressQuery = useApiMutation(
    (enrId: string) =>
      apiClient.get<LessonProgress[]>(`/lessons/progress/${enrId}`),
    { onError: (e) => notify({ title: e.message, intent: 'danger' }) },
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
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );
  const marking = markCompleteMutation.isPending;
  const markComplete = () => {
    if (enrollmentId && lessonId) markCompleteMutation.mutate(undefined);
  };

  const completedCount = progress.filter((p) => p.completed).length;

  return (
    <div
      className="fixed inset-0 z-500 bg-black/45 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-2xl max-h-[90vh] overflow-auto shadow-elevated"
        onClick={(e) => e.stopPropagation()}
      >
        <CardBody className="flex flex-col gap-5">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-ink">
              Progresso de Matrícula
            </h2>
            <button
              onClick={onClose}
              aria-label="Fechar"
              className="text-2xl text-ink-faint hover:text-ink transition-colors"
            >
              ×
            </button>
          </div>

          {/* Marcar como concluída */}
          <div className="p-4 bg-surface-sunken rounded-lg">
            <h3 className="m-0 mb-3 text-sm font-bold text-ink">
              ✅ Marcar Lição como Concluída
            </h3>
            <div className="grid grid-cols-3 gap-3 items-end">
              <FormField label="ID Matrícula" htmlFor="prog-enrollment">
                <Input
                  id="prog-enrollment"
                  type="number"
                  value={enrollmentId}
                  onChange={(e) => setEnrollmentId(e.target.value)}
                  placeholder="Ex: 1"
                />
              </FormField>
              <FormField label="ID Lição" htmlFor="prog-lesson">
                <Input
                  id="prog-lesson"
                  type="number"
                  value={lessonId}
                  onChange={(e) => setLessonId(e.target.value)}
                  placeholder="Ex: 3"
                />
              </FormField>
              <Button
                onClick={markComplete}
                disabled={marking || !enrollmentId || !lessonId}
                intent="primary"
                loading={marking}
                className="w-full"
              >
                ✅ Marcar
              </Button>
            </div>
          </div>

          {/* Ver progresso */}
          <div>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <FormField
                  label="Ver Progresso (ID Matrícula)"
                  htmlFor="prog-view-enrollment"
                >
                  <Input
                    id="prog-view-enrollment"
                    type="number"
                    value={enrollmentId}
                    onChange={(e) => setEnrollmentId(e.target.value)}
                    placeholder="Ex: 1"
                  />
                </FormField>
              </div>
              <Button
                onClick={loadProgress}
                disabled={loading || !enrollmentId}
                intent="ghost"
              >
                🔍 Ver
              </Button>
            </div>
          </div>

          {progress.length > 0 && (
            <div>
              <div className="flex items-center gap-3 p-3 bg-info-subtle rounded-lg border border-info mb-3">
                <p className="m-0 text-sm font-bold text-info-ink">
                  {completedCount} / {progress.length} lições concluídas
                </p>
                <div className="flex-1 h-1.5 bg-info rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{
                      width: `${progress.length ? (completedCount / progress.length) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {progress.map((p) => {
                  const ct = CONTENT_TYPE[p.lesson.type] ?? {
                    icon: '📖',
                    color: '#64748b',
                    bg: '#f8fafc',
                    label: p.lesson.type,
                  };
                  return (
                    <div
                      key={p.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        p.completed
                          ? 'bg-success-subtle border-success'
                          : 'bg-surface-sunken border-border'
                      }`}
                    >
                      <span className="text-lg">{ct.icon}</span>
                      <div className="flex-1">
                        <p className="m-0 text-sm font-semibold text-ink">
                          {p.lesson.title}
                        </p>
                        <p className="m-0 mt-0.5 text-xs text-ink-faint">
                          ID: {p.lessonId} · {ct.label}
                        </p>
                      </div>
                      {p.completed ? (
                        <span className="text-xs font-bold text-success">
                          ✅{' '}
                          {p.completedAt
                            ? new Date(p.completedAt).toLocaleDateString(
                                'pt-PT',
                              )
                            : 'Concluída'}
                        </span>
                      ) : (
                        <span className="text-xs text-ink-faint">Pendente</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
